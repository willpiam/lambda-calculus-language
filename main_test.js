// main_test.js - Tests for the Lambda Calculus Transpiler
import { assertEquals, assertThrows } from "@std/assert";
import { LambdaTranspiler } from "./main.js";

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

function runLcProgramString(program) {
    const transpiler = new LambdaTranspiler();
    const jsCode = transpiler.transpile(program);
    const logs = [];
    const originalLog = console.log;
    console.log = (...args) => logs.push(args.join(" "));
    try {
        eval(jsCode);
    } finally {
        console.log = originalLog;
    }
    return logs.join("\n");
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

Deno.test("@ directive escapes quotes in text output", () => {
    const transpiler = new LambdaTranspiler();
    const result = transpiler.transpile('@say "hi"');
    assertEquals(
        result.includes('console.log("%csay \\"hi\\"", "color: blue");'),
        true,
    );
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
// LC STRING PROGRAM TESTS
// ============================================================================

Deno.test("LC string program prints Eight via numeric output", () => {
    const program = `
Eight := $fa.f (f (f (f (f (f (f (f a)))))))
#Eight
`;
    const output = runLcProgramString(program).trim();
    assertEquals(output, "8");
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

Deno.test("IsPrime identifies primes and non-primes", () => {
    const Idiot = (a) => a;
    const Kestrel = (a) => (b) => a;
    const Kite = (a) => (b) => b;
    const True = Kestrel;
    const False = Kite;

    const Zero = (f) => (a) => a;
    const One = (f) => (a) => f(a);
    const Succ = (n) => (f) => (a) => f(n(f)(a));
    const Two = Succ(One);
    const Three = Succ(Two);
    const Four = Succ(Three);
    const Five = Succ(Four);
    const Six = Succ(Five);

    const Vireo = (a) => (b) => (f) => f(a)(b);
    const Second = (p) => p(Kite);
    const Phi = (p) => Vireo(Second(p))(Succ(Second(p)));
    const Pred = (n) => n(Phi)(Vireo(Zero)(Zero))(True);
    const Sub = (n) => (k) => k(Pred)(n);
    const IsZero = (n) => n((_x) => False)(True);
    const Leq = (n) => (m) => IsZero(Sub(n)(m));

    const Z = (f) => ((x) => f((y) => x(x)(y)))((x) => f((y) => x(x)(y)));
    const PseudoMod = (f) => (n) => (d) =>
        Leq(n)(Pred(d))((_x) => n)((_x) => f(Sub(n)(d))(d))(Idiot);
    const Mod = Z(PseudoMod);
    const PseudoPrimeCheck = (f) => (n) => (d) =>
        Leq(n)(d)((_x) => True)((_x) =>
            IsZero(Mod(n)(d))((_y) => False)((_y) => f(n)(Succ(d)))(Idiot)
        )(Idiot);
    const PrimeCheck = Z(PseudoPrimeCheck);
    const IsPrime = (n) => Leq(n)(One)((_x) => False)((_x) => PrimeCheck(n)(Two))(Idiot);

    const toBoolean = (church) => church("True")("False");

    assertEquals(toBoolean(IsPrime(Zero)), "False");
    assertEquals(toBoolean(IsPrime(One)), "False");
    assertEquals(toBoolean(IsPrime(Two)), "True");
    assertEquals(toBoolean(IsPrime(Three)), "True");
    assertEquals(toBoolean(IsPrime(Four)), "False");
    assertEquals(toBoolean(IsPrime(Five)), "True");
    assertEquals(toBoolean(IsPrime(Six)), "False");
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
