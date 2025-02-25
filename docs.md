# λ Calculus Language Documentation

Welcome to the λ Calculus Language, a simple programming language for expressing lambda calculus computations, transpiled into JavaScript for execution. This language uses a concise syntax with `$` for lambda abstractions, supports named definitions, and includes single-line comments. When compiled, it adds a header noting the compilation date and origin from λ calculus.

## Overview

- **File Extension**: `.lc`
- **Purpose**: Write pure lambda calculus expressions with named combinations, evaluate Church numerals as numbers, and display boolean values as strings.
- **Compiler**: A Deno-based transpiler (`main.js`) converts `.lc` files to JavaScript, executable with `deno run`.
- **Date**: Current version as of February 24, 2025.

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

### Comments
- Single-line comments start with `//` and extend to the end of the line.
- Syntax: `// <comment text>`
- Comments are preserved in the compiled JavaScript output in their original positions.
- Example: `// the successor` appears above its associated definition.

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