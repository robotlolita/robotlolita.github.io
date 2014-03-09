---
layout: post
title:  "A Monad in Practicality: Controlling Time"
snip:   How Monads help you compose asynchronous operations.
---

Use numbered headers: True

<!-- * * * -->

Concurrency is quite a big deal, specially these days where everything must be
“web scale.” There are several models of concurrency, each with their own pros
and cons, in this article I present a composable alternative to the widespread
non-blocking model of concurrency, which generally uses
[Continuation-Passing style](cps), where each computation accepts a
“continuation” or “callback,” instead of returning the result of the
computation to the caller.

However, in a language where some computations return a value to the caller,
and some take a continuation as an argument, we can't really apply our
well-established and general compositional operators, such as
[function composition][], because the rules they rely on have been broken. This
is why, in platforms like Node.js, code quickly descends into callback-hell and
spaghetti of callsite-specific functionality — we lose all of the
organisational patterns we are used to.

None the less, it is possible for a non-blocking function to return the result
to its caller **even thought it still doesn't know what the result is**! This
really old concept (which appeared around 1976) is sometimes called *promise*,
*future*, *delay*, or *eventual*, depending on your library and programming
language.

In this blog post I'll describe what a *future* value is, how it forms a monad,
what are the benefits of a *future* forming a monad, and how they may be used
for abstracting over the concurrency problem in a composable way.

> **Note**: Previous knowledge of monads or category theory are not necessary
> to read this blog post, even though this article builds upon my
> [previous article on monads in JavaScript][failures]. Some knowledge of
> JavaScript is necessary, however.

[cps]: http://matt.might.net/articles/by-example-continuation-passing-style/
[function composition]: http://en.wikipedia.org/wiki/Function_composition
[failures]: http://robotlolita.github.io/2013/12/08/a-monad-in-practicality-first-class-failiures.html



# Table of Contents
 *  TOC
{:toc}

## Introduction

Non-blocking concurrency is all the hype these days, specially with platforms
such as Node.js, which are focused on I/O bound applications, a perfect fit for
this form of concurrency. Unfortunately, most of these platforms don't provide
good primitives for working with this form of concurrency, as is the case with
Node, where people must rely on naïve Continuation-Passing style to schedule
some actions to occur after other actions.

As previously discussed, this naïve use of *callbacks* leads to operations that
can not be composed with the primitives we already use for composing
synchronous computations, such as function composition. More so, in languages
like JavaScript, these asynchronous operations can't be integrated with the
usual syntactic control-flow structures, such as conditional branching, loop
constructions, or exception handling.

Although there are different alternatives for this problem, some of which
includes [delimited continuations][] and
[communicating sequential processes][], *futures* are by far the cheapest
implementation in most languages, since they don't require additional language
support besides threads **or** higher-order functions. A naïve implementation
of futures allows asynchronous computations to be composed just as synchronous
computations can be. However, co-monadic futures are a necessary extension to
integrate these computations with the language's syntactic structure — such a
concept is the basis for [C#'s async/await semantics][async-await].

This article is intended as a general introduction to the concept of Futures,
and how they change the possibilities of composing asynchronous computations
(IOW, how to think with futures), as well as a description of its practical
usage in JavaScript using [my implementation of monadic futures][data.future],
therefore most of the article assumes familiarity with the JavaScript language,
although you should be able to follow with an understanding of higher-order
programming just fine.

[delimited continuations]: http://axisofeval.blogspot.com.br/2011/07/some-nice-paperz.html
[communicating sequential processes]: http://www.usingcsp.com/
[async-await]: http://research.microsoft.com/en-us/um/people/gmb/papers/cs5full.pdf
[data.future]: https://github.com/folktale/data.future


## Non-blocking computations and CPS



## A lightning introduction to monads
## Futures as placeholders for eventual values
## The composition of futures
## Unprincipled parallelism and non-determinism
## Syntactical composition with co-monadic futures
## Conclusion
## Libraries
## References and additional reading
