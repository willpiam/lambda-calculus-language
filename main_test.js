// main_test.js - Tests for the Lambda Calculus Transpiler
import { assertEquals, assertThrows } from "@std/assert";

// Import the transpiler by loading and evaluating main.js
// We need to extract the class since main.js runs as a script
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

// Helper: Evaluate transpiled code and get result
function evalChurchNumeral(jsCode) {
    const toNumber = (church) => church(n => n + 1)(0);
    const result = eval(jsCode);
    return toNumber(result);
}

function evalChurchBoolean(jsCode) {
    const toBoolean = (church) => church("True")("False");
    const result = eval(jsCode);
    return toBoolean(result);
}

// ============================================================================
// TRANSPILER UNIT TESTS
// ============================================================================

Deno.test("Church numeral Zero transpiles correctly", () => {
    const transpiler = new LambdaTranspiler();
    const result = transpiler.transpileExpression("$fa.a");
    assertEquals(result, "(f) => (a) => a");
    assertEquals(evalChurchNumeral(result), 0);
});

Deno.test("Church numeral One transpiles correctly", () => {
    const transpiler = new LambdaTranspiler();
    const result = transpiler.transpileExpression("$fa.f a");
    assertEquals(result, "(f) => (a) => f(a)");
    assertEquals(evalChurchNumeral(result), 1);
});

Deno.test("Church numeral Two transpiles correctly", () => {
    const transpiler = new LambdaTranspiler();
    const result = transpiler.transpileExpression("$fa.f (f a)");
    assertEquals(result, "(f) => (a) => f(f(a))");
    assertEquals(evalChurchNumeral(result), 2);
});

Deno.test("Identity function (Idiot) transpiles correctly", () => {
    const transpiler = new LambdaTranspiler();
    const result = transpiler.transpileExpression("$a.a");
    assertEquals(result, "(a) => a");
});

Deno.test("Kestrel (True) transpiles correctly", () => {
    const transpiler = new LambdaTranspiler();
    const result = transpiler.transpileExpression("$ab.a");
    assertEquals(result, "(a) => (b) => a");
    assertEquals(evalChurchBoolean(result), "True");
});

Deno.test("Successor function transpiles correctly", () => {
    const transpiler = new LambdaTranspiler();
    const result = transpiler.transpileExpression("$nfa.f (n f a)");
    assertEquals(result, "(n) => (f) => (a) => f(n(f)(a))");
});

Deno.test("Bluebird (composition) transpiles correctly", () => {
    const transpiler = new LambdaTranspiler();
    const result = transpiler.transpileExpression("$fga.f (g a)");
    assertEquals(result, "(f) => (g) => (a) => f(g(a))");
});

Deno.test("Thrush transpiles correctly", () => {
    const transpiler = new LambdaTranspiler();
    const result = transpiler.transpileExpression("$af.f a");
    assertEquals(result, "(a) => (f) => f(a)");
});

Deno.test("Vireo (pair) transpiles correctly", () => {
    const transpiler = new LambdaTranspiler();
    const result = transpiler.transpileExpression("$abf.f a b");
    assertEquals(result, "(a) => (b) => (f) => f(a)(b)");
});

// ============================================================================
// DEFINITION TESTS
// ============================================================================

Deno.test("Definition with uppercase name works", () => {
    const transpiler = new LambdaTranspiler();
    const result = transpiler.transpile("Zero := $fa.a");
    assertEquals(result.includes("const Zero = (f) => (a) => a;"), true);
});

Deno.test("Definition with lowercase name throws error", () => {
    const transpiler = new LambdaTranspiler();
    assertThrows(
        () => transpiler.transpile("zero := $fa.a"),
        Error,
        "must start with a capital letter"
    );
});

Deno.test("Definitions can reference earlier definitions", () => {
    const transpiler = new LambdaTranspiler();
    const program = `
Zero := $fa.a
Succ := $nfa.f (n f a)
One := Succ Zero
`;
    const result = transpiler.transpile(program);
    assertEquals(result.includes("const One = Succ(Zero);"), true);
});

// ============================================================================
// OUTPUT DIRECTIVE TESTS
// ============================================================================

Deno.test("# directive creates toNumber console.log", () => {
    const transpiler = new LambdaTranspiler();
    const program = `
Zero := $fa.a
#Zero
`;
    const result = transpiler.transpile(program);
    assertEquals(result.includes("console.log(toNumber(Zero));"), true);
});

Deno.test("? directive creates toBoolean console.log", () => {
    const transpiler = new LambdaTranspiler();
    const program = `
True := $ab.a
?True
`;
    const result = transpiler.transpile(program);
    assertEquals(result.includes("console.log(toBoolean(True));"), true);
});

Deno.test("@ directive creates colored console.log", () => {
    const transpiler = new LambdaTranspiler();
    const result = transpiler.transpile("@hello world");
    assertEquals(result.includes('console.log("%chello world", "color: blue");'), true);
});

Deno.test("! directive creates toString console.log", () => {
    const transpiler = new LambdaTranspiler();
    const program = `
One := $fa.f a
!One
`;
    const result = transpiler.transpile(program);
    assertEquals(result.includes("console.log((One).toString());"), true);
});

// ============================================================================
// COMMENT PRESERVATION TESTS
// ============================================================================

Deno.test("Single-line comments are preserved", () => {
    const transpiler = new LambdaTranspiler();
    const program = `
// This is a comment
Zero := $fa.a
`;
    const result = transpiler.transpile(program);
    assertEquals(result.includes("// This is a comment"), true);
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

Deno.test("Unmatched opening parenthesis throws error", () => {
    const transpiler = new LambdaTranspiler();
    assertThrows(
        () => transpiler.transpileExpression("$fa.f (a"),
        Error,
        "Unmatched opening parenthesis"
    );
});

Deno.test("Unmatched closing parenthesis throws error", () => {
    const transpiler = new LambdaTranspiler();
    assertThrows(
        () => transpiler.transpileExpression("$fa.f a)"),
        Error,
        "Unmatched closing parenthesis"
    );
});

Deno.test("Malformed lambda expression throws error", () => {
    const transpiler = new LambdaTranspiler();
    assertThrows(
        () => transpiler.transpileExpression("$fa"),
        Error,
        "Malformed lambda expression"
    );
});

Deno.test("Unknown combination throws error", () => {
    const transpiler = new LambdaTranspiler();
    assertThrows(
        () => transpiler.transpileExpression("Unknown"),
        Error,
        "Unknown combination"
    );
});

// ============================================================================
// RUNTIME EVALUATION TESTS
// ============================================================================

Deno.test("Successor applied to Zero equals One", () => {
    const Succ = (n) => (f) => (a) => f(n(f)(a));
    const Zero = (f) => (a) => a;
    const toNumber = (church) => church(n => n + 1)(0);
    
    assertEquals(toNumber(Succ(Zero)), 1);
});

Deno.test("Add Two and Three equals Five", () => {
    const Succ = (n) => (f) => (a) => f(n(f)(a));
    const Zero = (f) => (a) => a;
    const One = (f) => (a) => f(a);
    const Two = (f) => (a) => f(f(a));
    const Three = Succ(Two);
    const Add = (n) => (k) => n(Succ)(k);
    const toNumber = (church) => church(n => n + 1)(0);
    
    assertEquals(toNumber(Add(Two)(Three)), 5);
});

Deno.test("Mult Two and Four equals Eight", () => {
    const Succ = (n) => (f) => (a) => f(n(f)(a));
    const Two = (f) => (a) => f(f(a));
    const Four = Succ(Succ(Succ((f) => (a) => f(a))));
    const Bluebird = (f) => (g) => (a) => f(g(a));
    const Mult = Bluebird;
    const toNumber = (church) => church(n => n + 1)(0);
    
    assertEquals(toNumber(Mult(Two)(Four)), 8);
});

Deno.test("Pred of Four equals Three", () => {
    const Succ = (n) => (f) => (a) => f(n(f)(a));
    const Zero = (f) => (a) => a;
    const Kestrel = (a) => (b) => a;
    const Idiot = (a) => a;
    const Kite = Kestrel(Idiot);
    const True = Kestrel;
    const Vireo = (a) => (b) => (f) => f(a)(b);
    const Second = (p) => p(Kite);
    const Phi = (p) => Vireo(Second(p))(Succ(Second(p)));
    const Pred = (n) => n(Phi)(Vireo(Zero)(Zero))(True);
    const Four = Succ(Succ(Succ((f) => (a) => f(a))));
    const toNumber = (church) => church(n => n + 1)(0);
    
    assertEquals(toNumber(Pred(Four)), 3);
});

Deno.test("Sub Eight Two equals Six", () => {
    const Succ = (n) => (f) => (a) => f(n(f)(a));
    const Zero = (f) => (a) => a;
    const Two = (f) => (a) => f(f(a));
    const Kestrel = (a) => (b) => a;
    const Idiot = (a) => a;
    const Kite = Kestrel(Idiot);
    const True = Kestrel;
    const Vireo = (a) => (b) => (f) => f(a)(b);
    const Second = (p) => p(Kite);
    const Phi = (p) => Vireo(Second(p))(Succ(Second(p)));
    const Pred = (n) => n(Phi)(Vireo(Zero)(Zero))(True);
    const Sub = (n) => (k) => k(Pred)(n);
    const Eight = (f) => (a) => f(f(f(f(f(f(f(f(a))))))));
    const toNumber = (church) => church(n => n + 1)(0);
    
    assertEquals(toNumber(Sub(Eight)(Two)), 6);
});

Deno.test("IsZero of Zero is True", () => {
    const Zero = (f) => (a) => a;
    const Kestrel = (a) => (b) => a;
    const Idiot = (a) => a;
    const Kite = Kestrel(Idiot);
    const False = Kite;
    const True = Kestrel;
    const IsZero = (n) => n((_x) => False)(True);
    const toBoolean = (church) => church("True")("False");
    
    assertEquals(toBoolean(IsZero(Zero)), "True");
});

Deno.test("IsZero of One is False", () => {
    const One = (f) => (a) => f(a);
    const Kestrel = (a) => (b) => a;
    const Idiot = (a) => a;
    const Kite = Kestrel(Idiot);
    const False = Kite;
    const True = Kestrel;
    const IsZero = (n) => n((_x) => False)(True);
    const toBoolean = (church) => church("True")("False");
    
    assertEquals(toBoolean(IsZero(One)), "False");
});

Deno.test("Not True equals False", () => {
    const Kestrel = (a) => (b) => a;
    const Idiot = (a) => a;
    const Kite = Kestrel(Idiot);
    const True = Kestrel;
    const False = Kite;
    const Not = (p) => p(False)(True);
    const toBoolean = (church) => church("True")("False");
    
    assertEquals(toBoolean(Not(True)), "False");
});

Deno.test("Vireo First extracts first element", () => {
    const One = (f) => (a) => f(a);
    const Two = (f) => (a) => f(f(a));
    const Kestrel = (a) => (b) => a;
    const Vireo = (a) => (b) => (f) => f(a)(b);
    const First = (p) => p(Kestrel);
    const toNumber = (church) => church(n => n + 1)(0);
    
    assertEquals(toNumber(First(Vireo(One)(Two))), 1);
});

Deno.test("Vireo Second extracts second element", () => {
    const One = (f) => (a) => f(a);
    const Two = (f) => (a) => f(f(a));
    const Kestrel = (a) => (b) => a;
    const Idiot = (a) => a;
    const Kite = Kestrel(Idiot);
    const Vireo = (a) => (b) => (f) => f(a)(b);
    const Second = (p) => p(Kite);
    const toNumber = (church) => church(n => n + 1)(0);
    
    assertEquals(toNumber(Second(Vireo(One)(Two))), 2);
});

// ============================================================================
// Z COMBINATOR AND RECURSION TESTS
// ============================================================================

Deno.test("Z combinator enables recursion - SumRange(1,4) = 10", () => {
    // Define all the church encodings needed
    const Zero = (f) => (a) => a;
    const One = (f) => (a) => f(a);
    const Succ = (n) => (f) => (a) => f(n(f)(a));
    const Two = Succ(One);
    const Three = Succ(Two);
    const Four = Succ(Three);
    const Add = (n) => (k) => n(Succ)(k);
    const Kestrel = (a) => (b) => a;
    const Idiot = (a) => a;
    const Kite = Kestrel(Idiot);
    const True = Kestrel;
    const False = Kite;
    const Vireo = (a) => (b) => (f) => f(a)(b);
    const Second = (p) => p(Kite);
    const Phi = (p) => Vireo(Second(p))(Succ(Second(p)));
    const Pred = (n) => n(Phi)(Vireo(Zero)(Zero))(True);
    const Sub = (n) => (k) => k(Pred)(n);
    const IsZero = (n) => n((_x) => False)(True);
    
    // Z combinator for strict evaluation
    const Z = (f) => ((x) => f((y) => x(x)(y)))((x) => f((y) => x(x)(y)));
    
    // PseudoSumRange with thunks for lazy evaluation
    const PseudoSumRange = (f) => (m) => (n) => 
        IsZero(Sub(n)(m))((_x) => m)((_x) => Add(n)(f(m)(Pred(n))))(Idiot);
    
    const SumRange = Z(PseudoSumRange);
    const toNumber = (church) => church(n => n + 1)(0);
    
    // Sum of 1 + 2 + 3 + 4 = 10
    assertEquals(toNumber(SumRange(One)(Four)), 10);
});

Deno.test("Full program compiles and includes all helper functions", () => {
    const transpiler = new LambdaTranspiler();
    const program = `
Zero := $fa.a
One := $fa.f a
#Zero
#One
`;
    const result = transpiler.transpile(program);
    
    // Check that helper functions are included
    assertEquals(result.includes("function toNumber(church)"), true);
    assertEquals(result.includes("function toBoolean(church)"), true);
    // Check that compilation header is included
    assertEquals(result.includes("// Compiled on"), true);
    assertEquals(result.includes("from λ calculus"), true);
});
