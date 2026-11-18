// Shared by the Deno CLI (main.js) and the browser runner (app.js).
// Expressions have only three forms: variables, lambdas, and applications.
class ExpressionParser {
    constructor(tokens) {
        this.tokens = tokens;
        this.position = 0;
    }

    parse() {
        const expression = this.expression();
        if (this.position < this.tokens.length) {
            throw new Error("Unmatched closing parenthesis");
        }
        return expression;
    }

    expression() {
        if (this.position === this.tokens.length || this.tokens[this.position] === ")") {
            throw new Error("Empty expression");
        }

        let result = this.term();
        while (this.position < this.tokens.length && this.tokens[this.position] !== ")") {
            result = { type: "application", fn: result, argument: this.term() };
        }
        return result;
    }

    term() {
        const token = this.tokens[this.position++];
        if (token === "$") {
            const params = this.tokens[this.position++];
            if (!params || !/^[a-z]+$/.test(params)) {
                throw new Error("No valid parameters in lambda expression");
            }
            if (this.tokens[this.position++] !== ".") {
                throw new Error("Malformed lambda expression: expected '.' after parameters");
            }

            // A lambda consumes its whole body up to the enclosing ')' or end.
            let body = this.expression();
            for (let i = params.length - 1; i >= 0; i--) {
                body = { type: "lambda", parameter: params[i], body };
            }
            return body;
        }

        if (token === "(") {
            if (this.position === this.tokens.length) {
                throw new Error("Unmatched opening parenthesis");
            }
            const expression = this.expression();
            if (this.tokens[this.position++] !== ")") {
                throw new Error("Unmatched opening parenthesis");
            }
            return expression;
        }

        if (token === ")") {
            throw new Error("Unmatched closing parenthesis");
        }
        if (/^[a-z]$/.test(token) || /^[A-Z][A-Za-z0-9_]*$/.test(token)) {
            return { type: "variable", name: token };
        }
        throw new Error(`Invalid variable or unexpected token '${token}'`);
    }
}

export class LambdaTranspiler {
    constructor(options = {}) {
        this.combinations = new Map();
        this.coloredText = options.coloredText ?? true;
    }

    transpile(program) {
        // Each program has its own named definitions, even when this instance is reused.
        this.combinations.clear();
        const { lines, comments } = this.parseLinesWithComments(program);
        const output = [];

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
                !line.startsWith("?") && !line.startsWith("@") && !line.startsWith("!") &&
                !line.startsWith("*") && !line.startsWith("~")
            ) {
                const assignment = line.indexOf(":=");
                const name = line.slice(0, assignment).trim();
                const expr = line.slice(assignment + 2).trim();
                if (!/^[A-Z]/.test(name)) {
                    throw new Error(
                        `Combination '${name}' must start with a capital letter`,
                    );
                }
                if (!/^[A-Z][A-Za-z0-9_]*$/.test(name)) {
                    throw new Error(`Invalid combination name '${name}'`);
                }
                if (this.combinations.has(name)) {
                    throw new Error(`Combination '${name}' is already defined`);
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
                const escaped = this.escapeForDoubleQuotedString(text);
                if (this.coloredText) {
                    output.push(`console.log("%c${escaped}", "color: blue");`);
                } else {
                    output.push(`console.log("${escaped}");`);
                }
            } else if (line.startsWith("!")) {
                const expr = line.slice(1).trim();
                output.push(`console.log((${this.transpileExpression(expr)}).toString());`);
            } else if (line.startsWith("*") || line.startsWith("~")) {
                const textOutput = line.startsWith("~");
                const listExpr = this.transpileExpression(line.slice(1).trim());
                output.push(
`(function(list) {
  const _isNil = (l) => {
    const testFn = (a) => (b) => ({ _cons: true, head: a, tail: b });
    const result = l(testFn);
    return !result._cons;
  };
  const _first = (p) => p((a) => (b) => a);
  const _second = (p) => p((a) => (b) => b);
  const arr = [];
  let current = list;
  while (!_isNil(current)) {
    arr.push(${textOutput ? "String.fromCodePoint(toNumber(_first(current)))" : "toNumber(_first(current))"});
    current = _second(current);
  }
  console.log(${textOutput ? 'arr.join("")' : "arr"});
})(${listExpr});`
                );
            } else if (line) {
                output.push(`${this.transpileExpression(line)};`);
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
        return this.transpileExpression(expr);
    }

    transpileApplication(body) {
        return this.transpileExpression(body);
    }

    transpileExpression(expr) {
        if (!expr || typeof expr !== "string") {
            throw new Error("Invalid expression: expression must be a non-empty string");
        }
        expr = expr.trim();

        const expression = new ExpressionParser(this.tokenize(expr)).parse();
        this.validateExpression(expression);
        return this.emitExpression(expression);
    }

    tokenize(expr) {
        const tokens = [];
        const tokenPattern = /[A-Za-z][A-Za-z0-9_]*|[$.()]/y;
        for (let i = 0; i < expr.length;) {
            if (/\s/.test(expr[i])) {
                i++;
                continue;
            }
            tokenPattern.lastIndex = i;
            const match = tokenPattern.exec(expr);
            if (!match) {
                throw new Error(`Unexpected character '${expr[i]}' at column ${i + 1}`);
            }
            tokens.push(match[0]);
            i = tokenPattern.lastIndex;
        }
        return tokens;
    }

    validateExpression(expression) {
        switch (expression.type) {
            case "variable":
                if (/^[A-Z]/.test(expression.name) && !this.combinations.has(expression.name)) {
                    throw new Error(`Unknown combination '${expression.name}'`);
                }
                break;
            case "lambda":
                this.validateExpression(expression.body);
                break;
            case "application":
                this.validateExpression(expression.fn);
                this.validateExpression(expression.argument);
                break;
        }
    }

    emitExpression(expression) {
        switch (expression.type) {
            case "variable":
                return expression.name;
            case "lambda":
                return `(${expression.parameter}) => ${this.emitExpression(expression.body)}`;
            case "application": {
                const fn = this.emitExpression(expression.fn);
                const callee = expression.fn.type === "lambda" ? `(${fn})` : fn;
                return `${callee}(${this.emitExpression(expression.argument)})`;
            }
        }
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

    escapeForDoubleQuotedString(value) {
        return value
            .replace(/\\/g, "\\\\")
            .replace(/"/g, "\\\"")
            .replace(/\r/g, "\\r")
            .replace(/\n/g, "\\n");
    }
}
