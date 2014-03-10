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

In Node.js, non-blocking computations are expressed in terms of
Continuation-Passing style, which is the simplest solution for a language
supporting higher-order functions. You can easily invent this model of
computation in these languages yourself if you live by the following maxim:

> **No function should ever return to its caller.**

Now, if a function can't return a value, what are they even good for? Or
rather, how do we use a function that can't return a value? Well, instead of
letting the language semantics define where the control goes after the function
has the value, we explicitly pass the next computation (or *current
continuation*, or *callback*) to the function we're calling. So, this:

```js
function add(a, b) {
  return a + b
}
```

Becomes this:

```js
function add(a, b, continuation) {
  continuation(a + b)
}
```

Or, to make the duality even more obvious, if you pretend that `return` isn't a
keyword:

```js
function add(a, b, return) {
  return(a + b)
}
```

If you consider `return` to be an internal function that knows where to move
the flow of execution in your program, then a *continuation* just makes that
function explicit. But just by doing so it gives us so much more power, because
now we're not bound to the control flow semantics of our language anymore,
which allows a function taking a continuation to be either synchronous or
asynchronous, needing no changes in the user of that code. On the other hand,
we lose the guarantee that in a sequence of actions, each one will always
execute before the previous one, or that calls to such computations will be
thread-safe. In a language with continuations, these concerns are shifted from
the compiler or interpreter, to each computation.

```js
// Since these are functions in CPS style, there's no guarantees about
// which of these operations will be executed first.
add(1, 2, print)
add(3, 4, print)
add(5, 6, print)

// Thus, to sequence actions, you must provide the action to run in
// sequence as a continuation:
add(1, 2, function(result) {
  add(result, 3, print)  // this will always execute after 1 + 2
})
```

With computations following the Continuation-Passing style, it's pretty
straight-forward to write a program that uses non-blocking
computations. However, given that JavaScript's semantics enforce synchronous
execution, CPS does not magically transform a blocking computation into a
non-blocking one. Instead, the computation needs to explicitly execute the
blocking work on a separate thread:

```js
function read(pathname, continuation) {
  // Here we use a primitive that's not present in most JavaScript
  // implementations. It creates a new thread, and executes some
  // code inside of that thread. This allows the main thread to
  // continue doing its business as usual
  Thread.spawn(function() {
    // This is a blocking call, but it occurs in a separate thread
    // so it doesn't block the main thread.
    var contents = io.read(pathname)

    // Once we're done, the continuation is scheduled to be called
    // with the contents of the file in the main thread.
    // Note that we can't just execute it right away in the main
    // thread because it might be busy.
    Thread.main.schedule(function(){ continuation(contents) })
  })
}
```

Lastly, since Continuation-Passing style forgoes the language's own
control-flow semantics to provide the basis for an expressive,
bring-your-own-control-flow framework, we can't combine the usual syntactical
constructs for control-flow, such as if/else or try/catch, with our CPS
computations. New control-flow structures need to be built up on top of this
new framework.

In Node, instead of building a new exception mechanism, they use a much simpler
model, somewhat similar to Shell's error handling, where all continuations take
not just the result of the computation, but also any error that might have
occurred. In this model, the previous computation would be written as:

```js
function read(pathname, continuation) {
  Thread.spawn(function() {
    try {
      var contents = io.read(pathname)
      Thread.main.schedule(function(){ continuation(null, contents) })
    catch (error) {
      Thread.main.schedule(function(){ continuation(error, null) })
    }
  })
}

// And you would use it as:

read('/foo/bar', function(error, contents) {
  if (error)  handleError(error)
  else        handleContents(contents)
})
```


## A lightning introduction to monads
## Futures as placeholders for eventual values
## The composition of futures
## Parallelism and non-determinism
## Syntactical composition with co-monads
## Conclusion
## Libraries
## References and additional reading
