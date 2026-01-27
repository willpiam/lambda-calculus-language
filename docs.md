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

### Definitions
- Assign names to expressions with `:=`.
- Syntax: `<Name> := <expression>`
  - `<Name>`: Must start with an uppercase letter (e.g., `Zero`, `Succ`).
  - `<expression>`: A lambda abstraction or application.
- Example: `Zero := $fa.a` defines `Zero` as the Church numeral 0.

### Applications
- Apply functions by juxtaposition (space-separated terms).
- Syntax: `<function> <argument>`
- Parentheses can group applications: `(f a)`.
- Example: `Succ Two` applies `Succ` to `Two`.

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

## Compilation

### Requirements
- **Deno**: Install Deno (e.g., `deno --version` should work).
- **Transpiler**: Save the provided `main.js` in your working directory.

### Command
Compile a `.lc` file to JavaScript:
```bash
deno run --allow-read --allow-write main.js <filename>.lc

```

