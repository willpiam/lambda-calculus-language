// main.js
import { LambdaTranspiler } from "./website/transpiler.js";

export { LambdaTranspiler };

if (import.meta.main) {
    if (Deno.args.length === 0) {
        console.error("Usage: deno run --allow-read --allow-write main.js <filename.lc>");
        Deno.exit(1);
    }

    const filename = Deno.args[0];
    if (!filename.endsWith(".lc")) {
        console.error("Error: File must have a .lc extension");
        Deno.exit(1);
    }

    try {
        const program = Deno.readTextFileSync(filename);
        const transpiler = new LambdaTranspiler();
        const jsCode = transpiler.transpile(program);
        console.log("Generated JavaScript:\n", jsCode);
        Deno.writeTextFileSync("output.js", jsCode);
        console.log(`Transpiled ${filename} to output.js. Run with: deno run output.js`);
    } catch (error) {
        console.error("Error:", error.message);
        console.log("%cFAILED! BAD! BAD! BAD!", "color: red");
        Deno.exit(1);
    }
}
