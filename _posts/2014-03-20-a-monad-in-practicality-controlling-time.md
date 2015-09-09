---
layout: post
title:  "A Monad in Practicality: Controlling Time"
snip:   How Monads help you compose asynchronous operations.
---

> <strong class="heading">Warning</strong>
> This article no longer reflects the Data.Task implementation.
> It's also not *quite* describing a Future (but rather an Action
> monad of sorts). It needs to be updated to make it less confusing
> and more useful.
{: .warning .note}

Concurrency is quite a big deal, specially these days where everything
must be “web scale.” There are several models of concurrency, each with
their own pros and cons, in this article I present a composable
alternative to the widespread non-blocking model of concurrency, which
generally uses [Continuation-Passing style][cps] where each computation
accepts a “continuation” or “callback,” instead of returning the result
of the computation to the caller.

In a language where some computations return a value to the caller and
some take a continuation as an argument, we can't really apply our
well-established and general compositional operators, such as
[function composition][], because the rules they rely on have been
broken. This is why things may quickly descend into callback-hell
and spaghetti of callsite-specific functionality — we lose all of
the organisational patterns we are used to.

None the less, it is possible for a non-blocking function to return the
result to its caller **even though it still doesn't know what the
result is**! This really old concept (which appeared around 1976) is
sometimes called *promise*, *future*, *delay*, or *eventual*, depending
on your library and programming language.

In this blog post I'll describe what a Future value is, how it forms a
monad, what are the benefits of a Future forming a monad, and how they
may be used for abstracting over the concurrency problem in a composable
way.


> <strong class="heading">Note</strong>
> Previous knowledge of monads or category theory are not
> necessary to read this blog post. Some knowledge of JavaScript is
> necessary, however.
{: .note}

[cps]: http://matt.might.net/articles/by-example-continuation-passing-style/
[function composition]: http://en.wikipedia.org/wiki/Function_composition


# Table of Contents
 *  TOC
{:toc}


## 1. Introduction

Non-blocking concurrency is all the hype these days. Platforms focused
on I/O bound applications such as Node.js are a perfect fit for this
form of concurrency. Unfortunately, most of these platforms don't
provide good primitives for working with concurrency efficiently, as is
the case with Node, and people must rely on naïve low-level primitives,
such as Continuation-Passing style, to control the and optimise the
execution of each action.

This naïve use of *callbacks* leads to operations that can not be
composed with the primitives we already use for synchronous
computations, such as function composition. More so, in languages like
JavaScript, these asynchronous operations can't be integrated with the
usual syntactic control-flow structures, such as conditional branching,
loop constructions, or exception handling.

Although there are different alternatives for this problem, some of
which includes [delimited continuations][] and
[communicating sequential processes][], Futures are by far the cheapest
implementation in most languages, since they don't require additional
language support besides threads **or** higher-order functions. The
simple implementation of Futures allows asynchronous computations to be
composed just as synchronous computations can be. However, co-monadic
Futures are a necessary extension to integrate these computations with
the language's syntactic structure — this concept is the basis for
[C#'s async/await semantics][async-await].

This article is intended as a general introduction to the concept of
Futures, and how they change the possibilities of composing asynchronous
computations (IOW, how to think with Futures), as well as a description
of its practical usage in JavaScript using
[my implementation of monadic Futures][data.future], therefore most of
the article assumes familiarity with the JavaScript language, although
you should be able to follow with an understanding of higher-order
programming just fine.

[delimited continuations]: http://axisofeval.blogspot.com.br/2011/07/some-nice-paperz.html
[communicating sequential processes]: http://www.usingcsp.com/
[async-await]: http://research.microsoft.com/en-us/um/people/gmb/papers/cs5full.pdf
[data.future]: https://github.com/folktale/data.future

## 2. The conception of Futures

### 2.1. Non-blocking computations and CPS

JavaScript is a strict language, with sequential evaluation
semantics. That is, if you have a source code in the form of:

{% highlight js linenos=table %}
doX()
doY()
doZ()
{% endhighlight %}

Then each action can only start running after the previous actions have
fully finished running. This form of computation is simple, but
inefficient with all the current multi-core processors. The ideal
scenario would be to run `doX`, `doY` and `doZ` in parallel, since no
operation depends on the results of the previous operation.

![Efficiency achieved with parallelism](http://robotlolita.github.io/files/2014/03/futures-01.png)

The sequential scenario is definitely not good. We want something closer
to the parallel scenario. That's where non-blocking computations
(asynchronous concurrency) come in. They provide a simple-enough model
for computation, and are really efficient dealing with I/O bound
applications, since the mechanisms for running actions at the same time
are cheaper.

![Efficiency achieved with asynchronous](http://robotlolita.github.io/files/2014/03/futures-02.png)

Node.js is one of the most prominent platforms where this form of
concurrency is not only well-spread, but a premise of the platform
itself! For handling these kinds of computations, Node.js encourages the
use of Continuation-Passing style, which is the simplest solution that
could possibly work for a language supporting higher-order functions. In
fact, you can easily invent CPS yourself if you live by the following
maxim: 

> No function should ever return to its caller.
{: .highlight-paragraph}

Now, if a function can't return a value, what are they even good for? Or
rather, how do we use a function that can't return a value? Well,
instead of letting the language semantics define where the control goes
after the function has the value, we explicitly pass the next
computation (or *current continuation*, or *callback*) to the function
we're calling. So, this:

{% highlight js linenos=table %}
//:: (a, a) -> a
function add(a, b) {
  return a + b
}
{% endhighlight %}

Becomes this:

{% highlight js linenos=table %}
//:: (a, a, (a -> Void)) -> Void
function add(a, b, continuation) {
  continuation(a + b)
}
{% endhighlight %}

To make the relationship between the two even more obvious, you can
pretend that `return` isn't a magical keyword:

{% highlight js linenos=table %}
//:: (a, a, (a -> Void)) -> Void
function add(a, b, return) {
  return(a + b)
}
{% endhighlight %}

If you consider `return` to be an internal function that knows where to
move the flow of execution in your program, then a *continuation* just
makes that function explicit. By doing so it gives us much more power,
because now we're not bound to the control flow semantics of our
language anymore and this allows a function taking a continuation to be
either synchronous or asynchronous, needing no changes in the user of
that code. On the other hand, we lose the guarantee that in a sequence
of actions, each one will always execute before the previous one, or
that calls to such computations will be thread-safe. When using
continuations, these concerns are shifted from the compiler or
interpreter, to each computation and the programmer must be always aware
of them.

{% highlight js linenos=table %}
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
{% endhighlight %}

With computations following the Continuation-Passing style, it's pretty
straight-forward to write a program that uses non-blocking
computations. However, given that JavaScript's semantics enforce
synchronous execution, CPS does not magically transform a blocking
computation into a non-blocking one. Instead, one needs to explicitly
execute the blocking computation on a separate thread:

{% highlight js linenos=table %}
//:: (String, (String -> Void)) -> Void
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
{% endhighlight %}

Lastly, since Continuation-Passing style forgoes the language's own
control-flow semantics to provide the basis for an expressive,
bring-your-own-control-flow framework, we can't combine the usual
syntactical constructs for control-flow, such as if/else or try/catch,
with our CPS computations. New control-flow structures need to be built
up on top of this new framework.

In Node, instead of building a new exception mechanism, they use a much
simpler model, somewhat similar to Shell's error handling, where all
continuations take not just the result of the computation, but also any
error that might have occurred. In this model, the previous computation
would be written as:

{% highlight js linenos=table %}
//:: (String, (Error?, String -> Void)) -> Void
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
{% endhighlight %}


### 2.2. Futures as placeholders for eventual values

While Continuation-Passing style is definitely an interesting start for
building your own control-flow structures, it's too low level for us to
work with directly in JavaScript, specially since the primitives are not
written in terms of continuations. As such, we would prefer a more
abstract way of dealing with non-blocking computations, such that we're
able to compose them with our regular synchronous computations using the
primitives we've already got!

For this to work, our asynchronous functions need to be able to return a
value, but we don't want them to block until they've figured out what
the value should be, and they can't return the value before they've
figured out what it should be! ...or can't they? Well, enter the concept
of Futures. A Future represents the eventual result of an asynchronous
computation, such that a it may return a useful value to the caller and
fill in the details later.

In other words, instead of writing this:

{% highlight js linenos=table %}
//:: (String -> (Error?, String -> Void)) -> Void
function read(pathname, continuation) {
  ...
}

read('/foo/bar', function(error, contents) { ... })
{% endhighlight %}

We can write this:

{% highlight js linenos=table %}
//:: String -> (Error?, String -> Void)
function read(pathname) {
  ...
}

var contentsF = read('/foo/bar')
{% endhighlight %}

So far, just by using Futures we've managed to drop the explicit passing
of continuations, and our code is already looking like it used
to. Functions return values. We can assign those values to
variables. BAM. Everything is right, uh?  But what happens when we try
to use those values? Well, it depends on how you implement them. In
the classical formulations, reading from a Future will usually block
the current thread until some other thread fills in the value.

While composable, a naïve implementation of blocking Futures poses the
same problems as regular blocking computations. Furthermore, this
doesn't work in a single-threaded environment. If we combine our
concrete representation of Future values with the Continuation-Passing
style, we get part of the compositionality benefits, without having to
deal with the blocking problem. Plus, it works great in a
single-threaded environment.

One of the simplest implementations of Future would be to just return a
function whose only parameter is a continuation:

{% highlight js linenos=table %}
//:: String -> (Error?, String -> Void)
function read(pathname) {
  return function(continuation) {
    ...
  }
}

var contentsF = read('/foo/bar')
contentsF(function(error, contents) {
  if (error)  handleError(error)
  else        handleContents(contents)
})
{% endhighlight %}


## 3. Why monadic Futures matter

### 3.1. A monadic formulation of Futures

Albeit the previous example of implementation was simple and usable, in
JavaScript we can benefit much more from a slightly different
implementation: one where our Future forms a [monad][]. To this end,
we'll need to create an object that fulfils the interface described in
the [fantasy land][] specification. And why would we do that? Well, by
doing this simple thing we get a lot of abstractions for free! (and we
get nice properties for reasoning about our programs too).

> If you're not familiar with the concepts of Category Theory, or have
> never heard the term *monad* before, don't worry, *monads are just
> monoids in a category of endofunctors,* or rather, *a monad is a
> functor together with two natural transformations*. You could even
> say that *a FuzzyWuzzy is just a Vogon in the centre of Megabrantis
> Cluster!*
>
> In other words, it doesn't matter to you, the programmer, what a
> *monad* is. In fact, for the rest of this article you can replace any
> occurrence of *monad* by whichever word you like the most. If you're
> interested in knowing all about monads, go read
> [Phil Wadler's "Monads For Functional Programming"][monad] paper.

Moving on, to make our Future a monad, we need to implement two methods:

 -  `of(a) → Future(a)`: creates a Future holding anything (including other
    monads).
    
 -  `chain(a → Future(b)) → Future(b)`: transforms the value inside a monad
    into another monad of the same type.

Furthermore, to ensure that we can compose cleanly all of the different
things that implement this interface, there are some rules that everyone
needs to play by. With this we can compose all the different types of
monads in complex ways, and be sure that we can understand and have
guarantees about what will happen. The rules are as follows, where `m`
is an instance of the Future:

 -  Associativity: `m.chain(f).chain(g)` should be equivalent to `m.chain(x => f(x).chain(g))`;
 -  Left identity: `m.of(a).chain(f)` should be equivalent to `f(a)`;
 -  Right identity: `m.chain(m.of)` should be equivalent to `m`.

And that's all it takes for something to be fulfil the monad
interface. The only difference to an interface in a language like Java
is that besides the type constraints we also have these *laws* that
dictate how this object needs to behave in certain circumstances. I'll
leave the implementation of such object as an exercise to the reader,
and use my [data.future][] implementation for the rest of this article.

[monad]: http://homepages.inf.ed.ac.uk/wadler/papers/marktoberdorf/baastad.pdf
[fantasy land]: https://github.com/fantasyland/fantasy-land


### 3.2. The composition of Futures

With monadic Futures, our now widely-used example becomes:

{% highlight js linenos=table %}
//:: String -> Future<Error, String>
function read(pathname) {
  return new Future(function(reject, resolve) {
    ...
  })
}

var contentsF = read('/foo/bar')
contentsF.chain(handleContents).orElse(handleError)
{% endhighlight %}

> <strong class="heading">Note</strong>
> the referred Future implementation is pure, as such `chain`
> does not run the computation, but returns a description of the
> computation that should be performed. To run the computation you must
> invoke the `fork(errorHandler, successHandler)` method. Check out
> [Runar's talk on Purely Functional I/O][pure-io] to understand why
> this matters.
{: .note}

Again, like Continuation-Passing style computations, the value of
`contentsF` is not dependent on the order in which our source code is
arranged. This disentangles computations and time, which are so usually
coupled in an imperative language. Therefore, it doesn't matter which
order you arrange your source code, the results must be the same:

{% highlight js linenos=table %}
var a = read('/foo')
var b = read('/bar')

// is the same as
var b = read('/bar')
var a = read('/foo')
{% endhighlight %}

Of course, the example above would also yield the same value in a pure
imperative program. But this formulation of Futures force you not to
rely on the implicit ordering of your source code, because there's no
way to know when each value will be available. So, the following program
is automatically excluded, taking down with it a whole class of
complexities:

{% highlight js linenos=table %}
var a = read('/foo')
var b = a + read('/bar')  // can't access `a` yet.
{% endhighlight %}

If one needs to access the value of a Future, they need to do so
explicitly by invoking the `chain` method and providing a computation to
run once the value is made available. In essence, Futures force you to
give up on the implicit dependency on time (and source order), and buy
into explicit dependency on actual values.

Furthermore, the existence of different methods for sequencing
successful and erroneous values, together with the monad semantics,
allow us to short-circuit computations that we can't perform, and
automatically propagate the errors back up to the caller, similar to
what a `try/catch` construct would do for synchronous code. In fact, one
of the advantages of monads over plain functions/continuations is the
ability to ignore some of the painful explicitness of functional
programming sometimes.


{% highlight js linenos=table %}
//:: (Number, Number) -> Future<Error, Number>
function divide(a, b) {
  return new Future(function(reject, resolve) {
                      if (b === 0)  reject(new Error('Division by 0'))
                      else          resolve(a / b) })
}

//:: A -> Future<A, B>
function reject(a) {
  return new Future(function(reject, resolve) {
                      reject(a) })
}

//:: B -> Future<A, B>
function resolve(a) {
  return new Future(function(reject, resolve) {
                      resolve(a) })
}

var aF = divide(9, 3)
// => Future(_, 3)
var bF = divide(2, 1)
// => Future(_, 2)
var cF = aF.chain(function(a) {
                    return bF.chain(function(b) {
                                      return resolve(aF + bF) })})
// => Future(_, 5)
var dF = aF.chain(function(a) {
                    return divide(a, 0).chain(function(b) {
                                                return resolve(a + b) })})
// => Future(Error('Division by 0'), _)
var eF = dF.orElse(function(error) {
                     return reject(new Error('boo')) })
// => Future(Error('boo'), _)
{% endhighlight %}

> <strong class="heading">Note</strong>
> both `chain` and `orElse` are used to sequence asynchronous
> computations, as such they are not the best fit for running
> synchronous computations in the value the Future holds. Using `map`
> and `rejectedMap`, you could make these cases much simpler. E.g.:
>
>     dF.rejectedMap(function(e){ return new Error('boo') })
{: .note}

[pure-io]: http://www.infoq.com/presentations/io-functional-side-effects


### 3.3. Freeloading on monadic abstractions

Good, we can compose computations, but working with anything has become
incredibly bothersome. Some of this is due to JavaScript's verbosity in
function declarations, some is due to limitations in abstraction
power. Either way, we can lessen the burden by taking advantage of the
monadic abstraction and functional combinators.

For example, suppose that we need to concatenate two files we've read
from the disk, but the contents of those files are inside a Future. The
usual way to go about it would be to nest the `chain` calls in different
closures in order to capture the intermediate values:

{% highlight js linenos=table %}
var aF = read('/foo')
var bF = read('/bar')
var cF = aF.chain(function(a) {
                    return bF.chain(function(b) {
                                      return resolve(a + b) })})
{% endhighlight %}

But since this is a common pattern, we could easily write a combinator
that abstracts over this. Let's call it `chain2`, since it chains two
different Futures:

{% highlight js linenos=table %}
function chain2(aM, bM, f) {
  return aM.chain(function(a) {
                    return bM.chain(function(b) {
                                      return new Future(function(_, resolve) {
                                                          resolve(f(a, b)) })})})
}

var aF = read('/foo')
var bF = read('/bar')
chain2(aF, bF, function(a, b){ return a + b })
{% endhighlight %}

Easy and neat, huh? In fact, this pattern is **so** common that people
have already written this combinator for us, and by having our Future
form a monad we can use it **for free**! The combinator is called
`liftM<number>`, and as you can guess, it takes some monads and a
regular function, and makes this function work on the values of those
monads.

By currying this `liftM` combinator, and using the `flip` combinator, we
can easily use function composition for working with monads:

{% highlight js linenos=table %}
// Promotes an unary function to a function on monads
//:: Monad<A> -> (A -> B) -> Monad<B>
var liftM = curry(function(aM, f) {
                    return aM.chain(function(a) {
                                      return aM.of(f(a)) })})

// Promotes a binary function to a function on monads
//:: Monad<A> -> Monad<B> -> (A, B -> C) -> Monad<C>
var liftM2 = curry(function(aM, bM, f) {
                     return aM.chain(function(a) {
                                       return bM.chain(function(b) {
                                                         return bM.of(f(a, b)) })})})

// Inverts the argument order for a binary function
//:: (A, B -> C) -> (B, A -> C)
var flip = curry(function(f, a, b) {
                   return f(b, a) })

// Now we can use `liftM`, partial application and the `flip` combinator to
// easily promote any regular function into functions on monads:
//:: String -> String
function toUpper(a) {
  return a.toUpperCase()
}

//:: Monad<String> -> Monad<String>
var toUpperM = flip(liftM)(toUpper)
toUpperM(Future.of('foo')) // => 'FOO'

//:: String -> Monad<String>
var readAsUpperM = compose(toUpperM, read)
readAsUpper('/foo/bar')
{% endhighlight %}

Great! Now we can even use function composition with any function that
works on monadic Futures. However, defining these `liftMN` combinators
is such a pain that I can't imagine ever defining `liftM3`, let alone
`liftM10`. But see, there's a common pattern in these operations. And
where there's a pattern, there's room for abstractions. So, what if we
had a function that takes a list of monads, and returns a monad
containing the list of values inside those monads. With this, we could
use a single `chain` call to get to all of the values at once!

{% highlight js linenos=table %}
//:: [Future<A, B>] -> Future<A, [B]>
function all(futures) {
  return futures.reduce(function(resultM, xM) {
                          xM.chain(function(x) {
                            resultM.chain(function(result) {
                              result.push(x)
                              return Future.of(result) })})}
                       , Future.of([]))
}

// Now we can use this to resolve all Futures at once!
var aM = read('/foo')
var bM = read('/bar')
var cM = read('/baz')
var dM = read('/qux')

var concatenatedM = liftM( all([aM, bM, cM, dM])
                         , function(xs) {
                             return xs.join('\n') })
{% endhighlight %}

In fact, this pattern is **so** common that people have already written
this combinator for us, and by having our Future form a monad we can use
it **for free**! Hmm... didn't I say this as well a couple of paragraphs
up above? Well, you can probably see now why having things form a monad
is so interesting. You get a lot of free lunch! Anyway, the combinator
this time is called `sequence`, it takes in a list of monads, and
returns a monad of a list of their values.

{% highlight js linenos=table %}
// Evaluates each action in sequence (left to right), and
// collects the results.
//
//:: M:Monad => (M, [M<A>]) -> M<[A]>
function sequence(m, ms) {
  return ms.reduce(function(resultM, xM) {
                     xM.chain(function(x) {
                                resultM.chain(function(result) {
                                                result.push(x)
                                                return m.of(result) })})}
                       , m.of([]))
}

var concatenatedM = liftM( sequence(Future, [aM, bM, cM, dM])
                         , function(xs) {
                             return xs.join('\n') })
{% endhighlight %}

There are a whole lot of combinators that you can use directly with your
monadic Futures (and any other data structure that forms a monad), to
have an rough idea of what's possible you can take a look at
[Haskell's Control.Monad][control.monad] package, which has basic
monadic combinators.

[control.monad]: http://hackage.haskell.org/package/base-4.6.0.1/docs/Control-Monad.html


## 4. Specifics of Future-based concurrency

### 4.1. Ad-hoc parallelism

So far we've seen that Futures can provide a way for us to compose
computations with the combinators we're used to, such as function
composition, and that we can deal with them in a higher-level way
through a series of abstractions — many of which are common to all
monads and we can just use them for free. Even dealing with different
operations becomes easy with the `sequence` combinator... but there lies
a big problem.

As I mentioned before, monadic semantics are inherently sequential, and by
looking at the implementation for `sequence` you can see why this is a
big problem when we want to make the most out of concurrency: each
action can be only performed once the previous action has finished
executing. In other words, we've got a weird way of writing the
following blocking program:

{% highlight js linenos=table %}
var a = read('/foo')
var b = read('/bar')
var c = read('/baz')
var d = read('/qux')

var concatenated = [a, b, c, d].join('\n')
{% endhighlight %}

Granted we can still get the concurrency benefits from actions that are
not related in any way, but sometimes this is not enough. We also want
to make the most out of actions that aren't related, but all of which
converge into another action. Therefore, we need to be able to resolve
Futures in parallel. Unfortunately, we can't do this with monads, which
means that the `chain` method is entirely ruled out.

There are other formalisms (e.g.: a Future that also forms an
Applicative) for which we can easily derive these parallel resolutions,
and get other benefits from improved reasoning and generic
abstraction. But it's such a long topic that I'll cover them in a follow
up post. For now, we'll see how we can “cheat” the monadic Future in
order to get parallel resolution (albeit in an ad-hoc manner) without
giving up on all the benefits we've got.

The idea is that we start all of the monadic computations at the same
time, each in its own computational context (e.g.: a thread), and merge
the results back in the main thread, fulfilling the Future with the
result.

{% highlight js linenos=table %}
//:: [Future<A, B>] -> Future<A, [B]>
function parallel(futures) {
  return new Future(function(reject, resolve) {
                      var pending  = futures.length
                      var result   = new Array(pending)
                      var resolved = false

                      futures.forEach(compute)


                      function compute(future, i) {
                        future.fork( function(error) {
                                       if (resolved)  return
                                       resolved = true
                                       reject(error) }
                                       
                                   , function(value) {
                                       if (resolved)  return
                                       result[i] = value
                                       if (--pending === 0) {
                                         resolved = true
                                         resolve(result) }})}})
}
{% endhighlight %}

With this, you can use `sequence` and `parallel` interchangeably,
depending on whether you want something to be resolved in parallel or
sequentially.


### 4.2. Ad-hoc non-determinism

Being able to choose whether we want to perform many actions
sequentially or in parallel, using the very same code, provides a pretty
good basis for writing concurrent programs easily. But we can do better
by introducing a little of non-determinism.

“Isn't non-determinism bad in a concurrent program?” you ask. Well, it
is something you usually want to avoid, indeed, but can be fairly useful
in certain contexts.

Consider the following scenario: you want to load an image out of an
external server, but if the server takes too long to respond you don't
want to bother and just go on with your business. Essentially, this
would be encoding a *timeout* condition, such that possible failures in
external systems can be accounted for and dealt with appropriately. But
how would one go about solving this in a simple way?

Once again monads won't help us since they're inherently sequential, so
we'll need to *cheat*. Again. One of the ways we could go about solving
this is to write a `timeout` function that takes the amount of time to
wait before considering the action dead, and the action (Future)
itself. And it's relatively easy to come up with this:

{% highlight js linenos=table %}
//:: (Number, Future<A, B>) -> Future<A, B>
function timeout(time, future) {
  return new Future(function(reject, resolve) {
                      var resolved = false

                      future.fork( function(error) {
                                     if (resolved)  return
                                     resolved = true
                                     reject(error) }
                                 , function(value) {
                                     if (resolved) return
                                     resolved = true
                                     resolve(value) })

                      setTimeout(function() {
                                   if (resolved)  return
                                   resolved = true
                                   reject(new Error('Timeouted.')) })})
}
{% endhighlight %}

Not entirely bad, although some of those computations could definitely
be abstracted over, but let's just keep this rough idea of
implementation in mind for now. There's a problem with it, and although
you might not have realised yet, you probably will once we take a look
at the second scenario:

Imagine that now we're tasked with loading an image, but instead of just
one external server, we can load this image from three different
servers. Of course, since all of these servers are still prone to
unpredictable failures, we also need to account for the case where none
of them respond in a timely fashion.

We could just write a new fairly specific operation just for this
occasion, but this is not the best way to go about this. If we stop to
think about the problem a little, we'll see that this scenario is the
same thing as the previous scenario, we just have more choices! Since
they are the same, we should be able to write a generic operation for
it. In fact, this operation already exists in some formal systems, such
as [communicating sequential processes][], and may be called
`alternative` or `select`. The implementation is very close to what we
have in `timeout`... but simpler!

{% highlight js linenos=table %}
//:: [Future<A, B>] -> Future<A, B>
function nondeterministicChoice(futures) {
  return new Future(function(reject, resolve) {
                      var resolved = false
                      futures.forEach(function(f) {
                                        f.fork( function(error) {
                                                  transition(reject, error) }
                                              , function(value) {
                                                  transition(resolve, value) })})

                      function transition(f, a) {
                        if (resolved)  return
                        resolved = true
                        f(a) }})
}
{% endhighlight %}

Now we're able to start all actions in parallel and get a hold of the
first one that completes (either by succeeding or failing). But how does
this help us with the `timeout` issue? Well, if you think about it,
`timeout` itself is just an "action," one that automatically fails after
a given amount of time. Thus, we can go really high-level with our new
operation (but there's a catch, and we'll talk about it later):

{% highlight js linenos=table %}
//:: Number -> Future<Error, B>
function timeout(ms) {
  return new Future(function(reject, resolve) {
                      setTimeout( function() {
                                    reject(new Error('Timeouted.')) }
                                , ms)})
}

var imageF = nondeterministicChoice([load(server1), load(server2), load(server3)])
nondeterministicChoice([imageF, timeout(10e3)])
  .chain(function(image) { ... })
  .orElse(function(error){ ... })
{% endhighlight %}

Notice that once again we can easily switch out this operation by either
`parallel` or `sequence`, without changing much of the rest of the
code. In this case things require a little more of work since the type
of the operation is different, but this does not affect unrelated code,
which tends to be a problem when working with lower-level primitives for
concurrency directly, like continuations or threads.


### 4.3. A note on purity, effects, and memoisation

So, I did say that there's a catch to the way we modelled `timeout`
above. We can never memoise it. That is, since `timeout` is an action
(it represents an effect), everytime we run it, that effect must
occur. Consider the following:

{% highlight js linenos=table %}
//:: String -> Future<Error, Void>
function print(text) {
  return new Future(function(reject, resolve) {
                      console.log(text)
                      resolve() }
}

//:: a -> a
function id(a){ return a }

//:: Future<A, B> -> Unit
function run(future) {
  future.fork(id, id)
}

var hello = print('Hello, world')
run(hello)
// => 'Hello, world'
run(hello)
// => 'Hello, world'
{% endhighlight %}

If the Future was memoised, we would not get the second `"Hello, world"`
because the Future would have already been resolved once! And this would
break entirely any attempt of reasoning about our code. This is
something systems like [Promises/A+][promises-aplus] completely miss, mostly because
those systems are not interested in purity and compositionality.

[promises-aplus]: http://promises-aplus.github.io/promises-spec/


## 5. Conclusion

So, we've seen that Futures are a simple concept that can be used for
representing values we don't know yet, but will in the future. Just by
doing this, we're able to get some of the lost compositionality of
working with non-blocking computations, that happens with things like
Continuation-Passing style.

We've also seen that a Future can form a monad, and by doing so we have
access to a number of abstractions for free. But monad semantics are
inherently sequential, so we can't use monads as a basis for
parallelism. Fortunately, we can "cheat" the system and provide specific
operators for this that can easily replace the sequential resolution of
monads (and vice-versa) when desirable.

All in all, while this formulation already provides a lot of power for
writing concurrent programs in an simple and composable way, this
implementation still doesn't allow for them to compose with the
syntactical constructs. Ideally, we would like to write the following,
and let the library implementation take care of all the nasty details of
concurrency for us:

{% highlight js linenos=table %}
var contents = read('/foo/bar')
if (contents.get().length != 0) { ... }
{% endhighlight %}

The good news is: **this is entirely possible**. The not so good news is
that it's also a big topic and I haven't had the time to cover it in
this blog post. To keep things focused (and publish moar), I've decided
to split this article into three parts. This is the introduction of the
concepts of Futures and how they form a monad. The next part explains
the duality of Futures, and how co-monadic Futures give us the
aforementioned syntactical composition. The last part goes on the
generalised ways of achieving parallelism and concurrency with
Applicative Functors.

So, that's about it. I hope y'all are looking forward to the next
articles in this series, eh! ♥


## 6. Libraries

<dl>
  <dt><a href="https://github.com/folktale/data.future">Data.Future</a></dt>
  <dd>My implementation of pure monadic futures</dd>

  <dt><a href="https://github.com/folktale/control.monads">Control.Monads</a></dt>
  <dd>A (still experimental) port of Haskell's Control.Monad package, which
  provides common combinators and operations to work with monads in a higher
  level.</dd>

  <dt><a href="https://github.com/quarterto/fantasy-arrayt">Fantasy
  ArrayT</a></dt>
  <dd>A monad transformer for monads containing JavaScript arrays.</dd>
  
  <dt><a href="https://github.com/fantasyland/fantasy-combinators">Fantasy
  Combinators</a></dt>
  <dd>A library providing common functional combinators — like compose,
  constant, flip, etc.</dd>

  <dt><a href="https://github.com/folktale/control.async">Control.Async</a></dt>
  <dd>An experimental library providing abstractions for asynchronous
  operations on Futures. It's heavily influenced by Clojure's core.async</dd>
</dl>


## 7. References and additional reading

<dl>
  <dt><a href="http://www.amazon.com/Toposes-Theories-Grundlehren-mathematischen-Wissenschaften/dp/1489900233">Toposes,
  Triples and Theories, by M. Barr and C. Wells</a></dt>
  <dd>You don't need to have a PhD in Category Theory to understand Monads,
  Functors and friends, but having an understanding of the basics in Category
  Theory really helps. M. Barr and C. Wells's book provides a fairly detailed
  description of the subject, and it's freely available online, although I have
  not finished reading the whole book yet.</dd>
  
  <dt><a href="http://www.haskell.org/haskellwiki/Category_theory">Haskell
  Wiki on Category Theory</a></dt>
  <dd>The Haskell Wiki page on Category Theory lists several resources that may
  help you to understand the concepts and foundations. Some of them are written
  with Haskell programmers in mind, some are purely mathematical and don't
  assume any previous knowledge in either Haskell or Category Theory.</dd>

  <dt><a href="https://github.com/fantasyland/fantasy-land">Fantasy Land
  Specification</a></dt>
  <dd>The Fantasy Land specification that all monads in JavaScript should
  follow to allow interoperability and abstractions to be written and shared by
  everyone, for maximum DRY.</dd>

  <dt><a href="http://matt.might.net/articles/by-example-continuation-passing-style/">Matt
  Might's Continuation-Passing style by example</a></dt>
  <dd>Matt explains what continuations are using both Scheme and
  JavaScript.</dd>

  <dt><a href="http://www.infoq.com/presentations/clojure-core-async">Clojure
  core.async talk by Rich Hickey</a></dt>
  <dd>Rich Hickey discusses what motivated the design of
  Clojure's <tt>core.async</tt> library, and how they provide a simple
  framework for concurrency without giving up on compositionality. In
  essence, <tt>core.async</tt> achieves the same as Futures, but is supported
  by more mathematical formalism, and supports parallelism at the core.</dd>

  <dt><a href="http://research.microsoft.com/en-us/um/people/gmb/papers/cs5full.pdf">Pause
  'n' play: Formalizing asynchronous C♯</a></dt>
  <dd>Erik Meijer, Mads Torgersen, et al formally describe
  C♯'s <strong>async/await</strong> functionality, which is based on the
  co-monadic <tt>Task&lt;T&gt;</tt> type.</dd>

  <dt><a href="http://homepages.inf.ed.ac.uk/wadler/papers/marktoberdorf/baastad.pdf">Phil
  Wadler's Monads For Functional Programming Paper</a></dt>
  <dd>Wadler describes why monads are interesting for functional programming,
  by showing how they simplify the (sometimes painful) explicitness of pure
  computations.</dd>

  <dt><a href="http://promises-aplus.github.io/promises-spec/">Promises/A+
  specification</a></dt>
  <dd>Promises/A+ is a specification for promises in JavaScript. ECMAScript 6
  implements promises in a manner similar to that of the spec. There are
  several problems with Promises/A+ from the point of view of simplicity, and
  compositionality, some of which are addressed in
  the <a href="http://robotlolita.github.io/2013/06/28/promises-considered-harmful.html">Promises/A+
  considered harmful</a> article.</dd>
</dl>

  
## 8. Changes and Acknowledgements

 -  **24/03/2014**, fixed an incorrect example of `liftM`, as JuanManuel pointed out in the comments.

 -  Thanks to [Rúnar Óli](https://twitter.com/runarorama) and
    [Brian McKenna](https://twitter.com/puffnfresh) for correcting some
    mistakes in Category Theory over at Twitter.


It might not look like that, but Quil is actually a burrito in the cat(egory) of cat-ladies. Or something like that. You can contact her on [Twitter](https:/twitter.com/robotlolita) or [Email](mailto:queen@robotlolita.me).
{: .contact-footer}
