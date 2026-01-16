// main.js
class LambdaTranspiler {
    constructor() {
        this.combinations = new Map();
    }

    transpile(program) {
        const { lines, comments } = this.parseLinesWithComments(program);
        let output = [];

        output.push(
            `// Compiled on ${new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
            })} from λ calculus`,
        );

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (comments[i]) {
                output.push(comments[i].join("\n"));
            }
            if (
                line.includes(":=") && !line.startsWith("#") &&
                !line.startsWith("?") && !line.startsWith("@") && !line.startsWith("!")
            ) {
                const [name, expr] = line.split(":=").map((s) => s.trim());
                if (!/^[A-Z]/.test(name)) {
                    throw new Error(
                        `Combination '${name}' must start with a capital letter`,
                    );
                }
                const transpiledExpr = this.transpileExpression(expr);
                output.push(`const ${name} = ${transpiledExpr};`);
                this.combinations.set(name, transpiledExpr);
            } else if (line.startsWith("#")) {
                const expr = line.slice(1).trim();
                output.push(
                    `console.log(toNumber(${this.transpileExpression(expr)}));`,
                );
            } else if (line.startsWith("?")) {
                const expr = line.slice(1).trim();
                output.push(
                    `console.log(toBoolean(${this.transpileExpression(expr)}));`,
                );
            } else if (line.startsWith("@")) {
                const text = line.slice(1).trim();
                output.push(`console.log("%c${text}", "color: blue");`);
            } else if (line.startsWith("!")) {
                const expr = line.slice(1).trim();
                output.push(`console.log((${this.transpileExpression(expr)}).toString());`);
            } else if (
                line && !line.includes(":=") && !line.startsWith("#") &&
                !line.startsWith("?") && !line.startsWith("@") && !line.startsWith("!")
            ) {
                output.push(this.transpileExpression(line));
            }
        }

        const fullOutput = [];
        let definitionsDone = false;
        for (const line of output) {
            if (
                !definitionsDone && !line.includes("const") &&
                !line.startsWith("//")
            ) {
                fullOutput.push(this.toNumberFunction());
                fullOutput.push(this.toBooleanFunction());
                definitionsDone = true;
            }
            fullOutput.push(line);
        }
        if (!definitionsDone) {
            fullOutput.push(this.toNumberFunction());
            fullOutput.push(this.toBooleanFunction());
        }

        return fullOutput.join("\n").trim();
    }

    parseLinesWithComments(program) {
        const lines = [];
        const comments = [];
        let currentComments = [];
        let buffer = "";

        const addLine = () => {
            if (buffer.trim()) {
                lines.push(buffer.trim());
                comments.push(currentComments.length ? currentComments : null);
                currentComments = [];
            } else if (currentComments.length) {
                lines.push("");
                comments.push(currentComments);
                currentComments = [];
            }
            buffer = "";
        };

        for (let i = 0; i < program.length; i++) {
            if (
                program[i] === "/" && i + 1 < program.length &&
                program[i + 1] === "/"
            ) {
                addLine();
                buffer = "";
                i += 2;
                while (i < program.length && program[i] !== "\n") {
                    buffer += program[i];
                    i++;
                }
                currentComments.push(`//${buffer}`);
                buffer = "";
            } else if (program[i] === "\n") {
                addLine();
            } else {
                buffer += program[i];
            }
        }

        addLine();

        return { lines, comments };
    }

    parseExpression(expr) {
        if (!expr || typeof expr !== "string") {
            throw new Error("Invalid expression: expression must be a non-empty string");
        }
        expr = expr.trim();

        if (!expr.startsWith("$")) {
            return this.transpileExpression(expr);
        }

        const parts = expr.slice(1).split(".");
        if (parts.length < 2) {
            throw new Error(`Malformed lambda expression: ${expr}`);
        }

        let params = [];
        let bodyIndex = 0;
        for (let i = 0; i < parts.length - 1; i++) {
            if (/^[a-z]+$/.test(parts[i])) {
                params.push(parts[i]);
                bodyIndex = i + 1;
            } else {
                break;
            }
        }
        let body = parts.slice(bodyIndex).join(".").trim();

        if (params.length === 0) {
            throw new Error(`No valid parameters in lambda expression: ${expr}`);
        }

        let allParams = [];
        params.forEach((param) => {
            if (param.length > 1) {
                allParams.push(...param.split(""));
            } else {
                allParams.push(param);
            }
        });

        // Special handling for Z combinator
        if (body.includes("x x y") && body.includes("f ($y. x x y)")) {
            let result = this.transpileApplication(body);
            for (let i = allParams.length - 1; i >= 0; i--) {
                const param = allParams[i];
                if (!/^[a-z]$/.test(param)) {
                    throw new Error(`Parameter '${param}' must be a single lowercase letter`);
                }
                result = `(${param}) => ${result}`;
            }
            return result;
        }

        let result = this.transpileApplication(body);
        for (let i = allParams.length - 1; i >= 0; i--) {
            const param = allParams[i];
            if (!/^[a-z]$/.test(param)) {
                throw new Error(`Parameter '${param}' must be a single lowercase letter`);
            }
            result = `(${param}) => ${result}`;
        }
        return result;
    }

    transpileApplication(body) {
        const tokens = this.tokenize(body);
        if (tokens.length === 1) {
            if (tokens[0].startsWith("$")) {
                return this.parseExpression(tokens[0]);
            } else if (tokens[0].startsWith("(") && tokens[0].endsWith(")")) {
                return this.transpileExpression(tokens[0].slice(1, -1).trim());
            }
            return tokens[0];
        }

        let result = "";
        for (let i = 0; i < tokens.length; i++) {
            let token = tokens[i];
            if (token.startsWith("$")) {
                token = this.parseExpression(token);
            } else if (token.startsWith("(") && token.endsWith(")")) {
                token = this.transpileExpression(token.slice(1, -1).trim());
            }
            
            // If token is an arrow function expression, wrap in parentheses for correct application
            if (token.includes("=>") && !/^\(.*\)=>/.test(token.trim())) {
                token = `(${token})`;
            }

            if (i === 0) {
                result = token;
            } else {
                result = `${result}(${token})`;
            }
        }
        return result;
    }

    transpileExpression(expr) {
        if (!expr || typeof expr !== "string") {
            throw new Error("Invalid expression: expression must be a non-empty string");
        }
        expr = expr.trim();

        if (expr.startsWith("$")) {
            return this.parseExpression(expr);
        }

        if (expr.startsWith("(") && expr.endsWith(")")) {
            const innerExpr = expr.slice(1, -1).trim();
            if (innerExpr.startsWith("$")) {
                return this.parseExpression(innerExpr);
            }
            return this.transpileExpression(innerExpr);
        }

        const tokens = this.tokenize(expr);
        if (tokens.length === 0) {
            throw new Error(`Empty expression: ${expr}`);
        }

        let result = tokens[0];
        if (result.startsWith("(") && result.endsWith(")")) {
            const inner = result.slice(1, -1).trim();
            result = inner.startsWith("$")
                ? this.parseExpression(inner)
                : this.transpileExpression(inner);
        } else if (result.startsWith("$")) {
            result = this.parseExpression(result);
        } else if (!/^[a-z]$/.test(result) && !this.combinations.has(result)) {
            throw new Error(`Unknown combination or invalid variable '${result}'`);
        }

        for (let i = 1; i < tokens.length; i++) {
            let arg = tokens[i];
            if (arg.startsWith("(") && arg.endsWith(")")) {
                const innerArg = arg.slice(1, -1).trim();
                arg = innerArg.startsWith("$")
                    ? this.parseExpression(innerArg)
                    : this.transpileExpression(innerArg);
            } else if (arg.startsWith("$")) {
                arg = this.parseExpression(arg);
            } else if (!/^[a-z]$/.test(arg) && !this.combinations.has(arg)) {
                throw new Error(`Invalid argument '${arg}'`);
            }
            result = `${result}(${arg})`;
        }

        return result;
    }

    tokenize(expr) {
        const tokens = [];
        let currentToken = "";
        let parenDepth = 0;

        for (let i = 0; i < expr.length; i++) {
            const char = expr[i];
            if (char === "(") {
                parenDepth++;
                currentToken += char;
            } else if (char === ")") {
                parenDepth--;
                currentToken += char;
                if (parenDepth === 0 && currentToken) {
                    tokens.push(currentToken);
                    currentToken = "";
                } else if (parenDepth < 0) {
                    throw new Error(`Unmatched closing parenthesis in '${expr}'`);
                }
            } else if (char === " " && parenDepth === 0) {
                if (currentToken) {
                    tokens.push(currentToken);
                    currentToken = "";
                }
            } else {
                currentToken += char;
            }
        }
        if (currentToken) {
            tokens.push(currentToken);
        }
        if (parenDepth > 0) {
            throw new Error(`Unmatched opening parenthesis in '${expr}'`);
        }
        return tokens.filter(Boolean);
    }

    toNumberFunction() {
        return `
      function toNumber(church) {
        return church(n => n + 1)(0);
      }
    `;
    }

    toBooleanFunction() {
        return `
      function toBoolean(church) {
        return church("True")("False");
      }
    `;
    }
}

// Handle command-line argument
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
    console.error('Error:', error.message);
    console.log("%cFAILED! BAD! BAD! BAD!", "color: red");
    Deno.exit(1);
}