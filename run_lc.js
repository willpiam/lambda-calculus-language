// run_lc.js
// Usage:
//   deno task lc -- <file.lc>
//
// This transpiles <file.lc> to output.js (via main.js) and then runs output.js.

const args = [...Deno.args];
// When invoked via `deno task <name> -- <args...>`, Deno passes a literal "--"
// through to the task command. Strip it if present.
if (args[0] === "--") args.shift();

if (args.length === 0) {
  console.error("Usage: deno task lc -- <file.lc>");
  Deno.exit(1);
}

const filename = args[0];

const denoExe = Deno.execPath();

const transpile = new Deno.Command(denoExe, {
  args: ["run", "--allow-read", "--allow-write", "main.js", filename],
  stdout: "inherit",
  stderr: "inherit",
});

const transpileStatus = await transpile.spawn().status;
if (!transpileStatus.success) {
  Deno.exit(transpileStatus.code);
}

const runOut = new Deno.Command(denoExe, {
  args: ["run", "output.js"],
  stdout: "inherit",
  stderr: "inherit",
});

const runStatus = await runOut.spawn().status;
Deno.exit(runStatus.code);

