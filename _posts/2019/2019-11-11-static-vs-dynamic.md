---
layout: article
title: "Static vs. Dynamic PLs for large systems"
card_type: summary
card_description: "Are dynamic languages just as good as compile-time static type languages for large, complex projects?"
---

**Are dynamic languages just as good as compile-time static type languages for large, complex projects?**

Yes. Kinda. But it’s a tad bit more complicated than “static vs dynamic languages” here.

> <strong class="heading">Note</strong>
> I’ll answer this question from my own experiences with maintaining large projects—mostly language implementations and web services—, as I haven’t really read much literature on this topic. I have no idea how much this generalises to other people/kinds of projects.
{: .warning .note }

---

There are a few things I’m really concerned about when maintaining large projects:

- I’ll never know everything about the code-base. There are some aspects of it that I’ll know **nothing** about. There are many aspects I’ll only have a very superficial understanding;
- Whenever I make a change, I want to be able to do it with the confidence that I’m not breaking other parts;
- I want to be able to communicate ideas and concepts in the code precisely and concisely with all developers working on the code-base. Here I mean that this extends beyond my own team, and encompasses past and future developers as well;
- I want to be able to explore the code and its relationships without having to read **the entire thing**;
- Decisions made in the past are often overruled by decisions in the present, which cause large ripples of changes in the code-base. I want to be able to do these extensive changes with as little pain as possible—as otherwise tech-debt keeps accumulating forever, and the cost of changes increase substantially;

So, if I were to capture these concerns in a few words, I could go with the following: “confidence”, “exploration”, “communication”, and “evolution”. I’ll expand on each of these in the following sections, and my experiences with dynamic and static languages.

<!--more-->

## THE CONFIDENCE PROBLEM

Large code-bases tend to be the product of several different engineers working over many years—often decades—on it. As things move forward, engineers come and go. Assumptions change. Patterns and styles change.

I keep joking that joining a large project and working on it feels a lot like doing archaeology, as you need to dig through heaps of artefacts and try to uncover the history behind it—as these decisions tend to be not fully documented. So, instead, you carefully go through your version control history (if you’re lucky enough to have one, as not all of the projects I’ve worked on had this ahaha *sobs*). You try to piece things back together by making assumptions and trying to verify them by looking at how code evolved and asking around. And, sometimes, the reason things exist has been entirely lost throughout the company so people have to get together and decide how to move forward with it.

It’s an interesting feeling, although it might be nerve-inducing and sometimes quite overwhelming. I feel like that reflects more of the company values than the nature of the work, though.

Anyway. It’s hard to be completely confident when making these changes. There’s always a possibility that you haven’t thought of that one edge case. That there’s a system that interacts with yours in ways you hadn’t predicted—no one had. There’s just so much that can happen that it’s no wonder some people are very cautious and conservative about changing things—the cost of the changes often doesn’t really pay off the possibility of making your users’ lives more miserable and destroying your product and company’s reputation.

In order to help improve the team’s confidence when doing this kind of work, there are some tools I’ve always reached out to—or seen people reach out to:

### Version control history

Tools like git are **terrible** for tracking code changes—realistically it can only track textual changes. But despite being so limited, it’s one of the most helpful tools in this workflow. You do have to put some restrictions in place; like preventing people from fixing indentation issues or trivial refactoring for the sake of it. With this history in hand, though, you can start from some point in code, and time-travel through its (limited) entire evolution. See how things have changed, see why things have changed.
 
A version control system is independent of programming languages, usually. But some languages/platforms have their own system. While some don’t allow any (like old image-based languages). None of this has any relationship to a language being static or dynamically typed;

### Example-based tests
One of the ways of understanding how things are expected to work is looking through example-based test cases, as they delineate scenarios and expectations pretty directly.

This, again, is independent of a language being static or dynamic;

### Model/Property-based tests
Example-based tests help a lot with understanding specific scenarios, but they don’t help improve confidence over edge-cases. That’s what model-based tests are for. They tend to be **terrible** for understanding, as the model will generally be written in a language unsuitable for this kind of mathematical reasoning, but they’re really good for improving confidence about not missing too many edge-cases.

Again, independent of a language having a type system. But these are far more common to see in functional languages than other ecosystems. Though fuzzing/model checking may be popular in riskier kinds of software.

### Documentation
Of course, documentation is a good starting place to understand high-level ideas about a code-base. But large systems tend to not have comprehensive documentation, and when they do, some of the ideas will usually be out of date.
 
Types can be seen as a form of documentation of expectations for each entity. And in static languages, such documentation can be checked for **consistency** (but not correctness).

---

So, out of all tools for improving confidence that I’ve used, static languages only offer a tiny one: types-for-checked-documentation. The **value** of such tool depends on how many expectations you’re realistically able to encode in the type system. A type system like C’s is completely useless for this. A type system like Idris’ is powerful, but realistically impractical—the time spent to encode interesting properties of the system just doesn’t pay off most of the time in the kind of applications I work on.

There are interesting middle-grounds here. **Gradual typing** gives you more control over the costs—a type system like TypeScript can encode, surprisingly, a lot of interesting properties, although some of it isn’t reliable as it doesn’t do any checking at typed/untyped boundaries. Meanwhile, **dynamic contract systems**, like the one in Racket, give you the possibility of encoding more interesting properties without the cost of having to **prove** those properties consistent throughout your code-base (at the cost of runtime checking). The combination of dynamic contract systems with property-based tests opens up some interesting possibilities for cheap (in terms of effort/time needed) stochastic model checking.

## THE EXPLORATION PROBLEM

I accept that I’ll never fully understand a large code-base. So, instead, I would like to have all tools at my disposal to **explore** a deeper understanding of concepts surrounding the one I’m looking at. For example, I may be interested in seeing where a particular function or definition is used, if I plan on deprecating/changing it—this will let me know what the impact of my change will be, and if the cost of the change is reasonable.

Static languages, in theory, provide us with very neat tools to analyse relationships between code-entities. Interestingly, languages with **richer type systems give us less useful relationships**. In the sense that the set of possibilities is too big, unless you can constrain it somehow.
Consider:

```haskell
(f . g) :: forall a, b, c. (b -> c) -> (a -> b) -> (a -> c) 
(f . g) x = f (g x) 
```

This is a definition of function composition in a language with a Haskell-like type system. Looking at the definition of this function itself tells you about some of the properties of function composition, but tells you **nothing** about how this function is used (or expected to be used). The abstract is, often, the enemy[^1].

None the less. What is **possible** is irrelevant. What really matters is what you can **use. Today.** And many static languages have a poor tooling story. Unsurprisingly, many dynamic languages also have a poor tooling story. Although last time I used both, JavaScript had better tooling than Haskell—from what my Twitter timeline says, Haskell tooling has improved significantly since then.

By tooling here I mean, specifically, tools that let you treat entire **code-bases as** **data**. In the sense that you can ask questions about your code. You can observe properties of your code’s execution (with or without executing it). And you can explore relationships in your code. All of these tools require some sort of static or dynamic **program analysis**. Static analysis is easier in static languages, dynamic analysis is independent of the language having a type system, but requires executing code in some sense.

Through this I expect—at least— tools like renaming symbols through the entire code base. Refactoring definitions through the entire code base. Seeing where things are used. Jumping to a definition from its use-site. And similar features you find in pretty much all modern IDEs, for modern languages.

But I also expect things like:

- Being able to interact with code-pieces (through a REPL, for example);
- Being able to observe different executions of an entity;
- Being suggested possible pieces of code to be used when working in a piece of code with “holes” (i.e.: sub-expressions I’m unsure about);

Most of these are, actually, mostly available in dynamic languages (and some static FP languages). For example, Smalltalk has always been very strong in the area of tooling for analysing programs dynamically:

<iframe width="708" height="520" src="https://www.youtube-nocookie.com/embed/baxtyeFVn3w" frameborder="0" allow="encrypted-media; picture-in-picture" allowfullscreen class="rl-video"></iframe>

Erlang also has a very interesting set of tools for dynamic (and static) program analysis. Sadly, it doesn’t have a good user interface for them.

We’re still at very early stages of “auto-completion” (I’m going to use the term loosely here). Sure we have type-aware suggestions of functions to use, but these are very limited. What I want is to be able to “sketch” programs—provide a rough description of what I want, and, with the help of my IDE, iterate over it, filling the parts I’m not so sure about, and refining the parts I made the wrong assumptions. Some form of typing is essential for this, but there are no typed languages I know of offering this sort of program synthesis today:

<iframe width="708" height="520" src="https://www.youtube-nocookie.com/embed/HnOix9TFy1A" frameborder="0" allow="encrypted-media; picture-in-picture" allowfullscreen class="rl-video"></iframe>

But you know who’s offering program synthesis for users. Today. In an usable state? Excel.

No, seriously. Excel is one of the first mainstream programming languages/environments I’ve seen giving users access to program synthesis[^2] (though by demonstration with data examples).


## THE COMMUNICATION PROBLEM

Typed languages are, undeniably, much better for precise/concise communication, just because types are a form of documentation, and they’re automatically checked in a typed language.

Dynamic languages with checked external type systems enjoy the same benefits. But at that point is it really fair to call them “dynamically typed”? I feel like the definition is a lot blurrier today with type systems getting richer and more gradual.


## THE CROSS-LANGUAGE/SYSTEM PROBLEM

Lastly, it’s important to note that the large, complex software of yesterday is not what the large, complex software of today looks like. Today’s software is increasingly distributed or made out of parts written in different languages, and this comes with its own challenges that **are not solved by type systems** (in any practical language yet).

For the “easy” case of complex software written in different languages (e.g.: the browser you’re using to read this right now), see Ahmed’s research on this problem and why it’s not solved by any typed language yet. Her research is very exciting, but the current state of affairs is—at best—kinda depressing here.

<iframe width="708" height="520" src="https://www.youtube-nocookie.com/embed/3yVc5t-g-VU" frameborder="0" allow="encrypted-media; picture-in-picture" allowfullscreen class="rl-video"></iframe>

For the more common case for the kind of software I work with, distributed systems, you have a somewhat similar problem as what Ahmed explains. You have all of these services, written in different languages, working under different assumptions, having different policies for data, having different change/release cycles, etc. Yet, somehow, these have to work together, “flawlessly”—or, rather, be tolerant to the failures that **will** occur—, to provide the user with something like Quora (or Twitter. Or basically every other system you use today).

As you can guess, it’s simply not possible to check the consistency of the entire system statically. You don’t even own the rest of the system to begin with. So, all of the approaches we have for dynamic systems are, inherently, dynamic—e.g.: distributed tracing is a dynamic analysis technique, as it depends on the system’s execution, not only its definition/configuration.

This doesn’t mean that type systems are not useful. We have some mainstream type systems for data—like Avro, GRPC, etc—which provide a means of coordinating changes and communicating expectations, but we still lack a mainstream type system for things like “how and when should systems communicate with each other?”, “how do I make sure that the privacy policies I’m enforcing locally in my system are enforced **globally** in the entire network of systems?”, and other problems. While we do have some interesting research on this (see things like Session Types for checking protocols, and Distributed Capabilities for checking access policies), they’re pretty much all still in their infancy.

## Conclusion

**TL;DR:** Are statically checked type systems useful for large, complex programs? Locally, yes. Cross-language? kinda, but less so. In distributed systems? ahaha I wish *sobs*.

- - - 

<h4 class="normalcase borderless">Footnotes</h4>

[^1]: [The Abstract is ‘an Enemy’: Alternative Perspectives to Computational Thinking](https://www.ppig.org/papers/2008-ppig-20th-blackwell/), Alan F. Blackwell, Luke Church, Thomas Green (2008, PPIG)

[^2]: [Flash Fill Gives Excel a Smart Charge](https://www.microsoft.com/en-us/research/blog/flash-fill-gives-excel-smart-charge/)