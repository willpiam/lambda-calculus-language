// Compiled on January 27, 2026 from λ calculus
// primes_series.lc
// Compute the first N prime Church numerals and print them.
// How many primes to compute (start here).
const Count = (f) => (a) => f(f(f(a)));
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
const IsPrime = (n) => Leq(n)(One)(((x) => False))(((x) => PrimeCheck(n)(Two)))(Idiot);
// NextPrime(n) returns the smallest prime greater than n.
const PseudoNextPrime = (f) => (n) => IsPrime(Succ(n))(((x) => Succ(n)))(((x) => f(Succ(n))))(Idiot);
const NextPrime = Z(PseudoNextPrime);
// NthPrime(n) = n applications of NextPrime to One.
const NthPrime = (n) => n(NextPrime)(One);
// ============================================
// List structure using chained pairs (Cons/Nil)
// ============================================
// Cons creates a pair: (head, tail)
// Nil is the empty list marker
const Cons = Vireo;
const Head = First;
const Tail = Second;
const Nil = False;
// Nth: get element at index n (0-indexed)
// Nth list 0 = Head list
// Nth list n = Nth (Tail list) (n-1)
// Uses thunks ($x.expr) for lazy evaluation in applicative-order JS
const PseudoNth = (f) => (l) => (n) => IsZero(n)(((x) => Head(l)))(((x) => f(Tail(l))(Pred(n))))(Idiot);
const Nth = Z(PseudoNth);
// ============================================
// Build primes list dynamically
// ============================================
// BuildPrimesFrom: recursively build list of N primes starting from index s
// BuildPrimesFrom s n = if n == 0 then Nil else Cons (NthPrime s) (BuildPrimesFrom (s+1) (n-1))
const PseudoBuildPrimes = (f) => (s) => (n) => IsZero(n)(((x) => Nil))(((x) => Cons(NthPrime(s))(f(Succ(s))(Pred(n)))))(Idiot);
const BuildPrimesFrom = Z(PseudoBuildPrimes);
// Build list of Count primes, starting from the 1st prime
const Primes = BuildPrimesFrom(One)(Count);
// ============================================
// Display primes using numeric list output
// ============================================

      function toNumber(church) {
        return church(n => n + 1)(0);
      }
    

      function toBoolean(church) {
        return church("True")("False");
      }
    
console.log("%cfirst primes (generated in a loop)", "color: blue");
(function(list, len) {
  const _first = (p) => p((a) => (b) => a);
  const _second = (p) => p((a) => (b) => b);
  const n = toNumber(len);
  let current = list;
  for (let i = 0; i < n; i++) {
    console.log(toNumber(_first(current)));
    current = _second(current);
  }
})(Primes, Count);