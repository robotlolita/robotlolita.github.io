---
published: false
layout: post
title: Promises/A+ Considered Harmful
snip: The drawbacks of using a Promises/A+ implementation
---

Before I even start talking about the drawbacks of Promises/A+, let me start by saying that the concept of Promises is one of the best things for handling asynchronous computations in JavaScript right now. It's also going to be supported in the next versions of ECMAScript and DOM APIs.

There are, however, some problems with the Promises/A+ specification, which makes it difficult to write efficient code in a mixed environment. The specification is also more complex than it should be. In this blog post I'll visit the design decisions behind the specification and how they can impact your application once you start using them.

*This is where [Domenic](https://twitter.com/domenic) comes in giving me a Roundhouse Kick and saying **thou must not use promises for synchronous computations**. :)*


# What are promises?

So, what **are** promises, anyways? Well, promises are a way to represent future values. In laymen terms, this just means you can use the value before you get it back from whatever call you made. You declare the relationships and dependencies between values and their transformations, then the computer will figure out the best way to fulfill those relationships and dependencies once it's got the value back.

Promises are awesome because they give you back a way to compose values regardless of when they are available, so it doesn't matter if you're going to take 100ms to receive a String back from a REST call, and 20ms to read a file, you can concatenate them together right now, and the computer will figure out how once it gets those values back.

I'm not going to write too much about promises here, since [James Coglan](http://blog.jcoglan.com/2013/03/30/callbacks-are-imperative-promises-are-functional-nodes-biggest-missed-opportunity/), and [Domenic](http://domenic.me/2012/10/14/youre-missing-the-point-of-promises/) did a great job on that already. Instead, I'll focus on the advantages and disadvantages of the Promises/A+ specification here.


# So... Promises/A+?

Promises/A+ is a specification for how promises in JavaScript should behave, so that we can treat asynchronous code in a similar fashion to their synchronous counterpart. Broadly, what this means is that we allow asynchronous functions to return a value, and errors to be handled by the caller.

The specification builds on lots of previous works in the promise landscape in JavaScript, and attempts to unify them, so each one can talk to each other — which is the whole point of standardising something. As such, we can use different Promises/A+ interchangeably, and we can build useful libraries that work on promises generically, rather than implementation A or B. In short, everyone wins.


# Sources of complexity

Sadly, not everything is bright, sweet and cheerful in the Promises/A+ land. There are a couple of problems with it that make Promises/A+ a complex thing, which is what people oposing the use of promises in JavaScript usually mean when they say "promises are complex" — though those are not an inherent fault of promises, per se. In part, these complexities are there to "play along well" with legacy implementations. Not exactly what I would consider a good idea, but Promises/A+ proponents think it was necessary for Promises/A+ to do that.

## Exception handling

The first big problem with Promises/A+ is how it decides to provide asynchronous exception handling: wrapping every asynchronous call in an implicit `try...catch` block. While the caught exceptions are available in the Promise object, such that the caller can decide how to handle it, catching all the exceptions by default is not the best way to do this. In fact, this makes all your programs instantly less robust, because you're catching things you're not sure you can handle, instead of just letting it crash and solve the problem.

Let me walk you through a few examples where this is harmful, and then I'll talk about an alternative for asynchronous error handling in promises.

 1)  Imagine you're 

## Thenable assimilation


# Performance hits

# Conclusion
