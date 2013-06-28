---
published: false
layout: post
title: Promises/A+ Considered Harmful
snip: The drawbacks of using a Promises/A+ implementation
---

Before I even start talking about the drawbacks of Promises/A+, let me start by saying that the concept of Promises is one of the best things for handling asynchronous computations in JavaScript right now. It's also going to be supported in the next versions of ECMAScript and DOM APIs.

There are, however, some problems with the Promises/A+ specification, which makes it difficult to write efficient code in a mixed environment. The specification is also more complex than it should be. In this blog post I'll visit the design decisions behind the specification and how they can impact your application once you start using them.

*This is where [Domenic](https://twitter.com/domenic) comes in giving me a Roundhouse kick and saying **thou must not use promises for synchronous computations**. :)*


