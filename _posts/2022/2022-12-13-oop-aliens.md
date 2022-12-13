---
layout: article
title:  "OOP is great: Aliens"
---

> This is the second article in the "OOP is great" series, where we look at some of the features in OOPLs that I've adopted in Crochet, and what makes them great. Much of it might go against what you believe about OOP if you're only familiar with languages like Java or C#.

Last time we looked into [dispatch and multi-methods][multimethod], what they're useful for and why they were chosen for Crochet in particular.

This time we'll look into a much less popular concept, but one that is widely applicable and has some very surprising connections to very recent advancements in type systems. Today we'll talk about [Aliens][alien].

Aliens are a mechanism for [Foreign Function Interfaces (FFIs)][ffi] that, to the best of my knowledge, appeared in the Smalltalk community. But which also has interesting overlaps with [transparent actors][actors], [membranes][membrane], [interleaved interpreters][], and [linking types][].

Incidentally, what all these jargon words have in common is really just one thing: interacting with foreign concepts—concepts that have, possibly, different semantics than the ones in your cozy programming language.

<!--more-->

## The basics of foreign interfaces

Let's say you're building a new programming language. You think it should have very few concepts, maybe some numeric type, some variables and functions and function calls. Perhaps some form of defining custom types. But that's about enough, really, for most things.

Many functional, object-oriented, and even procedural languages linger somewhere close to that description. For example, consider this small example of a linked-list definition and a function that computes the length of a linked list:

```
abstract List;
type Nil() is List;
type Cons(first, rest) is List;

function length(_ is Nil) = 0;
function length(x is Cons) = 1 + length(x.rest);
```

A more formal definition of this language would be as follows (don't worry too much about this if you're less familiar with formal languages, it's basically the first paragraph of this section in a more mathematical notation):

```
Declaration decl ::
  | abstract <name>
  | type <name>() is <name>
  | function <name>(<param> is <name>, ...) = <expr>;

Expression expr ::
  | <e1> + <e2>, <e1> * <e2>, <e1> - <e2>, <e1> / <e2>    -- arithmetic
  | <e1> = <e2>, <e1> < <e2>, <e1> > <e2>                 -- relational
  | if <e1> then <e2> else <e3>                           -- conditional
  | <e1>.<name>                                           -- projection
  | <number>
```

Now, our language has the concept of numbers and some arithmetic, relational, and conditionals. It has also custom types and [a way of selecting functions based on types][multimethod]. That's enough for us to define a function that gives us the length of a linked list, or a function that inverts a binary tree, or a function that computes the factorial of a number. Which are all of the things someone wants to do with a computer, right?

Okay, no, people usually want to do more than that. For example, draw things on the screen, play some music, let the user interact with things, read some files, etc. The big problem here is that our programming language so far knows nothing about those concepts.

Of course, we could replicate a particular operating system's concepts, like files, in our programming language, but the moment we move to a different operating system, or even to a different implementation of that same concept, our *entire* programming language stops working. Not only have we done significantly more work, our work means we now get to ship to even less devices. Just great. Perfect.

To avoid this we can, instead, move things outside of the programming language's implementation (the compiler or interpreter), and instead put them into libraries. We might ship these libraries with the language or not, but we now have a lot more freedom to choose how we distribute it. We can even have a minimal language distribution that users themselves can extend for their own little foreign concepts, their own weird operating systems, their own tiny devices.

Enter the "Foreign Function Interface": the extension point for anything the language doesn't yet understand. One way of doing them is to allow the program to invoke anything that the operating system is able to load. Another way of doing them, when you have an interpreter/VM, is to allow the program to invoke anything the host of our language implementation happens to be written on. So if we wrote our interpreter in Java, we could allow users to call any Java function. If we wrote it in Python, any Python function. And so on, and so forth.

Be it as it may, many languages will have something that allows you to describe these "extension points", and then, at either compile or run time, the language implementation will try to combine your program with those foreign concepts. Crochet's current implementation is on top of JavaScript, so the FFI allows you to use any arbitrary JavaScript.

First we define some JavaScript module:

```js
// some-module.js
exports.default = (ffi) => {
  ffi.defun("js.alert", (text) => {
    window.alert(ffi.text_to_string(text));
    return ffi.nothing;
  });
}
```

Then we use that in a Crochet module:

```
% crochet

singleton js;

command js alert: (Text is text) =
  foreign js.alert(Text);
```

The `foreign js.alert(...)` syntax tells the VM where these foreign concepts have to be linked, and that allows anyone, anywhere, to extend our little toy programming language to do actual real work.


## But isn't that... dangerous?

So foreign functions allow anyone to extend a programming language with things that are *outside* of that programming language's semantics. This is great for users, in one sense, because they can achieve the things they need to do. But this is also terrible for users, because it means we have no way of making the programming language secure any longer.

Crochet is a security-oriented language; it sacrifices a lot in order to guarantee that users can run any piece of code they find randomly in the internet in a safe way, without having to worry about that piece of code taking over their computer or harming them in (mostly) any way. FFIs, as commonly implemented, go in the complete opposite direction of this.

Indeed, even though Crochet uses [capability security][ocap] to achieve its security guarantees, such that a piece of code would need to be granted a capability for the FFI, the feature still comes with this big warning in the documentation (and when you try to run/install any program that requires it):

> A package with the `native` capability is allowed to define modules using the Foreign Interface. Such modules cannot be properly contained by Crochet, and thus threaten all of the security guarantees that Crochet aims to provide; but, sometimes, they’re necessary. This is why Crochet allows one to give permission to a package to do such dangerous thing, by granting it the native capability.

The problem with foreign functions is that they're not just new arbitrary code. The problem is that they're new arbitrary code that lives outside of a programming language's semantic guarantees **and** can nullify those guarantees for every other piece of code they're loaded with.

Crochet has a `native` capability as a very dangerous, very last-resort escape hatch, and it comes with enough security warnings to scare anyone away from using it. However, it's extensively used in lower-level trusted pieces of the standard library to provide a more fully featured distribution of Crochet, and there the standard library makes the promise that such "dangerous rogue semantics" are contained—not because the compiler or VM can verify such, but because the programmers working on it made that promise and you just have to trust them.

However, any code that requests the `native` capability but lives outside of the standard library, or that you, as the user, hasn't written, should be treated with the highest amount of suspicion—and honestly shouldn't ever be executed without a careful security audit. So Crochet still needs to provide some sort of "foreign interface" that has more restricted semantics, which would allow less-trusted parts of the ecosystem to extend the language while also requiring less trust to be given to them, because they wouldn't be able to cause as much harm if that trust were to be misplaced.

Any sort of syntactical or VM/Compiler-provided FFI will suck for this. Yes, any.


## Reconciling FFIs with Capabilities

So, if we can't rely on FFIs for extending the language safely, what can we do? Well, just like [Mirrors][mirror] allow the idea of runtime reflection to be reconcilled with [Object-Capability Security][ocap], so do [Aliens][alien] allow the idea of runtime FFIs to be reconcilled with [Object-Capability Security][ocap], too.

They're very similar, in that sense, as they're both a regular Object (or [First-Class Module][fmod], same thing), which is naturally amenable to Object-Capability Security, and which has been given extended powers by the language semantics themselves. In that sense, Mirrors and Aliens are just reifying the ideas of reflection and FFI in a way supported by the VM, but through the same primitives everything else in the language uses.

And since they're using the same primitives, all of the dynamic security and analysis rules fall out naturally. You can't make the same guarantees if you want *static* analysis here, but [static guarantees between distinc language semantics is an open research problem][linking types] anyway.

For example, Crochet could define an Alien for interacting with JavaScript code that looks like this:

```
singleton js;
type js-value(raw is unknown);

// Common constructors
command js string: (X is text) = ...;
command js number: (X is float-64bit) = ...;
command js bigint: (X is integer) = ...;
command js true = ...;
command js false = ...;

// Common operators
command js or: (X is js-value) with: (Y is js-value) = ...;
```

In this way, rather than having users write JavaScript code (which none of the Crochet tools can analyse or sandbox), we have users write Crochet code that expose the JavaScript semantics we *want*. We can pick and choose how to divide these capabilities (e.g.: rather than having a single `js` type grant all JS capabilities, we can divide them into safer boxes, or model part of JS's type system in Crochet, so a similar reasoning of Crochet's object-capability model can be applied to JS's objects too).

Further, because these are just regular Crochet primitives (with commands that have special behaviour), we can rely on the same ideas Crochet has for [granting and reasoning about capabilities and risks][crochet-cap], and the same [dynamic techniques for broadening or restricting capabilities][ocap-teq]. We can create new, smaller types that give very restricted direct access to JS types to a piece of arbitrary code with full knowledge of what semantics they would have access to.


## Reconciling FFIs with Syntax

Of course, once you start going down this Alien rabbit hole, there's a small thing that might really start bothering you depending on the language you're using. For example, the encoding we'd drafted above would turn JavaScript code like this:

```js
function distance(p1, p2) {
  return Math.sqrt(((p2.x - p1.x)**2) + ((p2.y - p2.y)**2));
}
```

Into beautiful Crochet code that looks like this:

```
command p1 distance: p2 do
  let X1 = js project: p1 field: "x";
  let X2 = js project: p2 field: "x";

  let Y1 = js project: p1 field: "y";
  let Y2 = js project: p2 field: "y";

  let A = js pow: (js sub: X2 and: X1) by: 2;
  let B = js pow: (js sub: Y2 and: Y1) by: 2;

  let Sqrt = js project: js math field: "sqrt";
  js apply: Sqrt to: (js add: A and: B);
end
```

Readable, right?

Well, anyway, if we want aliens to be usable at all, we need to do something about the encoding here. Using a JS value should, at the very least, feel similar to using a Crochet value. [Newspeak][newspeak] does so by relying on Smalltalk's traditional `doesNotUnderstand:` message, which is called any time you try to invoke a method that does not exist on an object.

For example, `js.math.sqrt(...)` would see that `math` does not exist in the object `js`, then call instead `js.doesNotUnderstand("math")`. The implementation of `doesNotUnderstand` would use runtime reflection to pluck the `math` field at runtime, essentially translating `js.math` to `js.project("math")` dynamically. Same would be done with `x.sqrt(...)`, just this time it would be translated into `x.doesNotUnderstand("sqrt", ...)`, and that would in turn translate it to `x.invoke("sqrt", ...)`.

The way Crochet uses multi-methods is not really amenable to this sort of dynamic translations, because there's no such thing as a function that is called when a multi-method application fails. Instead, what Crochet can do is model common JavaScript semantics into multi-methods dispatched over JavaScript types, and in that sense at least lessen the syntactical baggage:

```
command (p1 is js-object) distance: (p2 is js-object) do
  let X = (p2 at: "x") - (p1 at: "x"); // :: js-number
  let Y = (p2 at: "y") - (p1 at: "y"); // :: js-number
  let Sqrt = js math at: "sqrt";
  Sqrt apply: X**2 + Y**2;
end
```

A different approach, however, is to convert JS types to Crochet types when importing them, and automatically convert them back when exporting them. Newspeak calls these methods `alienate:` (for importing, to become an alien in Newspeak), and `expatriate:` (for exporting, to move the value to another language). Which is [also the terminology I used in my previous language, Siren][siren-alien], when I implemented this concept. Siren's implementation is heavily lifted from Newspeak's, as both languages' semantics overlap significantly.

In this sense, when I call a JavaScript function and get back a BigInt, this "translation layer" would give me back a Crochet integer. But when I pass this Crochet integer back into a JavaScript function later the "translation layer" would automatically convert it to the correct JavaScript type, too. And so we get the following:

```
command (p1 is record) distance: (p1 is record) =
  js.Math.sqrt(((p2.x - p1.x) ** 2) + ((p2.y - p1.y) ** 2))
test
  let P1 = js.Point2d(1.0, 2.0);
  let P2 = js.Point2d(2.0, 3.0);
  assert (P1 distance: P2) === 1.0;
end
```

Of course we want to do all of these conversions in a "safe" way, too. For example, because Crochet is hosted on a JavaScript VM, we need to be *very careful* when passing Crochet types to the JS side because we do not want arbitrary JS to tamper with the internals of Crochet memory—that would rid us of all semantic and security guarantees we've been trying to keep by moving to aliens in the first place!

The way we solve this is by only sending immutable primitives, sealed objects, and far references. This, of course, enters the same area [Membranes][membrane] fulfill for exchanging data between remote nodes or processes in languages with object-capability security, or actors, or that are just a bit mindful of safety. And well, you see this for the same security purposes in systems like Firefox, so it's not really restricted to programming languages.

This translation layer for an Alien needs to do much of the same work Membranes do for exchanging values between remote nodes or processes. You want to make sure the remote entity that is not under *your* control have access to only data you give it, and have access only to actions you explicitly allow, but nothing more than that. But you also want to make sure you don't create three thousand layers of wrappers to keep these guarantees.


## Optimising Aliens

One of the great things about the static form of FFIs is that your compiler actually knows where the boundaries are, it might *even* know what the necessary semantic adjustments are, so it can do all of that work at compile time. This makes crossing boundaries a bit less expensive.

Aliens do all of their work at runtime, which means that you can only really optimise this work away by using a Just-in-Time compiler. And you might need to invalidate assumptions more often than you'd hope, because the external system you're lending these objects to is entirely outside of your compiler's control.

Incidentally, GraalVM contains an interesting optimisation of this, because the VM is essentially just making several distinct languages talk to each other all the time so it kinda has to solve this problem anyway. In GraalVM, each language gets its own interpreter (you write a regular AST interpreter in their Truffle framework), but languages can interact with each other. These interaction points are special AST nodes: when the VM reaches them, it takes the data from the current interpreter and asks the interpreter that owns the foreign object to operate on it—in very traditional message-passing style. It can then [optimise that with the same tracing JIT techniques it uses elsewhere][interleaved interpreters], basically replacing the special message passing node with its optimised instructions.


## Reasoning about Aliens

Aliens are a form of FFI, except they're interleaved through the code as if they were just... using the regular semantics of the language you're writing your programs in. Some innocent-looking code like `X * Y` could actually be invoking semantics that are wildly different from what one would expect from a `*` function.

Reasoning about language interoperability is tricky exactly because the semantics are not the same, and Aliens have the ability of muddying the waters so much that you can't even tell where the boundaries are anymore. The work on [linking types][linking types] is great in that it gives us a framework for reasoning about these language interoperation pairs in a more formal sense, and thus think more about what guarantees we can expect, but they're primarily developed as a static reasoning technique.

Again, Aliens are dynamic. But that does not mean they are entirely devoid of information we can use for reasoning. As we've seen before, Crochet can reify (or rather, has to reify) these foreign concepts in the type system, and then use multi-methods to distribute capabilities; just like it does for regular Crochet concepts. The fact that foreign objects have an unknown type *at compile time* isn't an issue, because Crochet is designed with a gradual type system for this exact reason. So the tools for reasoning about Crochet code, and reasoning about Alien code are largely the same, when the semantics differ significantly enough, that can be captured in the (runtime) types.

Like with [contracts][] and [soft contract checking][], we can trade execution speed at runtime for safety by moving more verification of semantic guarantees to runtime. In that sense we can further reify these guarantees in runtime types and check them at gradual boundaries, but eliminate them when the compiler can make static guarantees from the way they flow. This lowers the burden of proving the soundness of these guarantees as well (though with less fortunate effects in checking things like [non-interference][]), as the target audience of Crochet is non-professional programmers (mostly artists, writers, and other creative people), but it also opens up more possibilities for them by lowering the barriers of using data and programs coming from "outsider semantics".


- - -

## More on this

Well, though all of this is more or less "plans I've made for the future", not concrete implementations that can be used today. Crochet still does not have an Alien-based FFI system, like Siren had before it. But that's in the roadmap!

If you're interested in diving deeper in the subjects I've (barely) touched upon in this article, here are some links to get you started (as always):


- [Unidentified Foreign Objects (UFOs)](https://gbracha.blogspot.com/2008/12/unidentified-foreign-objects-ufos.html)  
  --- *Gilad Bracha*<br>
  I had briefly looked at Aliens implemented in Newspeak before, but Gilad's blog post was what made it click for me. "Oh. Right. That's why these can be just an object. It makes so much sense now." It's short and to the point, and you don't need to know Smalltalk to see where it's going.

- [Robust Composition: Towards a Unified Approach to Access Control and Concurrency Control](http://erights.org/talks/thesis/index.html)  
  --- *Mark S. Miller*<br>
  Mark's thesis on object-capability security is a very good place to have a deeper understanding of OCaps. It also discusses membranes as a technique for sharing values with a thirdy party while remaining in control of its usage.

- [Mirrors: Design Principles for Meta-level Facilities of Object-Oriented Programming Languages](https://bracha.org/mirrors.pdf)  
  --- *Gilad Bracha, and David Ungar*<br>
  Gilad and David's paper on Mirrors shows how one can reconcile the idea of runtime reflection (of any kind!) and object-capability security, when reflection can subvert entire classes of semantic guarantees in a language. Used earlier in Self, and later in more security-conscious OOPLs like Newspeak.

- [All the Languages Together](https://www.youtube.com/watch?v=3yVc5t-g-VU)  
  --- *Amal Ahmed (Youtube video)*<br>
  Amal presents the work on linking types and the nightmare that is trying to make any static guarantees about the interoperability of two different languages. There's [a written treatise on linking types](https://www.ccs.neu.edu/home/amal/papers/linking-types.pdf), too, if you'd rather read things than watch them. I have not read Daniel's thesis yet on the subject to recommend (but I need to...)


[multimethod]: https://robotlolita.me/diary/2022/12/oop-multimethods/
[membrane]: http://erights.org/talks/thesis/index.html
[actors]: https://en.wikipedia.org/wiki/Actor_model
[ffi]: https://en.wikipedia.org/wiki/Foreign_function_interface
[alien]: https://gbracha.blogspot.com/2008/12/unidentified-foreign-objects-ufos.html
[mirror]: https://bracha.org/mirrors.pdf
[crochet-cap]: https://crochet.qteati.me/docs/reference/system/security/groups.html#
[ocap]: https://en.wikipedia.org/wiki/Object-capability_model
[ocap-teq]: https://crochet.qteati.me/docs/reference/system/security/dynamic.html
[siren-alien]: https://github.com/robotlolita/siren/blob/master/runtime/src/JS.siren
[interleaved interpreters]: https://dl.acm.org/doi/10.1145/2660252.2660256
[linking types]: https://www.youtube.com/watch?v=3yVc5t-g-VU
[fmod]: https://people.mpi-sws.org/~rossberg/f-ing/
[newspeak]: https://newspeaklanguage.org/
[contracts]: https://docs.racket-lang.org/guide/contract-boundaries.html
[soft contract checking]: https://arxiv.org/abs/1307.6239
[non-interference]: https://en.wikipedia.org/wiki/Non-interference_(security)
