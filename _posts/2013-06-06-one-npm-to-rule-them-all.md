---
layout:    post
title:     One NPM to Rule Them All
snip:      Modules need a package manager, so just meet NPM and stop worrying.
published: false
---

Years ago I wrote a little post on modules, frameworks and micro-frameworks, and oh boy did the landscape change! Today, if you're not using NPM and CommonJS when writing any JavaScript code, you're most likely doing it wrong. It doesn't matter if you're writing for the Browser, Node or a small Arduino sitting idle on your table, and in this post I'll show you why.

TL;DR:

- Modularise: write small modules that do only one thing, and compose them together to do more complex stuff.
- Use a package manager: use NPM to manage your dependencies and stop worrying about them.
- Use CommonJS: it's a simple and expressive module system. And it gives you first-class modules!


## Introduction

If you have ever read my blog, you'd know I'm a strong advocate of both the Unix philosophy and functional programming. They both encourage you to write small, self-contained pieces of functionality and compose them together to build bigger things. Unfortunately, lots of people writing JavaScript are still in the dark ages when it comes down to modularising their applications. You see, there are still plenty of people that think that "The Module Pattern" is a good idea; it is not, however, it's just boilerplate that indicates the lack of proper tooling — and if you ever find yourself having boilerplate, you should be worrying about your tools not solving your problem, because *they aren't*.

There have been plenty of module solutions over the time in JavaScript, the most expressive and simple of them is still the [CommonJS][] standard, which is used in a slightly different form in Node. CommonJS gives you a nice syntax, and more important, **first-class modules**. You might ask why first-class modules are important, and I could answer you with "for the same reason first-class functions" are, but instead I will just leave you with a [most awesome keynote that explains that][modules talk], and assume you know the answer from now on.

[CommonJS]: http://wiki.commonjs.org/wiki/Modules/1.1
[modules talk]: http://2013.flatmap.no/spiewak.html

The rest of this article is laid out as follows: in the first section I give an overview of all module solutions available for JavaScript, and quickly analyse the pros-and-cons of each one. In the subsequent sections I present CommonJS in more depth, then introduce the concepts of parametric modules. Then there's a whole section on package management and NPM. In the last section I itroduce Browserify as a tool for using CommonJS modules in non-Node.js environments. Finally, I give a kick-ass conclusion on all of this mess and point you to additional reading material and tools.

## Module solutions for JS

It's actually interesting to see how many things the lack of module support backed right into the language has spawned. This is, in fact, one of the things that keep amazing me in Node.js: give people a really small core, but a rather expressive one, and they'll come up with their own creative solutions to solve problems X and Y, and these solutions will then compete to see which one solves the problem best.

Languages and platforms that are heavily batteries-included usually strive for "There Should Be Only One Way of Doing X", and with that way of thinking those solutions might lose relevance with time, or they might simply not solve the stated problem in the best way it could (for example, Python's module system is shitty as fuck).

The module landscape in JavaScript consists of a few well-known players (AMD, CommonJS), and attempts to port less-expressive package/namespacing conventions to the language (Gjs), to the most-naïve-solution-that-could-possibly-work (Module pattern).

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


### The Module Pattern

Moving on, the module pattern gives you... you guessed it: modules! Albeit a rather crude form of that. 
