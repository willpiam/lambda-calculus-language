// Compiled on January 27, 2026 from λ calculus
const Idiot = (a) => a;
const True = (a) => (b) => a;
const False = (a) => (b) => b;
const Not = (p) => p(False)(True);
const Zero = (f) => (a) => a;
const One = (f) => (a) => f(a);
const Succ = (n) => (f) => (a) => f(n(f)(a));
const Two = Succ(One);
const Three = Succ(Two);
const Mult = (f) => (g) => (a) => f(g(a));
const Six = Mult(Two)(Three);
const Seven = Succ(Six);
const FortyTwo = Mult(Six)(Seven);
const Count = Seven;
const Vireo = (a) => (b) => (f) => f(a)(b);
const Head = (p) => p(True);
const Tail = (p) => p(False);
const Phi = (p) => Vireo(Tail(p))(Succ(Tail(p)));
const Pred = (n) => n(Phi)(Vireo(Zero)(Zero))(True);
const Sub = (n) => (k) => k(Pred)(n);
const IsZero = (n) => n(((x) => False))(True);
const Leq = (n) => (m) => IsZero(Sub(n)(m));
const Z = (f) => ((x) => f(((y) => x(x)(y))))(((x) => f(((y) => x(x)(y)))));
const PseudoMod = (f) => (n) => (d) => Leq(n)(Pred(d))(((x) => n))(((x) => f(Sub(n)(d))(d)))(Idiot);
const Mod = Z(PseudoMod);
const PseudoPrimeCheck = (f) => (n) => (d) => Leq(n)(d)(((x) => True))(((x) => IsZero(Mod(n)(d))(((y) => False))(((y) => f(n)(Succ(d))))(Idiot)))(Idiot);
const PrimeCheck = Z(PseudoPrimeCheck);
const IsPrime = (n) => Leq(n)(One)(((x) => False))(((x) => PrimeCheck(n)(Two)))(Idiot);
const PseudoNextPrime = (f) => (n) => IsPrime(Succ(n))(((x) => Succ(n)))(((x) => f(Succ(n))))(Idiot);
const NextPrime = Z(PseudoNextPrime);
const NthPrime = (n) => n(NextPrime)(One);
const PseudoNth = (f) => (l) => (n) => IsZero(n)(((x) => Head(l)))(((x) => f(Tail(l))(Pred(n))))(Idiot);
const Nth = Z(PseudoNth);
const PseudoBuildPrimes = (f) => (s) => (n) => IsZero(n)(((x) => False))(((x) => Vireo(NthPrime(s))(f(Succ(s))(Pred(n)))))(Idiot);
const BuildPrimesFrom = Z(PseudoBuildPrimes);
const Primes = BuildPrimesFrom(One)(Count);

      function toNumber(church) {
        return church(n => n + 1)(0);
      }
    

      function toBoolean(church) {
        return church("True")("False");
      }
    
console.log("%cfirst primes (generated in a loop)", "color: blue");
(function(list) {
  const _isNil = (l) => {
    const testFn = (a) => (b) => ({ _cons: true, head: a, tail: b });
    const result = l(testFn);
    return !result._cons;
  };
  const _first = (p) => p((a) => (b) => a);
  const _second = (p) => p((a) => (b) => b);
  const arr = [];
  let current = list;
  while (!_isNil(current)) {
    arr.push(toNumber(_first(current)));
    current = _second(current);
  }
  console.log(arr);
})(Primes);