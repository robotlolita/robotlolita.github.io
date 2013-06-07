---
published: false
layout: post
title: One NPM to Rule Them All
snip: "Modules need a package manager, so just meet NPM and stop worrying."
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

The module landscape in JavaScript consists of a few well-known players (AMD, CommonJS), to the most-naïve-solution-that-could-possibly-work (Module pattern).

### The no-module way

The worst thing you could ever do: not using modules, nor namespaces. Since JS only gives you a single namespace everywhere, name collisions are just waiting to bite you in the ass. Let's not mention that now you're going to have a hard time explaining people how to play well with your code and get everything working. So, don't do this:

```js
function random(n) {
  return Math.random() * n
}

function randomInt(n) {
  return Math.abs(random(n))
}

/* ... */
```

### The "Hey let's give JS namespaces" crowd

Then, there came the Java crowd. These are particularly annoying, because they're treating a symptom of not having modules nor multiple namespaces with... just giving a half-baked solution. Oh, the naïvety. Somehow, there are still people out there that believe that namespacing solves the same problems as modules do, but if you have been paying close attention to this article you already know they don't.

This is, however, not what this crowd wants you to believe, instead they come barging down your house, screaming "THOU MUST NAMESPACE ALL YOUR SCRIPTS", and then some people go and write shit like this:

```js
var com = {}
com.myCompany = {}
com.myCompany.myPackage = {}
com.myCompany.myPackage.someOtherDumbThing = {}
com.myCompany.myPackage.someOtherDumbThing.identity = function(a){ return a }
```

And, well, the madness goes on and on.

In JavaScript, first-class namespacing can be emulated through objects, but we don't get full-on first-class namespaces — we can't manipulate the contents of a function's locals, for example, as we would be able to do in Io, Clojure and a couple of other languages. And ES5 strict just got rid of `with` — which was badly designed anyways. Tough luck. First-class namespaces are a *real nice thing*, unfortunately they don't solve modularity problems.

### The Module Pattern

Moving on, the module pattern gives you... you guessed it: modules! Albeit a rather crude form of that. In the module pattern you use a function to get a new scope where you can hide implementation details, and then you return an object that provides the interface your module exposes.

```js
// we use `new` here just to abuse how badly designed it is,
// (we can return a different object not related to the function's prototype)
// You could call the function as an IIFE, as everyone else does.
var Queue = new function() {
  return { make: function(){ ... }
         , push: function(q){ ... }
         , pop:  function(q){ ... }
         }
}
```

Now, `Queue` is properly isolated and exposes only the interface we need. Nice, but then it doesn't tell us which kind of dependencies `Queue` has, so while the module pattern is a start, it doesn't solve all our problems. We need our modules to specify their own dependencies, so we can have the module system assemble everything together for us.

### Asynchronous Module Definition (AMD)

AMD is a step in the right direction when it comes down to modules in JS, they give you both first-class modules **and** parametric modules (it should be noted that the CommonJS standard **does not** support straight-forward parametric modules — you can't export a function).

However, AMD comes with the cost of way-too-much-boilerplate. Remember that I said boilerplate is harmful and means your tools are not solving your problem, well this happens to AMD:

```js
// Dependency names are separated from bindings, which creates confusion
define('queue', ['foo'], function(foo) {
  return TheModule // this is pretty cool, though
})

// The confusion is not apparent from a simple example, so here's a "real-world" one:
define('queue', ['a', 'b', 'c', 'd', 'e', 'f', ..., 'x']
              , function(...what goes here again?) {
                  return TheModule
                })
                
// You can use CommonJS's binding syntax, but then you need tooling anyways,
// and if you're going to get better tooling, you can at least make sure you get
// a proper tool that doesn't require boilerplate
```

Besides this, there is not a clear mapping about the identifier used to refer to a module and the actual module being loaded. While this allows us to delay the concrete binding of a module by just requiring a certain interface to be implemented in the loaded modules, this means we need to know everything about every dependency of every module we use — with enough dependencies there's such a high cognitive load to keep everything working that it outweights the benefits of modules, and makes keeping track of script tag insertion order simpler. Relative modules are supported, however.

The major implementation of AMD in JavaScript is [Require.JS][], although there are a few others. Require.JS still allows plugins to be defined for loading different kinds of modules — or even things that aren't modules at all! This only adds complexity to the implementation and the applications using it, without giving back anything that outweights the cognitive costs of such behaviour.

Lazy and dynamic loading of modules, which are things AMD enable, are a nice thing to have, if your application ever needs to load more than 1MB of JavaScript — there are some kinds of applications that will just load a lot of new code over time, where it would be a nice fit. I'd still write a simpler implementation in that case, without all the warts.

[Require.JS]: http://requirejs.org/

## Node modules (a superset of CommonJS modules)

The CommonJS modules defined by the standard just don't cut it. But Node modules are an improved implementation of CommonJS modules that give you first-class and straight forward parametric modules (as AMD does), with a simpler mapping of module identifiers to implementations. Plus, you get to use NPM for managing your dependencies, but we'll get there in a second.

Unfortunately, the Node implementation is still a tad bit too complex, because it allows the use of plugins to transform modules before they are loaded, and allow one to omit file extensions, which are the trigger for plugins — [these two features combined are not a good thing, as acknowledged by Isaacs](https://github.com/joyent/node/issues/5430#issuecomment-17696415).

### A quick conceptual overview

Node modules are conceptually fairly simple:

 -  Each file corresponds to exactly one object. Once your module runs, you get a fresh object already instantiated, but you can replace it by any other value.
 
 -  Each module gets three magical variables:
 
     -  The `require` function, bound to the module's location (so that relative modules do The Right Thing™);
     
     -  The `__dirname` variable, which contains the module's location.
     
     -  The `module` variable, conforming to the interface `{ exports: Object }`, used to store the module's value.
     
 -  A call to `require` with a relative path will resolve to a module file (and ultimately an Object) relative to the current module.
 
 -  A call to `require` with an absolute path will resolve to a single module file (and ultimately an Object) relative to the root of the file system tree.
 
 -  A call to `require` with a module identifier (no leading dot or slash) will resolve to the closest module with that name in a parent or sister `node_modules` folder.

Additionally, a module can be a part of a package. Packages encode a potential collection of modules along with their meta-data (dependencies, author, main module, binaries, etc). We'll talk about packages in depth once we visit NPM later in this article.

### First-class modules

As mentioned before, Node modules are first-class. This means they're just a plain JavaScript object that you can store in variables and pass around. This one of the most important steps for a good module system.

To write a Node module, you just create a new JavaScript file, and assign any value you want to `module.exports`:

```js
// hello.js
function hello(thing) {
  console.log('Hello, ' + thing + '.')
}

// The module is now a Function
module.exports = hello
```

### Module loading

Then, Node modules give you a way of resolving a module identifier to an actual module object. This is done by the first-class function `require`. This function takes in a module identifier, resolve the identifier to a JavaScript file, executes the file, then returns the object that it exports:

```js
var hello = require('./hello.js')

hello('dear reader') // => "Hello, dear reader."
```

A module identifier can be either a relative or absolute path, in which case the regular file lookup rules apply: `./foo` resolves to a `foo` file in the requirer's directory, `/foo/bar` resolves to the `/foo/bar` file relative to the root of the file system.

Module identifiers can also be the name of a module, for example `jquery` or `foo/bar` — in the latter case `bar` is resolved relative to the root of `foo`. In these cases, the algorithm will try to find the closest module that matches that name living in a `node_modules` folder above the requirer's location.

    + /
    |--+ /node_modules
    |  `--+ /foo          // we'll load this
    `--+ /my-package
       |--+ /node_modules
       |  |--+ /jquery    // and this one too
       |  `--+ /foo
       `--o the-module.js

Node's module loading algorithm, while slightly complex (due to allowing one to omit extensions **and** allowing people to register transformers based on the file extension), is still pretty straight forward, and encourages people have dependencies installed per-module, rather than globally, which avoids lots of versioning hell.

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
