---
layout: article
title: "Why is `({})` true in JavaScript?"
card_type: summary_large_image
card_image: /files/2022/05/js-equality.png
---

JavaScript's abstract equality might sound quite daunting... until you
realise that pretty much every operator and function in JavaScript
has the same problem. After all why does JavaScript's equality and
ordering works the way it does?

The direct answer is "coercion polymorphism"[^1]. But since this is unlikely
to tell you anything useful, unless you have implemented either JavaScript
or similarly polymorphic languages in the past, let's go in a short journey
of how JavaScript operators work, with a particular focus on the idea of
equality.

![](/files/2022/05/js-equality.png)
{: .centred-image .full-image }

<!--more-->

> <strong class="heading">Note</strong>  
> This was originally posted as a Quora answer for the question
> "Why is `({})` true, but `({} == true)` false in JavaScript?"
{: .trivia .note}

JavaScript operators generally work on *primitive* values, which are: Strings, Numbers, and Booleans. Additionally the language has special “non-values” (Undefined and Null), and objects, which can be anything (arrays, dates, etc).

For example, the operator `<` works on numbers, so both arguments must be numbers. A few things could happen if you tried to write something like `[] < 2`:

- The language could tell you `[] < 2` makes no sense, because `[]` is not a number. This is what people consider the sensible choice, and is what you see in some other languages (for example, Java);

- The language could have both `[]` or `2` (or both) decide what `<` is going to mean for them. Object oriented languages where operators are just method calls (Python, Ruby, Lua, Smalltalk, CLOS, etc.) do this, so what happens is up to your method (`[] < 2` could mean `[] has less than 2 elements?` for example);

- The language tries to convert the operands to a common type to proceed with the operation. In this case both operands would be converted to numbers. This is what JavaScript chooses.

In principle, this is not as complicated as people say: operators work on Strings or Numbers, so any non-primitive must tell the language how to convert itself to a String, and how to convert itself to a Number. Booleans are considered special kinds of numbers, where 0 and NaN are `false`, and everything else is `true`[^2].

The first example, which I assume you mean `if ({}) { … }` is simple: [ToBoolean](https://tc39.github.io/ecma262/#sec-toboolean) is invoked on the argument, and for objects this is always `true`.

We’ll see the other one in details below. And remember, any time you think “wow, this is bad,” don’t worry too much about it: it gets *worse*.

## A tale of two methods

Telling the language how to convert to a String is done through implementing `.toString()`. Telling the language how to convert to a Number is done through implementing `.valueOf()`:

```js
const x = { 
  valueOf(){ return 3 } 
}; 
 
  x < 2; 
= x.valueOf() < 2 
= 3 < 2 
= false; 
 
const y = { 
  toString(){ return "Hello, " } 
} 
 
  y + "world" 
= y.toString() + "world"  // see notes on this later 
= "Hello, " + "world" 
= "Hello, world" 
```

Now, this is where things get complicated. JavaScript lets you implement just one of these operations in an object. It then applies some rules to the value to convert it from string to number ([ToNumber](https://tc39.github.io/ecma262/#sec-tonumber)), or number to string ([ToString](https://tc39.github.io/ecma262/#sec-tostring)).

We can see this by changing the values around:

```js
  y < 2 
= y.toString() < 2    // y doesn't have a .valueOf 
= "Hello, " < 2 
= Number("Hello, ") < 2 
= NaN < 2 
= false 
 
// Likewise, since it's NaN, "y > 2" and "y == 2" are false. 
 
  x + "world" 
= x.valueOf() + "world"    // see notes on this later 
= 3 + "world" 
= (3).toString() + "world" 
= "3world" 
```

Note that since `.valueOf()` and `.toString()` are arbitrary functions, they may return values that are not primitives! Because of this, JavaScript will try the two methods if you define both. If the expression requires a String, it’ll try `.toString()`, and fallback to `.valueOf()`. If the expression requires a Number, it’ll be the opposite: `.valueOf()` followed by `.toString()`.

If none of the methods are available, or if none of them return a value that is a primitive, JavaScript halts and tells you it can’t perform the operation. Here’s some examples:

```js
const a = { valueOf(){ return [] }, toString(){ return '1' } }; 
 
  a + 2 
= a.valueOf() + 2 
= [] + 2      // oops, discard this expression 
= a.toString() + 2 
= "1" + 2 
= "12"        // string always wins btw 
 
const b = { valueOf(){ return 1 }, toString(){ return [] } }; 
const array = [1, 2]; 
 
  array[b]   
= array[b.toString()] 
= array[[]]        // oops, discard this expression 
= array[b.valueOf()] 
= array[1] 
= array[(1).toString()] 
= array['1'] 
= 2 
 
// regular objects inherit .valueOf and .toString from 
// Object.prototype, so we create an object that doesn't 
// inherit from anything 
const c = Object.create(null); 
 
c + 2   // => Error: Cannot convert object to primitive value 
array[c] // => Error: Cannot convert object to primitive value 
 
// Overriding the values has the same effect of course 
const d = { valueOf: null, toString: null }; 
d + 2   // => Error: Cannot convert object to primitive value 
array[d] // => Error: Cannot convert object to primitive value 
```

Welp, that’s quite some stuff, huh. I’ll admit that I lied about it being simple. But here’s the thing: it gets *WORSE*.

## `@@toPrimitive` to the rescue...?

Before, all of these conversions from object to primitive were governed by the [ToPrimitive](https://tc39.github.io/ecma262/#sec-toprimitive) internal operation. It’s called with a hint (`“string”` or `“number”`), and it would decide which one to call first: `.valueOf()` or `.toString()`. With the addition of Symbols[^3] to the language, the spec now allows users to override this internal operation by defining a method with the `@@toPrimitive` symbol.

Fortunately, if this method returns a non-primitive, the system throws a type error, rather than trying to call `.valueOf()` and `.toString()`. That’s one less thing to worry about at least.

When `@@toPrimitive` is called it’ll be given one string argument, that can be:

- `“string”`, if the method is supposed to be a string representation of the value (for example, for property access);
- `“number”`, if the method is supposed to return a numeric representation of the value (for example, in relational operators);
- `“default”`, if the language has no clue and it’s up to the method to decide what to return (operators that can work on more than one type, like `==` and `+` do this)

```js
const x = {  
  [Symbol.toPrimitive](hint) { 
    return hint === "default" ?  "oh no it's " 
    :      hint === "number"  ?  42 
    :      hint === "string"  ?  "tails" 
    : (() => { throw new TypeError(`Unknown hint ${hint}`) })(); 
  } 
}; 
 
x + 1;            // => "oh no it's 1" 
({ tails: "dang" })[x]    // => "dang" 
x > 41;            // => true 
```

But wait: IT. GETS. **WORSE**.

## How do you know which method gets called?

You don’t.

No, I really mean that: you. don’t.

This section might give you some basis to analyse why things went wrong, but you shouldn’t use non-primitives as arguments for operators, it’s unpredictable (and a potential security issue!).

1. If none of the three methods are defined in the object (the best case), then using the object in one operator is always a `TypeError`;
2. If only `@@toPrimitive` is defined, then it’ll get called on newer JavaScript VMs, but older JavaScript VMs will throw a `TypeError`. Symbols were introduced in ES2015. Relying on this is only okay if you know where your code will run;
3. If only `.toString()` **or** `.valueOf()` are defined, then that one method will always get called. This is predictable, but you won’t know in which context the value is going to be used;
4. If both `.toString()` and `.valueOf()` are defined, then which one will be called depends on the operator/function and the other arguments. It’s hard to predict, and if they return different representations you may end up with very inconsistent conversions (see the table of operators below);
5. If the three methods are defined, then `@@toPrimitive` will be called in newer VMs, and either `.toString()` or `.valueOf()` will be called in older ones. You have to worry about the inconsistencies of when `.toString/.valueOf` are called, but also about whether `.@@toPrimitive` is called at all in some VMs!

You might think that you’d be able to avoid this by just not implementing any of these three methods in your objects. But there are a few problems with this:

- Most of the objects you’ll be dealing with aren’t owned by you, which includes all of the built-in ones. All of them implement at least one of the methods above.

- Some tools (REPLs) and libraries will not work unless you implement at least `.toString()` or `.valueOf()`. It’s not just a matter of passing the correct primitive to them either, because this tends to happen much later and the call that depends on that behaviour is internal in the library. You’re obviously better off not using such libraries and tools if you can — they’re unlikely to work with objects not inheriting from `Object.prototype` anyway.

- JavaScript’s reflective capabilities allow you to modify any method, of any object, at any time. It also allows you to modify which object an object inherits from, which may also result in very confusing behaviour. Monkey-patching objects is not uncommon, shims/polyfills do this too, and with behaviour that doesn’t always match the specification!

  To exemplify how this can happen. The built-in Array.prototype provides its implementation of `.toString()`, and it inherits from Object.prototype which provides its implementation of `.valueOf()` — this one just returns the object itself.

```js
var a = [1]; 
 
  a + 2 
= a.valueOf() + 2    // Object.prototype.valueOf.call(a) = a 
= a.toString() + 2    // Array.prototype.toString.call(a) = '1' 
= "1" + 2 
= "12" 
 
// We can change Object.prototype.valueOf 
Object.prototype.valueOf = function() { 
  return 42; 
} 
 
  a + 2 
= a.valueOf() + 2    // Object.prototype.valueOf.call(a) = 42 
= 42 + 2 
= 44 
 
// And we can change the object an array inherits from 
const myArray = Object.create(Array.prototype); 
myArray.valueOf = function(){ return 'hello' }; 
Object.setPrototypeOf(a, myArray); 
 
// a now inherits from myArray, 
// which inherits from Array.prototype 
// which inherits from Object.prototype 
// which doesn't inherit from any object (null) 
  a + 2 
= a.valueOf() + 2    // myArray.valueOf.call(a) = 'hello' 
= "hello" + 2 
= "hello2" 
```

- While it’s understandable that one would think that people would avoid these monkey-patching (we did use to do them a lot in the early days, though), malicious code can use this to exploit innocent-looking code, like `a + 1` — though this is a deeper problem in mainstream languages without proper security mechanisms (like Object-Capability Security[^4]).

In short, **always** explicitly convert values to primitives yourself, don’t rely on these methods to do it for you. TypeScript and Flow can help you catch these in your own code if you spend enough time writing types.

## Operators and conversion rules

The only operators that don’t convert values in JavaScript are the strict equality operator (`===`), `new`, `super`, `yield`, `await`, `delete`, `void`, `typeof`, plain assignment (`=`), and the comma operator (`,`). All of the other constructs will try to convert values to a primitive. Some of these conversions are simple (e.g.: they just call [ToBoolean](https://tc39.github.io/ecma262/#sec-toboolean)), some are not.

Note that here [ToString](https://tc39.github.io/ecma262/#sec-tostring) is [ToPrimitive](https://tc39.github.io/ecma262/#sec-toprimitive) with the `“string”` hint followed by conversion of the result to a primitive string; [ToNumber](https://tc39.github.io/ecma262/#sec-tonumber) is the same, with a `“number”` hint and conversion to number;

This section gives a summary of these:

```js
// Untagged Template strings 
`some ${x}` => "some ".concat(ToString(x)) 
 
// Property accessors 
object[x]   => object[ToString(x)] 
 
// Update expressions 
x++, ++x    => x = ToNumber(x) + 1 
x--, --x    => x = ToNumber(x) - 1 
 
// Unary operators 
-x    => -ToNumber(x) 
+x    => ToNumber(x) 
~x    => ToNumber(x) 
!x    => ToBoolean(x)   (for objects, always true) 
 
// Math operators 
x ** y, x * y, x / y, x % y, x - y   
=> ToNumber(x), ToNumber(y) 
 
// Addition operator 
x + y => ToPrimitive(x), ToPrimitive(y) 
      : if any primitive is a string, ToString() them 
      : otherwise, ToNumber() them 
 
// It's important to note that when ToPrimitive is called 
// without a hint (as is the case here), the default value 
// for the internal operation is "number", which means that 
// this will call .valueOf() first if that exists, even if 
// one of the operands is already a primitive string! 
 
// Bitwise shift 
x << y, x >> y, x >>> y       => ToNumber(x), ToNumber(y) 
 
// Relational operators 
x < y, x <= y, x > y, x >= y  => ToNumber(x), ToNumber(y) 
 
// Instance of 
a instanceof b  => ToBoolean(b[Symbol.hasInstance](a)) 
 
// in 
a in b  => ToPrimitive(a, "string") 
        :  if this doesnt return a symbol, ToString() it 
 
// Equality operators 
a == b, a != b 
 
// If same type, same as === 
// If all objects, same as === 
// If all primitives, ToNumber() non-numbers 
// if one object, converts to a primitive
//    (ToPrimitive(x)) and then to a number
//    unless both operands become a string 
 
// Bitwise operators 
a & b, a | b, a ^ b    => ToNumber(a), ToNumber(b) 
 
// Logical operators 
a && b, a || b       => ToBoolean(a), ToBoolean(b) 
a ? b : c            => ToBoolean(a) 
```

Other than operators, most functions in the JavaScript standard library will convert the arguments to a particular type. For example, `Number("300")` will use `ToNumber()` in its argument, and `"hello".endsWith(["lo"])` will convert the array to a string (and assuming a non-modified environment, return `true`).

A few syntactical constructs also convert values. Where boolean values are expected, they’ll run that value through `ToBoolean`. This means that `if ({}) { … }` really means `if (ToBoolean({})) { … }`.

---

Okay, now we can explain the examples in this question themselves! :’)

A lot of operators use `ToBoolean` to convert its operands to a boolean. Where only booleans make sense this is not too bad. `ToBoolean` is not an overridable method, and for objects it’s defined to always return `true`.

```js
  if ({}) { ... } 
= if (ToBoolean({})) { ... } 
= if (true) { ... } 
= ... 
 
  {} || {} 
= ToBoolean({}) || ToBoolean({}) 
= true || true 
= true  
```

With the abstract equality operator (`==`) things are not so fun. Assuming a standard execution environment, and a plain object, this is what we get:

```js
  ({}) == true 
= ({}) == ToNumber(true) 
= ({}) == 1 
= ToPrimitive({}, "default") == 1 
= ToNumber({}.valueOf()) == 1 
= // fails because {}.valueOf() returns {} 
= ToNumber({}.toString()) == 1 
= ToNumber("[object Object]") == 1 
= NaN == 1 
= false 
```

But this could be very different if anywhere in that object or its inheritance chain a `@@toPrimitive` method, or a different `.valueOf()` or `.toString()` was defined:

```js
Object.prototype[Symbol.toPrimitive] = function(hint) { 
  if (hint === "default") { return 1 } 
  else { return this.toString() } 
} 
 
  ({}) == true 
= ({}) == ToNumber(true) 
= ({}) ==  1 
= ToPrimitive({}, "default") == 1 
= ToNumber(Object.prototype[Symbol.toString].call({})) == 1 
= ToNumber(1) == 1 
= 1 == 1 
= true 
```

---

<h4 class="normalcase borderless">Footnotes</h4>

[^1]:
    Coercion Polymorphism is defined by Cardelli as the kind of polymorphic
    function that is allowed to accept more types by converting values to
    the types it actually knows how to deal with. There's some weird overlap
    here with ad-hoc polymorphism, also described in the original paper.
    [See my Quora answer](https://www.quora.com/Object-Oriented-Programming-What-is-a-concise-definition-of-polymorphism/answer/Quildreen-Motta) on this for details, or read Cardelli's [On Understanding Types, Data Abstraction, and Polymorphism](http://lucacardelli.name/papers/onunderstanding.a4.pdf)

[^2]:
    What "counts as a boolean" is pretty much defined by the [ToBoolean](https://tc39.es/ecma262/#sec-toboolean) operation in the ECMAScript specification. And it's weird, but at least less weird than the horror of `ToString` and `ToNumber`.

[^3]:
    A lot of the old internal operations in JavaScript have been reified in the language proper through the magical idea of [Symbols](https://tc39.es/ecma262/#table-1), with `@@toPrimitive` being just another one of them. This makes the language more fun by making it impossible to reason about any semantics (it is fun for attackers, I'm sure).

[^4]:
    Object-Capability Security is an old concept that uses objects themselves as a way of both carrying capabilities and enforcing them. Mark Miller's [Towards a Unified Approach to Access Control and Concurrency Control](http://www.erights.org/talks/thesis/) thesis describes this in great detail; and otherwise the same website above contains a lot of other articles about different aspects of capability security. More languages should adopt capability security, but unfortunately capability security cannot be backported to languages not designed for it. Everything is terrible.