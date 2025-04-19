// Compiled on April 19, 2025 from λ calculus
//    A program to play with numbers
//    William Doyle
//    Febuary 24th 2025

      function toNumber(church) {
        return church(n => n + 1)(0);
      }
    

      function toBoolean(church) {
        return church("True")("False");
      }
    
console.log("%cnumbers 0 through 8, followed by 16", "color: blue");
const Zero = (f) => (a) => a;
console.log(toNumber(Zero));
const One = (f) => (a) => f(a);
console.log(toNumber(One));
console.log("%c1 as a function", "color: blue");
console.log((One).toString());
const Two = (f) => (a) => f(f(a));
console.log(toNumber(Two));
// the successor 
const Succ = (n) => (f) => (a) => f(n(f)(a));
const Three = Succ(Two);
console.log(toNumber(Three));
const Four = Succ(Three);
console.log(toNumber(Four));
// additon
const Add = (n) => (k) => n(Succ)(k);
const Five = Add(Three)(Two);
console.log(toNumber(Five));
const Six = Add(Three)(Three);
console.log(toNumber(Six));
const Seven = Succ(Six);
console.log(toNumber(Seven));
// Multiplication (The bluebird)
const Bluebird = (f) => (g) => (a) => f(g(a));
const Mult = Bluebird;
const Eight = Mult(Four)(Two);
console.log(toNumber(Eight));
console.log("%c8 x 8 is 64", "color: blue");
const SixtyFour = Mult(Eight)(Eight);
console.log(toNumber(SixtyFour));
console.log("%cShow 64 as a function", "color: blue");
console.log((SixtyFour).toString());
console.log("%c8 x 1 is 8", "color: blue");
console.log(toNumber(Mult(Eight)(One)));
console.log("%c1 times 1", "color: blue");
console.log(toNumber(Mult(One)(One)));
// Exponentiation (Thrush)
const Thrush = (a) => (f) => f(a);
const Pow = Thrush;
const Sixteen = Pow(Four)(Two);
console.log(toNumber(Sixteen));
// some more combinators 
const Idiot = (a) => a;
const Kestrel = (a) => (b) => a;
const Kite = Kestrel(Idiot);
const True = Kestrel;
const False = Kite;
console.log("%cboolean algebra", "color: blue");
console.log(toBoolean(True));
console.log(toBoolean(False));
// now we can do boolean algebra 
const Not = (p) => p(False)(True);
console.log(toBoolean(Not(True)));
console.log(toBoolean(Not(False)));
console.log("%cclosures / the Vireo", "color: blue");
const Vireo = (a) => (b) => (f) => f(a)(b);
const First = (p) => p(Kestrel);
const Second = (p) => p(Kite);
console.log("%cthe first of the vireo of 1 and 2 is 1", "color: blue");
console.log(toNumber(First(Vireo(One)(Two))));
console.log("%cthe second of the vireo of 1 and 2 is 2", "color: blue");
console.log(toNumber(Second(Vireo(One)(Two))));
// phi
const Phi = (p) => Vireo(Second(p))(Succ(Second(p)));
console.log("%ctest Phi with Zero and Four should output 4 (second element should be 4+1)", "color: blue");
console.log(toNumber(First(Phi(Vireo(Zero)(Four)))));
console.log(toNumber(Second(Phi(Vireo(Zero)(Four)))));
// Predecessor combinator
const Pred = (n) => n(Phi)(Vireo(Zero)(Zero))(True);
console.log("%ctest predecessor of Four should be Three", "color: blue");
console.log(toNumber(Pred(Four)));
console.log(toNumber(Pred(Pred(Four))));
console.log(toNumber(Pred(Pred(Pred(Four)))));
// Subtraction
const Sub = (n) => (k) => k(Pred)(n);
console.log("%ceight minus two is 6", "color: blue");
console.log(toNumber(Sub(Eight)(Two)));
console.log("%cfive minus three is two", "color: blue");
console.log(toNumber(Sub(Five)(Three)));
const IsZero = (n) => n((x) => False)(True);
console.log("%czero is zero", "color: blue");
console.log(toBoolean(IsZero(Zero)));
console.log("%cone is not zero", "color: blue");
console.log(toBoolean(IsZero(One)));
const Z = (f) => (x) => f((y) => x(x)(y))((x) => f((y) => x(x)(y)));
const PseudoSumRange = (f) => (m) => (n) => IsZero(Sub(n)(m))(m)(Add(n)(f(m)(Pred(n))));
const SumRange = Z(PseudoSumRange);
console.log("%cShow the SumRange function", "color: blue");
console.log((SumRange).toString());
console.log("%csum 1 through  4 as a function", "color: blue");
console.log((SumRange(One)(Four)).toString());
console.log("%cnow as a number", "color: blue");
console.log(toNumber(SumRange(One)(Four)));