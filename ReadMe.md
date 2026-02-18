# The λ Calculus Language Project

A simple programming language based on lambda calculus. The lambda symbol is replaced with a dollar sign for easier typing. Functions can be labeled using the walrus operator.

Try it in your browser: [Lambda Calculus Runner](https://williamdoyle.ca/lambda-calculus-language/).


## Build and Run a `.lc` program

    deno task lc prime.lc

## Documentation 

See [docs.md](./docs.md) for documentation.

## Operators

| Symbol | Description                   |
| ------ | ----------------------------- |
| :=     | Definition assignment         |
| $      | Lambda abstraction            |
| .      | Parameter/body split          |
| ()     | Grouping                      |
| #      | Show church numeral           |
| *      | Show list of church numerals  |
| @      | Show Stub Text                |
| !      | Show function body            |
| //     | Comments                      |
 