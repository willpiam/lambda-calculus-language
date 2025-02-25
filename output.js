// Compiled on February 25, 2025 from λ calculus
//    A program to play with numbers
//    William Doyle
//    Febuary 24th 2025
const Zero = (f) => (a) => a;

      function toNumber(church) {
        return church(n => n + 1)(0);
      }
    

      function toBoolean(church) {
        return church("True")("False");
      }
    
console.log(toNumber(Zero));
const One = (f) => (a) => f(a);
console.log(toNumber(One));
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
console.log(toBoolean(True));
console.log(toBoolean(False));