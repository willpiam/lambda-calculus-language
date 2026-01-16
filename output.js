// Compiled on January 16, 2026 from λ calculus
// average.lc
// Calculate the average of a set of Church numerals.
// Uses recursion via the Z combinator for division and list operations.
// William Doyle
// January 16th 2026

      function toNumber(church) {
        return church(n => n + 1)(0);
      }
    

      function toBoolean(church) {
        return church("True")("False");
      }
    
console.log("%cCalculate the average of numbers", "color: blue");
// Identity / booleans
const Idiot = (a) => a;
const Kestrel = (a) => (b) => a;
const Kite = (a) => (b) => b;
const True = Kestrel;
const False = Kite;
const Not = (p) => p(False)(True);
// Church numerals
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
const Twelve = Succ(Succ(Ten));
const Fifteen = Succ(Succ(Succ(Twelve)));
// Pairs (for predecessor and lists)
const Vireo = (a) => (b) => (f) => f(a)(b);
const First = (p) => p(Kestrel);
const Second = (p) => p(Kite);
const Phi = (p) => Vireo(Second(p))(Succ(Second(p)));
const Pred = (n) => n(Phi)(Vireo(Zero)(Zero))(True);
// Arithmetic
const Add = (n) => (k) => n(Succ)(k);
const Sub = (n) => (k) => k(Pred)(n);
const Mult = (f) => (g) => (a) => f(g(a));
const IsZero = (n) => n(((x) => False))(True);
const Leq = (n) => (m) => IsZero(Sub(n)(m));
// Z combinator (applicative order)
const Z = (f) => ((x) => f(((y) => x(x)(y))))(((x) => f(((y) => x(x)(y)))));
// Division via repeated subtraction:
// div(n,d) = if n < d then 0 else 1 + div(n-d, d)
const PseudoDiv = (f) => (n) => (d) => Leq(n)(Pred(d))(((x) => Zero))(((x) => Succ(f(Sub(n)(d))(d))))(Idiot);
const Div = Z(PseudoDiv);
console.log("%cTest division: 12 / 3 = 4", "color: blue");
console.log(toNumber(Div(Twelve)(Three)));
console.log("%cTest division: 10 / 2 = 5", "color: blue");
console.log(toNumber(Div(Ten)(Two)));
console.log("%cTest division: 15 / 5 = 3", "color: blue");
console.log(toNumber(Div(Fifteen)(Five)));
// Lists using Church encoding (right fold)
// Nil: empty list - returns the base case
// Cons: add element to front
const Nil = (c) => (n) => n;
const Cons = (h) => (t) => (c) => (n) => c(h)(t(c)(n));
// Check if list is empty
const IsNil = (l) => l(((h) => (t) => False))(True);
// Head and Tail (using pairs)
const Head = (l) => l(((h) => (t) => h))(Zero);
const Tail = (l) => First((l((h) => (p) => Vireo(Second(p))(Cons(h)(Second(p))))(Vireo(Nil)(Nil))));
// Sum of a list: fold with Add starting from Zero
const Sum = (l) => l(Add)(Zero);
// Length of a list: fold counting elements
const Length = (l) => l(((x) => Succ))(Zero);
// Average: Sum divided by Length
const Average = (l) => Div(Sum(l))(Length(l));
console.log("%cBuild a list of numbers: [2, 4, 6]", "color: blue");
const List1 = Cons(Two)(Cons(Four)(Cons(Six)(Nil)));
console.log("%cSum of [2, 4, 6] should be 12", "color: blue");
console.log(toNumber(Sum(List1)));
console.log("%cLength of [2, 4, 6] should be 3", "color: blue");
console.log(toNumber(Length(List1)));
console.log("%cAverage of [2, 4, 6] should be 4", "color: blue");
console.log(toNumber(Average(List1)));
console.log("%cBuild another list: [3, 5, 7]", "color: blue");
const List2 = Cons(Three)(Cons(Five)(Cons(Seven)(Nil)));
console.log("%cSum of [3, 5, 7] should be 15", "color: blue");
console.log(toNumber(Sum(List2)));
console.log("%cLength of [3, 5, 7] should be 3", "color: blue");
console.log(toNumber(Length(List2)));
console.log("%cAverage of [3, 5, 7] should be 5", "color: blue");
console.log(toNumber(Average(List2)));
console.log("%cBuild a list: [1, 2, 3, 4, 5]", "color: blue");
const List3 = Cons(One)(Cons(Two)(Cons(Three)(Cons(Four)(Cons(Five)(Nil)))));
console.log("%cSum of [1, 2, 3, 4, 5] should be 15", "color: blue");
console.log(toNumber(Sum(List3)));
console.log("%cLength of [1, 2, 3, 4, 5] should be 5", "color: blue");
console.log(toNumber(Length(List3)));
console.log("%cAverage of [1, 2, 3, 4, 5] should be 3", "color: blue");
console.log(toNumber(Average(List3)));
console.log("%cBuild a list of equal numbers: [4, 4, 4, 4]", "color: blue");
const List4 = Cons(Four)(Cons(Four)(Cons(Four)(Cons(Four)(Nil))));
console.log("%cAverage of [4, 4, 4, 4] should be 4", "color: blue");
console.log(toNumber(Average(List4)));
console.log("%cSingle element list: [10]", "color: blue");
const List5 = Cons(Ten)(Nil);
console.log("%cAverage of [10] should be 10", "color: blue");
console.log(toNumber(Average(List5)));