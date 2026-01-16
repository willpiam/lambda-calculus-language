// Compiled on January 16, 2026 from λ calculus
// prime.lc
// Determine whether a Church numeral is prime.
// Uses recursion via the Z combinator (applicative-order fixpoint).

      function toNumber(church) {
        return church(n => n + 1)(0);
      }
    

      function toBoolean(church) {
        return church("True")("False");
      }
    
console.log("%cis a number prime or not?", "color: blue");
// Identity / booleans
const Idiot = (a) => a;
const Kestrel = (a) => (b) => a;
const Kite = (a) => (b) => b;
const True = Kestrel;
const False = Kite;
const Not = (p) => p(False)(True);
// Church numerals + arithmetic
const Zero = (f) => (a) => a;
const One = (f) => (a) => f(a);
const Succ = (n) => (f) => (a) => f(n(f)(a));
const Two = Succ(One);
const Three = Succ(Two);
const Four = Succ(Three);
const Five = Succ(Four);
const Six = Succ(Five);
const Seven = Succ(Six);
const Eight = Succ(Seven);
const Nine = Succ(Eight);
const Ten = Succ(Nine);
const Eleven = Succ(Ten);
const Mult = (f) => (g) => (a) => f(g(a));
const OneHundred = Mult(Ten)(Ten);
console.log(toNumber(OneHundred));
const OneHundredOne = Succ(OneHundred);
console.log(toNumber(OneHundredOne));
// Pairs (for predecessor)
const Vireo = (a) => (b) => (f) => f(a)(b);
const First = (p) => p(Kestrel);
const Second = (p) => p(Kite);
const Phi = (p) => Vireo(Second(p))(Succ(Second(p)));
const Pred = (n) => n(Phi)(Vireo(Zero)(Zero))(True);
const Sub = (n) => (k) => k(Pred)(n);
const IsZero = (n) => n(((x) => False))(True);
const Leq = (n) => (m) => IsZero(Sub(n)(m));
// Z combinator (applicative order)
const Z = (f) => ((x) => f(((y) => x(x)(y))))(((x) => f(((y) => x(x)(y)))));
// Mod via repeated subtraction:
// mod(n,d) = if n < d then n else mod(n-d, d)
const PseudoMod = (f) => (n) => (d) => Leq(n)(Pred(d))(((x) => n))(((x) => f(Sub(n)(d))(d)))(Idiot);
const Mod = Z(PseudoMod);
// Trial division primality:
// primeCheck(n,d) = if n <= d then True else if mod(n,d)==0 then False else primeCheck(n,d+1)
const PseudoPrimeCheck = (f) => (n) => (d) => Leq(n)(d)(((x) => True))(((x) => IsZero(Mod(n)(d))(((y) => False))(((y) => f(n)(Succ(d))))(Idiot)))(Idiot);
const PrimeCheck = Z(PseudoPrimeCheck);
const IsPrime = (n) => ((i) => ((t) => ((f) => ((s) => ((z) => ((o) => ((w) => ((v) => ((u) => ((r) => ((h) => ((p) => ((b) => ((e) => ((l) => ((g) => ((m) => ((c) => l(n)(o)(((x) => f))(((x) => c(n)(w)))(i))((g((q) => (n) => (d) => l(n)(d)(((x) => t))(((x) => e(m(n)(d))(((y) => f))(((y) => q(n)(s(d))))(i)))(i)))))((g((q) => (n) => (d) => l(n)(p(d))(((x) => n))(((x) => q(b(n)(d))(d)))(i)))))(((f) => ((x) => f(((z) => x(x)(z))))(((x) => f(((z) => x(x)(z))))))))(((n) => (m) => e(b(n)(m)))))(((n) => n(((x) => f))(t))))(((n) => (k) => k(p)(n))))(((n) => n(h)(v(z)(z))(t))))(((p) => v(r(p))(s(r(p))))))(((p) => p(f))))(((p) => p(t))))(((a) => (b) => (f) => f(a)(b))))(((f) => (a) => f(f(a)))))(((f) => (a) => f(a))))(((f) => (a) => a)))(((n) => (f) => (a) => f(n(f)(a)))))(((a) => (b) => b)))(((a) => (b) => a)))(((a) => a));
console.log("%ctests (True means prime)", "color: blue");
console.log(toNumber(Zero));
console.log(toBoolean(IsPrime(Zero)));
console.log(toNumber(One));
console.log(toBoolean(IsPrime(One)));
console.log(toNumber(Two));
console.log(toBoolean(IsPrime(Two)));
console.log(toNumber(Three));
console.log(toBoolean(IsPrime(Three)));
console.log(toNumber(Four));
console.log(toBoolean(IsPrime(Four)));
console.log(toNumber(Five));
console.log(toBoolean(IsPrime(Five)));
console.log(toNumber(Six));
console.log(toBoolean(IsPrime(Six)));
console.log(toNumber(Seven));
console.log(toBoolean(IsPrime(Seven)));
console.log(toNumber(Eight));
console.log(toBoolean(IsPrime(Eight)));
console.log(toNumber(Nine));
console.log(toBoolean(IsPrime(Nine)));
console.log(toNumber(Ten));
console.log(toBoolean(IsPrime(Ten)));
console.log(toNumber(Eleven));
console.log(toBoolean(IsPrime(Eleven)));
console.log(toNumber(OneHundred));
console.log(toBoolean(IsPrime(OneHundred)));
console.log(toNumber(OneHundredOne));
console.log(toBoolean(IsPrime(OneHundredOne)));