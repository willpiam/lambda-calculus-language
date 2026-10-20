"""Unit tests for FTP deploy skip/upload decisions (no network)."""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from deploy_ftp import load_state, upload_decision


class UploadDecisionTest(unittest.TestCase):
    def test_missing_remote_uploads(self) -> None:
        self.assertTrue(
            upload_decision(
                present=False,
                local_size=4,
                remote_size=None,
                local_hash="a",
                saved_hash="a",
                force=False,
            )
        )

    def test_size_mismatch_uploads(self) -> None:
        self.assertTrue(
            upload_decision(
                present=True,
                local_size=5,
                remote_size=4,
                local_hash="a",
                saved_hash="a",
                force=False,
            )
        )

    def test_unknown_remote_size_uploads(self) -> None:
        self.assertTrue(
            upload_decision(
                present=True,
                local_size=4,
                remote_size=None,
                local_hash="a",
                saved_hash="a",
                force=False,
            )
        )

    def test_same_size_without_hash_uploads(self) -> None:
        self.assertTrue(
            upload_decision(
                present=True,
                local_size=4,
                remote_size=4,
                local_hash="abc",
                saved_hash=None,
                force=False,
            )
        )

    def test_same_bytes_skip(self) -> None:
        self.assertFalse(
            upload_decision(
                present=True,
                local_size=4,
                remote_size=4,
                local_hash="abc",
                saved_hash="abc",
                force=False,
            )
        )

    def test_same_size_different_bytes_upload(self) -> None:
        self.assertTrue(
            upload_decision(
                present=True,
                local_size=4,
                remote_size=4,
                local_hash="new",
                saved_hash="old",
                force=False,
            )
        )

    def test_force_uploads(self) -> None:
        self.assertTrue(
            upload_decision(
                present=True,
                local_size=4,
                remote_size=4,
                local_hash="abc",
                saved_hash="abc",
                force=True,
            )
        )


class LoadStateTest(unittest.TestCase):
    def test_rejects_other_target(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "state.json"
            path.write_text(
                json.dumps(
                    {
                        "host": "ftp.example",
                        "remote": "/other",
                        "files": {"index.html": "abc"},
                    }
                ),
                encoding="utf-8",
            )
            self.assertEqual(
                load_state(path, "ftp.example", "/lambda-calculus-language"), {}
            )
            self.assertEqual(
                load_state(path, "ftp.example", "/other"),
                {"index.html": "abc"},
            )


if __name__ == "__main__":
    unittest.main()
