import { assertEquals, assertThrows } from "@std/assert";
import { LambdaTranspiler } from "./main.js";

const prelude = `
Id := $x.x
Zero := $fa.a
One := $fa.f a
`;

function run(source) {
    const js = new LambdaTranspiler({ coloredText: false }).transpile(source);
    const logs = [];
    new Function("console", `"use strict";\n${js}`)({
        log: (...args) => logs.push(args),
    });
    return logs;
}

Deno.test("parentheses group individual operands and complete applications", () => {
    assertEquals(
        run(
            prelude + `
#(Id) (One)
#((Id One))
#(Id One) (Id One)
#((Id) ((Id) (One)))
`,
        ),
        [[1], [1], [1], [1]],
    );
});

Deno.test("inline lambdas are called before subsequent applications", () => {
    assertEquals(
        run(
            prelude + `
#($x.x) One
#(($x.x) Id) One
#(($xy.x) One) Zero
#Id ($fa.f a)
`,
        ),
        [[1], [1], [1], [1]],
    );
});

Deno.test("application associates left and lambda bodies extend right", () => {
    assertEquals(
        run(
            prelude + `
Choose := $ab.a
Apply := $x.$y.x y
#Choose One Zero
#Apply Id One
#Id $fa.f a
#($x.x One) Id
`,
        ),
        [[1], [1], [1], [1]],
    );
});

Deno.test("lambda parameters use lexical scope and permit shadowing", () => {
    assertEquals(
        run(
            prelude + `
Capture := $xy.x
Shadow := $x.($x.x) x
#Capture One Zero
#Shadow One
#($xx.x) Zero One
`,
        ),
        [[1], [1], [1]],
    );
});

Deno.test("tabs and spaces both separate application terms", () => {
    assertEquals(run(prelude + "#Id\tOne\n#Id \t (One)"), [[1], [1]]);
});

Deno.test("adjacent parenthesized terms are applications", () => {
    assertEquals(run(prelude + "#(Id)(One)\n#Id(One)"), [[1], [1]]);
});

Deno.test("standalone expressions remain separate across source lines", () => {
    assertEquals(
        run(
            prelude + `
Id One
$x.x
($xy.x) One
#One
`,
        ),
        [[1]],
    );
});

Deno.test("empty and malformed expressions are rejected during compilation", () => {
    for (
        const expression of [
            "",
            " ",
            "()",
            "$x.",
            "$xy.",
            "$x.()",
            "$",
            "$x",
            "$X.x",
            "$x.y.z",
            "(x",
            "x)",
            "(x))",
            "((x)",
        ]
    ) {
        assertThrows(
            () => new LambdaTranspiler().transpileExpression(expression),
            Error,
        );
    }
});

Deno.test("all lambda bodies and arguments follow the same token rules", () => {
    for (
        const expression of [
            "42",
            "$x.42",
            "$x.x 42",
            "$x.x + x",
            "$x.console.log(x)",
            "$x.x;",
            "$x.xyz",
            "$x._x",
            "$x.x := x",
        ]
    ) {
        assertThrows(
            () => new LambdaTranspiler().transpileExpression(expression),
            Error,
        );
    }
});

Deno.test("unknown combination references are checked at every nesting level", () => {
    for (
        const expression of [
            "Unknown",
            "$x.Unknown",
            "$x.x Unknown",
            "$x.(Unknown x)",
            "$x.$y.Unknown",
        ]
    ) {
        assertThrows(
            () => new LambdaTranspiler().transpileExpression(expression),
            Error,
            "Unknown combination",
        );
    }
});

Deno.test("definition names are complete identifiers and suffixes cannot be discarded", () => {
    for (
        const source of [
            "Bad-Name := $x.x",
            "Bad Name := $x.x",
            "Bad.name := $x.x",
            "Bad := $x.x := ignored",
            "Bad :=",
            "Bad := $x.x\nBad := $y.y",
        ]
    ) {
        assertThrows(() => new LambdaTranspiler().transpile(source), Error);
    }
    assertEquals(run("Name_1 := $fa.f a\n#Name_1"), [[1]]);
});

Deno.test("a compilation cannot resolve names left over from another program", () => {
    const transpiler = new LambdaTranspiler();
    transpiler.transpile(prelude);
    assertThrows(
        () => transpiler.transpile("#One"),
        Error,
        "Unknown combination",
    );
});

Deno.test("named definitions do not provide implicit recursive bindings", () => {
    assertThrows(
        () => new LambdaTranspiler().transpile("Loop := $x.Loop x"),
        Error,
        "Unknown combination",
    );
});

Deno.test("emitted lambda terms contain only ordinary functions and calls", () => {
    const transpiler = new LambdaTranspiler();
    assertEquals(
        transpiler.transpileExpression(
            "$f.($x.f ($y.x x y)) ($x.f ($y.x x y))",
        ),
        "(f) => ((x) => f((y) => x(x)(y)))((x) => f((y) => x(x)(y)))",
    );
    assertEquals(
        transpiler.transpileExpression("($x.x) ($y.y)"),
        "((x) => x)((y) => y)",
    );
    // Open lambda terms remain open: the compiler does not invent a binding.
    assertEquals(transpiler.transpileExpression("$x.y"), "(x) => y");
});

Deno.test("Church arithmetic and recursion run from LC source under arbitrary names", () => {
    const definitions = `
Id := $a.a
Yes := $ab.a
No := $ab.b
Zero := $fa.a
One := $fa.f a
Succ := $nfa.f (n f a)
Two := Succ One
Three := Succ Two
Four := Succ Three
Add := $mnfa.m f (n f a)
Pair := $abf.f a b
Second := $p.p No
Step := $p.Pair (Second p) (Succ (Second p))
Pred := $n.n Step (Pair Zero Zero) Yes
IsZero := $n.n ($x.No) Yes
`;
    for (const name of ["Z", "Y", "OrdinaryFunction"]) {
        assertEquals(
            run(
                definitions + `
${name} := $f.($x.f ($y.x x y)) ($x.f ($y.x x y))
SumStep := $rn.IsZero n ($x.Zero) ($x.Add n (r (Pred n))) Id
Sum := ${name} SumStep
#Add Two Three
#Sum Four
`,
            ),
            [[5], [10]],
        );
    }
});

Deno.test("ordinary Y still diverges with eager JavaScript application", () => {
    for (const name of ["Y", "Z", "OrdinaryFunction"]) {
        assertThrows(() =>
            run(`
${name} := $f.($x.f (x x)) ($x.f (x x))
Result := ${name} ($r.$x.x)
`), RangeError);
    }
});
