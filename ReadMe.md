# The λ Calculus Language Project

AI has finally advanced to the point where this project is worth my time. This is the result of my collaboration with Grok 3.

## Running
 Compile

    deno run --allow-write --allow-read main.js program1.lc

### Run

    deno run output.js

### Compile & Run

    deno run --allow-write --allow-read main.js program1.lc ; deno run output.js

### One command (build & run any .lc file)

    deno task lc -- program1.lc

## Documentation 

See `docs.md` for documentation. Grok wrote it.

## Operators

| Symbol        |   Description         |
| ------------- | --------------------- |
| :=            |                       |
| $             |                       |
| .             |                       |
| ()            |                       |
| #             | Show church numeral   |
| @             | Show Stub Text        |
| !             | Show function body    |
| //            | Comments              |