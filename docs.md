# λ Calculus Language Documentation

Welcome to the λ Calculus Language, a simple programming language for expressing lambda calculus computations, transpiled into JavaScript for execution. This language uses a concise syntax with `$` for lambda abstractions, supports named definitions, and includes single-line comments. When compiled, it adds a header noting the compilation date and origin from λ calculus.

## Overview

- **File Extension**: `.lc`
- **Purpose**: Write lambda calculus expressions with named combinations, evaluate Church numerals as numbers, and display boolean values as strings (plus a few output directives).
- **Compiler**: A Deno-based transpiler (`main.js`) converts `.lc` files to JavaScript, executable with `deno run`.

## Syntax

### Lambda Abstractions
- Use `$` instead of the traditional `λ` to define functions.
- Syntax: `$<params>.<body>`
  - `<params>`: A string of lowercase letters (e.g., `fa` for parameters `f` and `a`), each becoming a nested function.
  - `<body>`: The expression, using variables from `<params>` or defined names.
- Example: `$fa.a` translates to `(f) => (a) => a` in JavaScript.
- A lambda's body extends as far right as the enclosing parentheses or end of the expression. For example, `$x.$y.x y` means `$x.($y.(x y))`.
- Variables use lexical scope. Reusing a parameter name in an inner lambda shadows the outer parameter. Free variables stay free; the compiler does not invent bindings for them.

### Definitions
- Assign names to expressions with `:=`.
- Syntax: `<Name> := <expression>`
  - `<Name>`: Must start with an uppercase letter, followed by letters, digits, or underscores (e.g., `Zero`, `Succ`, `Name_1`).
  - `<expression>`: A lambda abstraction or application.
- Example: `Zero := $fa.a` defines `Zero` as the Church numeral 0.
- Names refer to earlier definitions and cannot be redefined within the same program. Unknown names are rejected, including inside lambda bodies.
- A definition labels an expression; it does not introduce an implicit recursive binding. Express recursion using a fixed-point combinator in the source.

### Applications
- Apply functions by juxtaposition (terms separated by spaces, tabs, or parentheses).
- Syntax: `<function> <argument>`
- Parentheses can group applications: `(f a)`.
- Example: `Succ Two` applies `Succ` to `Two`.
- Application associates left: `f a b` means `(f a) b`.
- An inline lambda can be applied directly: `($x.x) One` translates to `((x) => x)(One)`.
- An unparenthesized lambda used as an argument still consumes its complete body: `Id $fa.f a` means `Id ($fa.f a)`.
- Each source line is a separate definition, expression, or output directive. Expressions cannot span lines.

### Evaluation

The transpiler translates each variable to a JavaScript identifier, each lambda to a single-argument arrow function, and each application to a single-argument function call. Compact parameter lists expand to nested lambdas. Parentheses preserve the parsed expression's meaning.

Evaluation is eager, following ordinary JavaScript function calls. There are no built-in combinators, name-based special cases, or automatic delays of arguments. For example, the ordinary Y combinator diverges under this evaluation strategy. Recursive programs can express the applicative-order Z combinator and any required thunks explicitly in LC source, as the bundled examples do.

The `#`, `?`, `*`, `@`, `~`, and `!` directives provide output and decoding at the boundary; their JavaScript helpers do not change how lambda expressions evaluate. Native literals, JavaScript operators, and property access are not part of the expression language and are rejected.

### Numeric Output
- Use `#` to evaluate an expression as a Church numeral and print it as a number.
- Syntax: `#<expression>`
- Example: `#Four` outputs `4` if `Four` is defined as the Church numeral 4.

### Boolean Output
- Use `?` to evaluate an expression as a Church boolean and print it as `"True"` or `"False"`.
- Syntax: `?<expression>`
- Example: `?True` outputs `"True"` if `True` is defined as `$ab.a`, and `?False` outputs `"False"` if `False` is `$ab.b`.

### Text Output
- Use `@` to print a literal line of text.
- Syntax: `@<text>`
- Example: `@tests (True means prime)` outputs that line in blue.
- Use `~<list>` to print a pair-based list of Church numerals as text. Each numeral encodes one Unicode code point. A list containing 72 and 105 prints `Hi`.

### Function Output
- Use `!` to print the JavaScript function body for an expression.
- Syntax: `!<expression>`
- Example: `!SumRange` prints the compiled function expression.

### Numeric List Output
- Use `*` to print a list of Church numerals as a JavaScript array.
- Syntax: `*<list>`
  - `<list>`: A pair-based list (built with Cons/Nil).
- The operator iterates through the list until Nil, converting each Church numeral to a number.
- Output format: `[n1, n2, n3, ...]`
- Example: `*Primes` prints the primes list as `[2, 3, 5]`.

### Comments
- Single-line comments start with `//` and extend to the end of the line.
- Syntax: `// <comment text>`
- Comments are preserved in the compiled JavaScript output in their original positions.

### Restrictions
- Parameters in lambda abstractions (`$<params>`) must be lowercase letters.
- Definition names must start with an uppercase letter.
- Multi-line comments (`/* */`) are not supported—use multiple `//` lines instead.

## Cellular Automaton Presets

Choose **Rule 30** or **Rule 110** in the website's preset menu and press **Run**. Each self-contained LC program starts with a single live cell centered in a row of 33 cells, then prints the initial row and 16 generations as lists of `0` (dead) and `1` (live). Cells beyond either end are always dead; the row does not wrap around. Updates are simultaneous, with every neighborhood read from the previous generation.

The cells are Church booleans and the rows are pair-based lists. The local rule, list traversal, seed construction, and generation iteration all run in LC. Booleans become Church numerals only for the existing `*` output directive. These presets require no changes or special cases in the transpiler or browser runtime.

Change `Padding` to adjust the number of dead cells on each side of the seed. `Row n` computes generation `n`, where `n` is a Church numeral; the final `*Row ...` lines choose which generations to print. The default padding accommodates all 16 updates without clipping growth at the edges.

The same preset files can be run from the repository root with `deno task lc website/presets/rule30.lc` or `deno task lc website/presets/rule110.lc`.

## Compilation

### Requirements
- **Deno**: Install Deno (e.g., `deno --version` should work).
- **Transpiler**: Save the provided `main.js` in your working directory.

### Command
Compile a `.lc` file to JavaScript:
```bash
deno run --allow-read --allow-write main.js <filename>.lc

```

