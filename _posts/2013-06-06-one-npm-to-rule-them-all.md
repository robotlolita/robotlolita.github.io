---
layout:    post
title:     One NPM to Rule Them All
snip:      Modules need a package manager, so just meet NPM and stop worrying.
published: false
---

Years ago I wrote a little post on modules, frameworks and micro-frameworks, and oh boy did the landscape change! Today, if you're not using NPM and CommonJS when writing any JavaScript code, you're most likely doing it wrong. It doesn't matter if you're writing for the Browser, Node or a small Arduino sitting idle on your table, and in this post I'll show you why.

TL;DR:

- **Modularise**: write small modules that do only one thing, and compose them together to do more complex stuff.
- **Use a package manager**: use NPM to manage your dependencies and stop worrying about them.
- **Use CommonJS**: it's a simple and expressive module system. And it gives you first-class modules!


## Introduction

If you have ever read my blog, you'd know I'm a strong advocate of both the *Unix philosophy* and *functional programming*. They encourage you to write small, self-contained pieces of functionality and compose them together to build bigger things. Unfortunately, lots of people writing JavaScript are still dwelling in the dark ages when it comes down to modularising their applications. You see, there are still plenty of people that think that "The Module Pattern" is a good enough idea; it is not, however, it's just boilerplate that indicates the lack of proper tooling — and if you ever find yourself having boilerplate, you should be worrying about your tools not solving your problem, because *that's the first symptom of I Ain't Not Solving Ya Problem, Son*.

There have been plenty of module solutions over the time in JavaScript, the most expressive and simple of them is still the [CommonJS][] standard, which is used in a slightly different form in Node. CommonJS gives you a nice syntax, and more important, **first-class modules**. You might ask why first-class modules are important, and I could answer you with "for the same reason first-class functions" are, but instead I will just leave you with a [most awesome keynote that explains that][modules talk], and assume you know the answer from now on.

[CommonJS]: http://wiki.commonjs.org/wiki/Modules/1.1
[modules talk]: http://2013.flatmap.no/spiewak.html

The rest of this article is laid out as follows: in the first section I give a conceptual overview of namespacing and modules, in the second section there's an overview of all module solutions available for JavaScript, and a quick analysis the pros-and-cons of each one. In the subsequent sections I present CommonJS in more depth, then introduce the concepts of parametric modules. Then there's a whole section on package management and NPM. In the last section I itroduce Browserify as a tool for using CommonJS modules in non-Node.js environments. Finally, I give a kick-ass conclusion on all of this mess and point you to additional reading material and tools.

## Namespacing and Modules

Both namespaces and modules are important when developing any kind of application, but they also solve entirely different problems. Some people tend to think that namespaces give you modularity: they don't, they only solve name collision problems.

### What's a namespace?

A namespace is something that holds a mapping from a particular name to a particular meaning. Some languages have different namespaces for different kinds of things (for example, the namespace used for functions is not the same as the one used for types, or variables, so a variable A is still different from a function A), some other languages (like JavaScript) just roll out with a single namespace for everything.

Namespaces exist because we can only give things so much names before we run out of alternatives, and then starting writing **SquareRoot2345**, as if you were trying to find an available username on Twitter is not the best thing.


### What's a module?

A module provides a set of logically related functionality in a particular interface. So, for example, one could say that an object X is a module. Some languages, like Java or Clojure, don't give you modules, and instead just give you namespaces — Clojure's namespaces are first-class and expressive, though, unlike Java's.

For modularity, we want more. Basically, there are three things we look for in a good module implementation:

- It must allow one to provide a set of functionality that fulfills a given interface. A Queue could be an interface, as much as List or DOM.
- It must be first-class, so you can hold and abstract over a module.
- It must allow delayed dependency binding, so you can mix and match different implementations of the same module easily.


## Module solutions for JS

It's actually interesting to see how many things the lack of module support backed right into the language has spawned. This is, in fact, one of the things that keep amazing me in Node.js: give people a really small core, but a rather expressive one, and they'll come up with their own creative solutions to solve problems X and Y, and these solutions will then compete to see which one solves the problem best.

Languages and platforms that are heavily batteries-included usually strive for "There Should Be Only One Way of Doing X", and with that way of thinking those solutions might lose relevance with time, or they might simply not solve the stated problem in the best way it could (for example, Python's module system is shitty as fuck).

The module landscape in JavaScript consists of a few well-known players (AMD, CommonJS), and attempts to port less-expressive package/namespacing conventions to the language (Gjs), to the most-naïve-solution-that-could-possibly-work (Module pattern).

### The no-module way

### The "Hey let's give JS namespaces" crowd

Oh, the naïvety is strong in this one. Somehow, there are people out there that still believe that namespacing solves the same problems as modules do. But they're entirely different and orthogonal features. Modules give you a way to split your code in components that can be easily assembled together, and in a way you can replace one of these components by another that provides the same interface. Namespaces solve name colision problems.

This crowd comes barging down your house and saying "THOU MUST NAMESPACE YOUR SCRIPTS", now you write things like this:

{% highlight js %}
var com = {}
com.myCompany = {}
com.myCompany.myPackage = {}
com.myCompany.myPackage.someOtherDumbThing = {}
com.myCompany.myPackage.someOtherDumbThing.identity = function(a){ return a }
{% endhighlight %}

And, well, the madness goes on and on.

In JavaScript, namespacing can be emulated through objects, but we don't get full-on first-class namespaces — we can't manipulate the contents of a function's locals, for example, as we would be able to do in Io, Clojure and a couple of other languages. And ES5+ just got rid of `with` — which was badly designed anyways. Tough luck. First-class namespaces are a *real nice thing*, unfortunately they don't solve modularity problems.

### Poor ports of other languages's package systems

### The Module Pattern

Moving on, the module pattern gives you... you guessed it: modules! Albeit a rather crude form of that. In the module pattern you use a function to get a new scope where you can hide implementation details, and then you return an object that provides the interface your module exposes.

### Asynchronous Module Definition (AMD)

## CommonJS modules (as implemented by Node.js)

### A quick conceptual overview
### First-class modules
### Module loading
### Parametric modules and delayed binding

## One NPM to Rule Them All

### On Package management in general
### How NPM works?
### Why is there a need for package management?

## NPM and CommonJS outside of Node-land

### Limitations
### Browserify means CommonJS + NPM in the browser
### Stand-alone modules
### Common bundles
### Other games in the town

## Conclusion

## References and additional reading
