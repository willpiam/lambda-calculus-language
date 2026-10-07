#!/usr/bin/env python3
"""Upload website/ to the site over plain FTP. Credentials from .env."""

from __future__ import annotations

import argparse
import os
import sys
from ftplib import FTP, error_perm
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "website"

# Paths/names never uploaded (dotfiles are also skipped).
SKIP_NAMES = frozenset({"scripts", "__pycache__", "node_modules", "dist"})


def env_required(name: str) -> str:
    value = (os.getenv(name) or "").strip().strip("'").strip('"')
    if not value:
        raise SystemExit(f"Missing required env var: {name}")
    return value


def env_optional(name: str, default: str = "") -> str:
    return (os.getenv(name) or default).strip().strip("'").strip('"')


def skip_name(name: str) -> bool:
    return name in (".", "..") or name.startswith(".") or name in SKIP_NAMES


def local_tree(root: Path) -> tuple[set[str], set[str]]:
    files: set[str] = set()
    dirs: set[str] = set()
    for path in root.rglob("*"):
        rel = path.relative_to(root)
        if any(skip_name(part) for part in rel.parts):
            continue
        posix = rel.as_posix()
        if path.is_dir():
            dirs.add(posix)
            continue
        if not path.is_file():
            continue
        files.add(posix)
        parent = rel.parent
        while parent.parts:
            dirs.add(parent.as_posix())
            parent = parent.parent
    return files, dirs


def ftp_list(ftp: FTP, rel_dir: str) -> list[tuple[str, bool]]:
    path = rel_dir or "."
    try:
        entries: list[tuple[str, bool]] = []
        for name, facts in ftp.mlsd(path):
            if skip_name(name):
                continue
            entries.append((name, facts.get("type") == "dir"))
        return entries
    except (error_perm, AttributeError, OSError, ValueError):
        pass

    try:
        raw_names = ftp.nlst(path)
    except error_perm:
        return []

    cwd = ftp.pwd()
    result: list[tuple[str, bool]] = []
    for raw in raw_names:
        name = raw.rstrip("/").split("/")[-1]
        if skip_name(name):
            continue
        child = f"{rel_dir}/{name}" if rel_dir else name
        try:
            ftp.cwd(child)
            ftp.cwd(cwd)
            result.append((name, True))
        except error_perm:
            result.append((name, False))
    return result


def remote_tree(ftp: FTP) -> tuple[set[str], set[str]]:
    files: set[str] = set()
    dirs: set[str] = set()

    def walk(rel: str) -> None:
        for name, is_dir in ftp_list(ftp, rel):
            child = f"{rel}/{name}" if rel else name
            if is_dir:
                dirs.add(child)
                walk(child)
            else:
                files.add(child)

    walk("")
    return files, dirs


def ensure_remote_dir(ftp: FTP, rel: str, known: set[str]) -> None:
    if not rel or rel in known:
        return
    parent = Path(rel).parent.as_posix()
    if parent != ".":
        ensure_remote_dir(ftp, parent, known)
    try:
        ftp.mkd(rel)
    except error_perm:
        pass
    known.add(rel)


def cwd_remote(ftp: FTP, remote_dir: str) -> None:
    try:
        ftp.cwd(remote_dir)
        return
    except error_perm:
        pass
    ftp.cwd("/")
    for part in (p for p in remote_dir.strip("/").split("/") if p):
        try:
            ftp.cwd(part)
        except error_perm:
            ftp.mkd(part)
            ftp.cwd(part)


def upload_file(ftp: FTP, local: Path, rel: str) -> None:
    with local.open("rb") as handle:
        ftp.storbinary(f"STOR {rel}", handle)


def prune_remote(
    ftp: FTP,
    local_files: set[str],
    local_dirs: set[str],
    remote_files: set[str],
    remote_dirs: set[str],
) -> tuple[int, int]:
    extra_files = sorted(remote_files - local_files)
    extra_dirs = sorted(remote_dirs - local_dirs, key=lambda p: p.count("/"), reverse=True)
    for rel in extra_files:
        print(f"  prune file {rel}")
        ftp.delete(rel)
    for rel in extra_dirs:
        print(f"  prune dir  {rel}")
        try:
            ftp.rmd(rel)
        except error_perm as exc:
            print(f"    skip: {exc}")
    return len(extra_files), len(extra_dirs)


def source_ready() -> None:
    if not SOURCE.is_dir():
        raise SystemExit(f"Source directory not found: {SOURCE}")
    files, _dirs = local_tree(SOURCE)
    if not files:
        raise SystemExit(f"No uploadable files found in {SOURCE}.")


def connect(host: str, port: int, user: str, password: str, remote_dir: str) -> FTP:
    ftp = FTP()
    ftp.connect(host, port, timeout=30)
    ftp.login(user, password)
    ftp.set_pasv(True)
    cwd_remote(ftp, remote_dir)
    return ftp


def deploy(dry_run: bool) -> None:
    host = env_required("FTP_HOST")
    port_raw = env_optional("FTP_PORT", "21")
    try:
        port = int(port_raw)
    except ValueError:
        raise SystemExit(f"FTP_PORT must be an integer, got {port_raw!r}") from None
    user = env_required("FTP_USER")
    remote_dir = env_optional(
        "FTP_REMOTE_DIR", "/williamdoyle.ca/lambda-calculus-language"
    )

    local_files, local_dirs = local_tree(SOURCE)
    print(f"Local:  {SOURCE} ({len(local_files)} files, {len(local_dirs)} dirs)")
    print(f"Remote: {user}@{host}:{port}{remote_dir}")

    if dry_run:
        for rel in sorted(local_dirs):
            print(f"  mkdir {rel}")
        for rel in sorted(local_files):
            print(f"  upload {rel}")
        print("Dry run: would prune remote files/dirs not in local tree (needs a connection).")
        return

    password = env_required("FTP_PASSWORD")
    ftp = connect(host, port, user, password, remote_dir)
    try:
        known_dirs = set()
        for rel in sorted(local_dirs, key=lambda p: p.count("/")):
            ensure_remote_dir(ftp, rel, known_dirs)
            print(f"  mkdir {rel}")
        for rel in sorted(local_files):
            print(f"  upload {rel}")
            upload_file(ftp, SOURCE / rel, rel)
        remote_files, remote_dirs = remote_tree(ftp)
        n_files, n_dirs = prune_remote(
            ftp, local_files, local_dirs, remote_files, remote_dirs
        )
        print(
            f"Done. Uploaded {len(local_files)} files, "
            f"pruned {n_files} files and {n_dirs} dirs."
        )
    finally:
        try:
            ftp.quit()
        except (OSError, EOFError):
            ftp.close()


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Upload website/ files over FTP."
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print the upload plan without connecting.",
    )
    args = parser.parse_args()

    load_dotenv(ROOT / ".env")
    source_ready()
    deploy(dry_run=args.dry_run)


if __name__ == "__main__":
    main()
