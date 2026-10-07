import { assert, assertEquals } from "@std/assert";
import { highlight } from "./website/highlight.js";

function show(source) {
  return highlight(source).map((token) => {
    return `${token.kind}:${source.slice(token.start, token.end)}`;
  });
}

function assertWellFormed(source) {
  const tokens = highlight(source);
  let last = 0;
  for (const token of tokens) {
    assert(token.start >= last, `overlap or reorder at ${token.start}`);
    assert(token.end > token.start, "empty token");
    assert(token.end <= source.length, "token past end of source");
    last = token.end;
  }
}

Deno.test("definition colors the name, binder, parameters, and body", () => {
  assertEquals(show("Succ := $nfa.f (n f a)"), [
    "defName:Succ",
    "define::=",
    "lambda:$",
    "param:nfa",
    "dot:.",
    "variable:f",
    "paren:(",
    "variable:n",
    "variable:f",
    "variable:a",
    "paren:)",
  ]);
});

Deno.test("@ text stops at a trailing comment", () => {
  assertEquals(show("@hello world // note"), [
    "directive:@",
    "text:hello world ",
    "comment:// note",
  ]);
});

Deno.test("each output directive is marked only at the start of a line", () => {
  assertEquals(show("#Four"), ["directive:#", "name:Four"]);
  assertEquals(show("?True"), ["directive:?", "name:True"]);
  assertEquals(show("!SumRange"), ["directive:!", "name:SumRange"]);
  assertEquals(show("*Primes"), ["directive:*", "name:Primes"]);
  assertEquals(show("Succ Two #nope"), [
    "name:Succ",
    "name:Two",
    "invalid:#",
    "invalid:nope",
  ]);
});

Deno.test("a half-written lambda still colors its parameters", () => {
  assertEquals(show("$nfa"), ["lambda:$", "param:nfa"]);
  assertEquals(show("Succ := $nfa"), [
    "defName:Succ",
    "define::=",
    "lambda:$",
    "param:nfa",
  ]);
});

Deno.test("junk, empty input, and broken programs stay well formed", () => {
  assertEquals(highlight(""), []);
  assertEquals(show("foo bar"), ["invalid:foo", "invalid:bar"]);
  assertEquals(show("((("), ["paren:(", "paren:(", "paren:("]);
  assertEquals(show("$$"), ["lambda:$", "lambda:$"]);

  const samples = [
    "",
    "foo bar",
    "((( $$",
    "@\n//\n:=\n$",
    "Succ := $nfa.f (n f a)",
    "@hello // there\r\n#Four",
    "  \t#Four",
  ];
  for (const sample of samples) {
    assertWellFormed(sample);
  }
});

Deno.test("a small program colors comments, text, definitions, and names", () => {
  const source = [
    "// prime.lc",
    "@is a number prime or not?",
    "",
    "Idiot := $a.a",
    "True := Kestrel",
    "#OneHundred",
  ].join("\n");

  assertEquals(show(source), [
    "comment:// prime.lc",
    "directive:@",
    "text:is a number prime or not?",
    "defName:Idiot",
    "define::=",
    "lambda:$",
    "param:a",
    "dot:.",
    "variable:a",
    "defName:True",
    "define::=",
    "name:Kestrel",
    "directive:#",
    "name:OneHundred",
  ]);
  assertWellFormed(source);
});
