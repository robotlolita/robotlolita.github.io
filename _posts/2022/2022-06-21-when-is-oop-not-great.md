---
layout: article
title: "When is OOP not that great?"
card_type: summary_large_image
card_image: /files/2022/06/oop-card.png
---

As you might know, I really like object-oriented programming. I also have
designed and implemented several object-oriented languages. Which, in
turn, means that I've seen plenty of the not-so-great sides of the
idea, both in the theory underlying it and in actual language implementations.

So let me rant a little bit about the things that have not brought me
that much joy.

![](/files/2022/06/oop-card.png)
{: .centred-image .full-image }

<!--more-->

> <strong class="heading">Note</strong>  
> This was originally posted as a Quora answer for the question
> "Why is OO programming considered bad by some people?"
{: .trivia .note}

It's important to note that much of the criticism in this article applies
to the languages I've designed as well; even to Crochet, which has deviated
a lot from classical notions of "object-orientation".

## Summary

  1. Safe & modular extension of operations is not practical in existing OO languages or in existing research on this exact problem;
  2. Mainstream OO (Java, C++, Python, Ruby, JS, Scala, Swift, …) can’t use much of the foundations/recent research, requires too many design patterns to circumvent limitations;
  3. Most OO languages are unsafe in the presence of untrusted code;
  4. Most OO languages do not support multiple dispatch, results in awkward design decisions/asymmetry problems;
  5. Some OO concepts (e.g.: inheritance) are too complex compared to solutions to the same problem of reuse in other models;
  6. Closer-to-Kay’s vision environments for OO (Pharo, Squeak, Self, …) require significant investment due to lack of popularity/mismatch with OS tools;
  7. In most languages, concurrency tends to be a bigger issue than in FP;
  8. Static checking (type systems) requires you to give up on more advanced features/tooling that OO environments promise; Even practical type systems tend to be much more complicated than FP ones because of subtyping;

## I. Safe/modular extension

Programs are increasingly more complex, and a lot of parts of a system are not written/owned by the people writing the system. We use a lot of third-party libraries and frameworks. Sometimes, we need these objects written by other people to do additional things, or fit into different places, but we don’t have access to the source code, and changing it directly would mean that we have to maintain it anyway. Wadler calls this the Expression Problem[^1]. Object orientation makes solving this problem harder than FP, because it bundles behaviour and data together. The current solutions are far from ideal.

Current solutions:

  - **design patterns**[^2] (**Adapter**[^3]) and **object algebras**[^4] require too much boilerplate, and tend to require significantly more effort in typed languages;
  - **open classes**[^5] are inherently unsafe, unpredictable, and hostile to future changes — they are not modular;
  - **extension methods**[^6] are not object oriented, and are limited to static, lexical contexts;
  - **protocols**[^7] and **multimethods**[^8] are better solutions, but tend to enforce some kind of _global coherence_[^9], so they are not modular[^10]—note that this also applies to Type Classes in Haskell;
  - **not using OO**. This is where all those dreaded utility classes come from, which are really FP/procedural programming. This is a no-solution for OO, but people use it because it solves the problem they need to;

Solutions we get from extending Object Oriented programming to a superset of the model:

  - **Aspect-Oriented Programming**[^11] makes understanding the behaviour of programs much more difficult, because pieces are all over the place;
  - **Subjective/Context-Oriented Programming**[^12] makes understanding _dispatch_ much more difficult, because each dispatch depends on implicit context that’s not available at the call-site;
  - **Implicit Calculus**[^13] (which Scala uses) are very modular and somewhat easier to reason about, but not globally coherent. This gives us some interesting issues[^14];

Now, you can limit some of the problems above by limiting the pervasiveness of these features (for example, [Siren][] limits contexts to explicit opt-in in a lexical context[^15]), but then you get other problems with adaptability of existing code or with coherence. Plus, they’re not really that well researched yet (context-oriented programming is hard to optimise, implicit calculus is from 2012, etc).

So, yeah, we don’t have good solutions here, but OO languages suffer more with this than FP languages because objects merge behaviours and data structures.


## II. Mainstream OO is not quite "OO"

And here I’m not even talking about the problem with the definition of the term [“object oriented,”][oo] but rather that mainstream languages are generally multi-paradigm, so they offer more than one fundamental model which you can use to solve the problems.

That’s all well and good, except that composition between these different features are now much more complicated than if they were all build from the same basic-building block. Some of these don’t really compose (see Java’s lambdas or JavaScript’s getters/setters). This results in programs that require a different mindset to be understood in different parts, but also in programs that you can’t abstract in an uniform way.

For example, Python allows you to have list comprehensions, but list comprehensions are not built upon object-oriented features, it’s its own sub-language, with its own rules, and its own abstraction facilities. Java separates methods from members, if some class has a public member X, you can’t extend that object and turn it into a method X that computes the same value lazily, it changes the type of the class.


## III. Mainstream OO is unsafe with untrusted code

This is not an inherent object-oriented limitation (Object-Capability Security is a concept that fixes this[^16]), but rather a problem with the implementation of mainstream OO languages.

In those languages, arbitrary effects can happen anywhere AND every piece of code has access to everything in the system by default. Nothing prevents an untrusted piece of code in JavaScript, running under Node.js, from doing a `require("fs")` call and delete arbitrary files from your HDD when you run innocent-looking code like `1 + foo`. Java mitigates this by providing some privilege verification with stack inspection, but it’s just nowhere near as effective as OCap, and adds significant overhead.

Pure functional languages sidestep some of this problem by just forbidding any effects by default[^18], so you know that effects can only happen in certain contexts, and with a good effects system you know exactly which effects can happen in that context. Of course, impure languages (most FP ones) still have the same problem OO languages do.


## IV. Design and single-dispatch

Consider an operation as simple as `2 + 4`. In object orientation, `+` is required to be a method, and `2` and `4` must be arguments of this method. Should this method live on the object 2 or on the object 4? How should `2 + "foo"` be handled?

Kay has discussed a bit of this in The Early History of Smalltalk[^19]. Does it really make sense to think of numbers as objects and common mathematical operations as sending messages to an object? The conclusion was more that doing so enabled a kind of generic programming (where `+` could be overloaded in a simple way), so it wasn't about making sense, but rather just something you had to accept to enable other kinds of stuff.

There’s one major problem with single-dispatch (where one object owns the task of responding to messages exclusively): _asymmetry_[^20], in which code like `a + b` may execute an entirely different operation than `b + a`, because `a` and `b` are different objects, with different methods. Double-dispatch only alleviates the problem, multiple-dispatch "solves it", but at the cost of being much harder to optimise, and making reasoning about dispatch behaviour much harder as well[^21], in particular if you include subtyping, or things like predicate-based dispatch[^17].

Another problem with one object owning the method is deciding where operations should go. Should it be `number.toString()` or `string.fromNumber(number)`? Both require each data structure to know about possibly internal details of each other, which is not ideal.


## V. Inheritance is too complex

It’s very common for object-oriented systems to include some kind of inheritance, which is then used for code reuse. One of the major problems here is that inheritance must be a preserving subtype relationship. That is, if you inherit from class A, then class A’ must have all of the _exact same behaviours_ A had, plus some more. You can’t remove or change things! Allowing people to override definitions leads to problems[^22] [^23]!

Another problem with inheritance is its power: single inheritance is not powerful enough to solve most of the complex “reuse” problems, requiring people to pack much more than needed into a single class or object. Multiple inheritance works as a composition mechanism, but leads to ambiguous dispatch rules that tend to be solved in ways that are harder to predict[^24], in particular when these can be changed dynamically[^25].

Mixins tend to be a better solution for reuse, but they still suffer from lack of predictability, and conflict resolution is inexistent in the model. Trait[^26] solve the problems with mixins by providing symmetric composition operators, but they are not really implemented in any language.


## VI. Better OO systems require significant investment

Highly dynamic systems, such as [Pharo][], [Squeak][], [Self][], etc. solve many of the problems and limitations in Object-Oriented languages with specialised tooling. This integrated development environment (not to be confused with what “IDE” means in industry) is extremely powerful for working with object systems[^30], but in order to really benefit from this power you have to reject all of the tools you know and are used to from your OS.

You don’t use files, instead you modify objects directly in memory, and the system serialises your actions; There’s no Git, instead you use an integrated version control system developed specifically for changes in objects; There’s no terminal, instead you have a live scratchpad where you can try things; etc.

This is a significant investment for those who are starting to use these systems, because they won’t really be that productive until they learn all of these new tools, and it’s also a significant investment for people who are implementing these systems, because they have to reinvent all of these tools that already exist outside of the walled garden, such as Git or the terminal.

The image format many Smalltalk-like environments use is also it’s great blessing and its great curse.


## VII. OO languages tend to be bad at concurrency

This is not a problem of the OO model. Far from it. Remember that this is the model that influenced most of the late research on Actors[^32], and was in turn greatly influenced by early research on it. Rather, it’s a problem with how most Object-Oriented languages are implemented[^33].

In our usual mainstream languages, we don’t really use objects for concurrency. Instead, we use shared memory! This is a terrible idea, results in programs that are usually more sequential to be on the safe side (aggressive synchronisation where it’s not necessary), or programs that simply try to go for optimal concurrency and end up with data races.

Functional programming avoids a lot of these problems by favouring pure functions, and sometimes by not having an enforced order of execution. This allows compilers to do a lot of great optimisations for you, plus it makes data races impossible by design.

Pony[^34] is an exciting object-oriented language here, but it’s definitely not mainstream. Incidentally, Erlang[^35] and Elixir are also exciting, but far from what most people would consider object-oriented. At least Kay seems to think that Erlang got part of the original Smalltalk vision right[^36].


## VIII. Type systems for OOPLs are too complex

Subtyping relationships are complicated, and invariant functions are much easier to understand — some object-oriented languages that use subtyping allow unsound types to make things easier for users[^37]. Row polymorphism tends to be easier to understand[^38], and avoids some of the problems with loss of information with subtypes. We’re still studying how to infer good types in the presence of subtyping[^39], and even then we’re still at a loss for how to provide good error messages for inferred types — what this means in practice is that the programmer needs to have a deeper understanding of the subtyping rules and provide explicit types in more places.

Functional programming languages tend to avoid subtyping, so for most things it’s easier for developers with less knowledge of type theory to understand how types work in functional programs. This is, of course, not true with more static functional languages moving towards very sophisticated typing features, and closer to dependent types. But things like higher-kinds and GADTs don’t tend to appear as a fundamental feature as much outside of Haskell, whereas subtyping is very pervasive in Object-Oriented languages.

Another problem with static verification of object-oriented languages is that many of the features considered as “core” features by some OO programmers are too dynamic to allow simple type systems. Things like Aliens[^40], Mirrors[^41], `becomes:`, changing shapes at runtime, and friends can’t be given types in most type systems. You either give up on static typing entirely (which is what languages closer to the Smalltalk philosophy do), or you add dependent types, which require significant effort to prove to the type system that your usage of these features is sound — though types that are derived from runtime values unknown to the compiler are still a problem.


## Conclusion

Object-Oriented programming has many flaws, and many of these are inherent in the models-as-we-know it. Some later models (AOP, COP, etc) fixes some of these flaws, but bring their own costs in understanding the code, which is not that great. New concepts (like Traits) alleviate some of these flaws, but lack implementations and sometimes impose additional overhead.

Other models really just have different kinds of problems (although FP in particular seems to be doing better in the modularity, safety, and concurrency aspect). It doesn’t seem that a fundamental model for computations, that is actually usable for larger programs, exists. Though Out of the Tar Pit[^42] argues for a relational one instead of an object-oriented one, it's not like that has withstood the test of time (and production usage).

---

[Siren]: https://github.com/robotlolita/siren
[oo]: https://github.com/siren-lang/siren/blob/master/documentation/notes/faq.md#is-siren-an-object-oriented-language
[Pharo]: https://pharo.org/
[Squeak]: http://squeak.org/
[Self]: http://www.selflanguage.org/

<h4 class="normalcase borderless">Related reading & Footnotes</h4>

[^1]: Wadler coined [The Expression Problem](https://homepages.inf.ed.ac.uk/wadler/papers/expression/expression.txt), which is really just a cute name for how programming languages in the 90s generally had to choose if they wanted to make it easy to add new operations to types without changing the source code defining those types (as FP does with pattern matching and functions); or add new types without changing existing operations' source code (as OOP does with classes). We've come a long way since them and the problem isn't as _relevant_ these days, but there are still some fundamental aspects of modular extensions that aren't entirely solved.

[^2]: There are plenty of discussions on whether [design patterns are missing features](http://wiki.c2.com/?AreDesignPatternsMissingLanguageFeatures) in a language; which they are, in a sense. However, patterns just arise naturally in any work anyway. The fact that design patterns are given name just means that people have recognised them as concepts that are useful to communicate.

[^3]: The [adapter pattern](http://wiki.c2.com/?AdapterPattern) lets one extend classes without touching the original definition, but does so by lifting and lowering the objects into a different type universe. Haskell uses the same approach to compose monads—which you could see as "extending the semantics of effects without touching the definition".

[^4]: Bruno Oliveira and William Cook's idea of [Object Algebras](https://www.cs.utexas.edu/~wcook/Drafts/2012/ecoop2012.pdf) is pretty much a more principled form of the adapter pattern, really. It still requires significant (code) investment in a language like Java.

[^5]: Ruby has open classes, which basically means that you can modify a class definition from any file, not just from its original definition site. JavaScript allows the same, both to prototypes and its idea of classes. This is more popularly called "monkey patching".

[^6]: C#, and I believe Swift as well?, has some idea of [Extension Methods](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/extension-methods), which are basically regular functions that are brought into lexical scope when you import them, and that the language allows you to use, as a convenience, with the regular `object.function_name(...)` syntax, as long as it knows the correct type to select the proper `function_name`.

[^7]: [Protocols](https://elixir-lang.org/getting-started/protocols.html) are pretty much interfaces that aggregate implementations and perform dispatch based on the type. They're also called "Type Classes" (as in Haskell), "Interfaces" (as in Go), "Traits" (as in Rust), and possibly other names depending on the language you're looking at, though most of these names is not consistently used.

[^8]: [Multimethods](http://wiki.c2.com/?MultiMethods) are regular functions that can have multiple implementations, and the implementation is selected based on the types, or other characteristic, of all values involved. Julia has them, and so does Crochet; though of course Crochet calls them [Commands](https://crochet.qteati.me/docs/reference/system/commands/dispatch.html) instead.

[^9]: I'm unsure how prevalent the definition is outside of Haskell, but here I'm using the term ["globally coherent" system](http://blog.ezyang.com/2014/07/type-classes-confluence-coherence-global-uniqueness/) to describe one where all invocations of some operation will consider the same set of operations during its dispatch; the system has a consistent, system-wide view of that operation, rather than a local/contextual one.

[^10]: Type Classes in Haskell are not modular, though [modular type classes](https://github.com/purescript/purescript/issues/1886) have been proposed. The trade-off is, again, that you give up on coherence, as the same type class is allowed to consider a different set of operations depending on where it's called in the system. The big reason Crochet decided on not doing this was the potential for confusion that it brings, which did not outweight the marginal benefit of modularity to me.

[^11]: [Aspect-Oriented Programming](https://www.youtube.com/watch?v=40Q16Ix-src) allows you to extend a system modularly by, uh, transforming its definitions with a meta language. I have not personally used it, so I can't comment much, but people who have claimed it was both great and also harder to understand.

[^12]: Though not exactly "new", [subjective/context-oriented programming](https://homepages.ecs.vuw.ac.nz/~servetto/Fool2014/FundationForObjectAspectAndContextOrientedProgramming) was something I was very interested in my research a few years ago. But in the end I never figured how to make it both have a good modularity story for me while remaining understandable. I imagine you'd need very different tools for working with the system, as Ossher, Ungar, and Kimelman's paper above claims, but I don't think I've seen any sketch of such system so far. Which also means I've moved on to more restricted semantics instead.

[^13]: Scala's [implicit calculus](https://arxiv.org/abs/1203.4499) is the thing underlying the "implicits" part of the syntax. I have no experience with it, but semantically it makes the same trade-offs modular type classes do, just with different ways of getting there.

[^14]: Have you ever used the "is this thing less than that thing" operation multiple times on the exact same values and got very different results? [These are the kind of bugs](https://github.com/scalaz/scalaz/issues/1236) that really make me want to stay away from non-globally coherent extensions as a solution for modularity. And why Crochet has picked a very different route there.

[^15]: Siren's idea of making context-oriented programming slightly more tractable when looking at a static piece of source code was to [make contexts lexically scoped](https://github.com/robotlolita/siren/blob/master/documentation/overview.md#safe-extensions-and-contexts). This works reasonably well, but then you need to remember to pass contexts around and install them in the current scope, which is not unreasonable for some very specific DSLs, but didn't pan that well for everything else, so I ended up abandoning the idea. Well, not before [toying with a different way of achieving that](https://github.com/robotlolita/siren/blob/master/documentation/notes/object-model.md) and realising it really wouldn't work.

[^16]: [Capabilities](https://crochet.qteati.me/docs/reference/system/security/why.html) are the core of pretty much every security idea in Crochet, and I still think they should be in more languages. OCap is the idea of merging objects and capabilities, since you need to figure out how to use "unforgeable identities" to "restrict what someone can do", and objects give you both: object identities are unforgeable, and methods restrict what you can do. Alas, you can't just retrofit OCap in existing OO languages because you'd first need to start from "no access to any object that isn't handed out to you", and pretty much every existing piece of code breaks under that constraint.

[^18]: Functional languages [controlling effects](https://www.quora.com/How-should-one-use-side-effects-in-functional-programming-if-pure-FP-is-excluding-using-side-effects/answer/Quildreen-Motta) makes a lot of the static reasoning about security aspects of the code incidentally a lot more tractable. Without it you have to assume that any piece of code can do anything; with some kind of effect typing or controlled effects, at least the things the code you're looking at can do are expressed there in the type signature, and this allows you to ignore a fair bit of uninteresting code when doing audits. It can also signal code that you don't want to audit because it requires very questionable powers in order to work—a library for generic push-based streams shouldn't require "file system powers".

[^19]: Alan Kay wrote about some of the design issues that arised in Smalltalk in the aptly named [The Early History of Smalltalk](http://worrydream.com/EarlyHistoryOfSmalltalk/#p17), also aptly published in the [History of Programming Languages](https://en.wikipedia.org/wiki/History_of_Programming_Languages_(conference)) conference. The question of whether it even makes sense for numbers to have methods was one of these issues discussed, but the entire paper is worth a read.

[^20]: Craig Chambers discusses the differences between single-dispatch and multi-dispatch (and issues multi-dispatch solves) in the [Object-Oriented Multi-Methods in Cecil](https://dl.acm.org/doi/10.5555/646150.679216) paper. As well as some other things about the philosophy of multi-methods being "object-oriented" or not which are less relevant here.

[^21]: Type-checking things gets quite tricky as you add more possibilities to some piece of code. So does static reasoning. [Type Checking Modular Multiple Dispatch with Parametric Polymorphism and Multiple Inheritance](https://people.mpi-sws.org/~skilpat/papers/multipoly.pdf) gives you an idea of what kind of world you're getting into if you decide to address that particular problem.

[^17]: Pretty much everything said about multi-methods also applies to its "generalisation", [Predicate Dispatching](https://homes.cs.washington.edu/~mernst/pubs/dispatching-ecoop98-abstract.html). Though I remain skeptical of how well you can optimise predicate-based dispatching in actual code; if JavaScript has taught us anything is that if you give people power they are going to use it, and you, poor compiler writer, might very well get a job, but (literally) at what cost!

[^22]: The [Circle/Ellipse Problem](http://wiki.c2.com/?CircleAndEllipseProblem) is another cute name for the idea that inheritance breaks down once you start changing semantics and properties established by a type higher in the hierarchy.

[^23]: While there are ["solutions" to the Circle/Ellipse Problem](https://www.quora.com/Which-languages-have-a-solution-to-the-circle-ellipse-problem-in-OOP/answer/Quildreen-Motta), the issue remains one of changing expectations that were previously established. We should not have taken Liskov's description of the [Liskov Substitution Principle](https://en.wikipedia.org/wiki/Liskov_substitution_principle) lightly!

[^24]: I personally have always struggled a lot with reasoning about code that uses multi-inheritance. Sure, Python does [linearisation](https://en.wikipedia.org/wiki/C3_linearization), so you can, in theory, know what will happen at runtime, but the last thing I want to do in my life is to become a compiler or virtual machine.

[^25]: [Prototypes with Multiple Dispatch](http://www.cs.cmu.edu/~aldrich/papers/ecoop05pmd.pdf) merges everything that's good from prototype-based object orientation, multi-methods, and Self-style modifications of delegation slots (which you get in JavaScript through `setPrototype`). Slate has it, and I have not used it to any good extent to comment on the language, however as someone who has designed an OOP language with similar semantics before... personally I'd rather not have that much freedom.

[^26]: The name "Traits" is used to mean at least three hundred different things in computers, but here I mean the [Traits research](http://scg.unibe.ch/research/traits), which pretty much describes a kind of "mixin" with more static guarantees for composition, including semantic operations in the language for adapting and combining them even if the definitions would conflict. I haven't seen any real production implementation in wide use for it, though, sadly.

[^30]: I do strongly believe that there's [a lot that systems could incorporate from tools like Smalltalk IDEs](https://medium.com/smalltalk-talk/choosing-smalltalk-on-porpoise-9bccb7cd53f). The ability of having domain-specific tools for working with your code entities, rather than having to play compilers in your head from a sheet (well, screen) of text is really great.

[^32]: [Actors](https://eighty-twenty.org/2016/10/18/actors-hopl) are great. Actors are lovely. But it's truly interesting how OOP and Actors have influenced each other at the very beginning, even though they didn't come from the same place initially.

[^33]: I still regard [Java's synchronised blocks](https://www.quora.com/Is-there-a-more-powerful-tool-for-multithreading-than-synchronized-blocks-in-Java/answer/Quildreen-Motta) as a mistake. They're easy to use as long as you don't want concurrency, which is exactly the problem there.

[^34]: [Pony](https://www.ponylang.io/) deserves some more love. There's some very interesting ideas in it, like the way it handles garbage collecting with its actor-based runtime, and the way it uses a small type system for preventing data races, but through lattices instead of a theory of resource consumption (as in Rust's affine types/borrow checker).

[^35]: [Erlang](https://www.erlang.org/) also deserves some more love. It's not apparent from looking at Crochet, but a lot of the ideas in Crochet come from either Erlang, the language, or its standard distribution, OTP. For example, [Crochet's actors implementation](https://github.com/qteatime/crochet/blob/main/stdlib/crochet.concurrency/source/actor.crochet) is heavily inspired by the way in which Erlang's `receive` blocks allow actors to define how they want to handle the messages in the mailbox—except Crochet does it with types instead of pattern matching; so Actors form a kind of state machine and assume different types to change which messages they handle.

[^36]: [Joe and Kay's short discussions](https://www.youtube.com/watch?v=fhOHn9TClXY) on programming languages is pretty interesting to listen to, if you're into history, object-oriented programming, concurrency, or all of the previous things.

[^37]: I should make it clear here that, as someone who has programmed in object-oriented languages for several years, and who has dealt with type systems for several years, and who has done their fair share of static analysis and verification; I still have no idea how to think about [variance in object-oriented type systems](https://www.typescriptlang.org/docs/handbook/type-compatibility.html).

[^38]: [Row-polymorphism](https://www.quora.com/Object-Oriented-Programming-What-is-a-concise-definition-of-polymorphism/answer/Quildreen-Motta), on the other hand? Yes, that's much easier for me to follow. Type comes in with a certain shape (and possibly more stuff in it), type goes out with a different shape (and possibly reincorporating the more stuff we got previously). More languages should do row-polymorphism instead of subtyping, as far as I'm concerned (as a user).

[^39]: When I originally posted this answer, I had read the [Polymorphism, subtyping, and type inference in MLsub](https://dl.acm.org/doi/10.1145/3009837.3009882), but it's been years and I have no recollection of this place anymore. I'll keep the link where it was before though.

[^40]: [Aliens](https://gbracha.blogspot.com/2008/12/unidentified-foreign-objects-ufos.html) are the approach some Smalltalk implementations and dialects use for FFI. Essentially, it's an object provides operations you can call, and handle converting the data to the target semantics and from the target semantics, as your values cross language boundaries. The good thing about them (and the reason I used them in Siren initially) is that you can have multiple FFI semantics in the same language, because the FFI is not defined by your runtime, VM, or compiler. That opens up a lot of possibilities (but also creates some issues with optimisations—all your FFI is dynamic and impossible to analyse).

[^41]: [Mirrors](https://gbracha.blogspot.com/2010/03/through-looking-glass-darkly.html) are pretty much a more principled approach to reflection that is compatible with object-capability security. Just like regular reflection, however, Mirrors can't really be given useful types; at least not without significant (and unrewarded) effort.

[^42]: The [Out of the Tar Pit](http://curtclifton.net/papers/MoseleyMarks06a.pdf) paper is a long rant about software complexity, which argues for the use of relational programming-based techniques, though does not provide anything that supports its claim in actual production usage. It is an interesting rant, though.

