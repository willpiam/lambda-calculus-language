# The λ Calculus Language Project

AI has finally advanced to the point where this project is worth my time. This is the result of my collaboration with Grok 3.

Update: Grok got stuck on an issue with the Z combinator. It wasn't until Claude Opus 4.5 that the AI was able to overcome this issue in commit 
[581783a](https://github.com/willpiam/lambda-calculus-language/commit/581783af2029883f87e32c07584e53dc5f7f5a3a)

## Build and Run a `.lc` program

    deno task lc prime.lc

## Documentation 

See `docs.md` for documentation. Grok wrote it.

## Operators

| Symbol        |   Description         |
| ------------- | --------------------- |
| :=            | Definition assignment |
| $             | Lambda abstraction    |
| .             | Parameter/body split  |
| ()            | Grouping              |
| #             | Show church numeral   |
| @             | Show Stub Text        |
| !             | Show function body    |
| //            | Comments              |