---
layout: article
title: "Why PLs Should Have Effect Handlers"
---

Most programming languages should have a concept similar to **effect handlers**, even if the language doesn’t include an effect system as well. One reason for this is simply that they’re a cool feature, but the important part is that effect handlers solve a very real tension between programmer intent and execution context, which shows in testing, cross-platform development, distributed computing, and several other common cases.

This piece will briefly discuss further what they are, what problems they solve, and how they solve it. For a more detailed treatise of the subject, see [Pretnar’s effect handlers tutorial](https://www.eff-lang.org/handlers-tutorial.pdf).

<!--more-->


## Computational Effects

Before we talk about effect handlers, we need to talk about **computational effects**. A computational effect is anything your program does that is *observable to someone (or something)*. So they’re things like:


- Displaying things on the screen;
- Playing music;
- Sending things over the network;
- Changing things in memory or disk;
- Heating things up;

Things like the memory used for computing something, the runtime, energy consumption, how hot the computer gets as it computes something, and other physical phenomena are likewise a form of computational effect.


> <strong class="heading">Note</strong>
> More often than not we pretent that these effects are not there—we work at a level of abstraction where our reasoning does not include these. This means that, even when we talk about computational effects in programming languages, we’re discussing things other than computational resource consumption from merely executing a program. This is a choice that’s often reasonable, but in some niche contexts thinking about these phenemona—and expressing it in the program itself—can be extremely useful.

In most languages these effects are not controlled. They just happen on the side (that is, they’re “side-effects”). In itself, that’s not really too bad. Although reasoning about side-effects in most languages can be daunting in some cases, you can easily write a program that does what you want, and observe the program doing those things.

Computational (and by extension side-)effects let you write *useful* programs. And we really want them.


## Intent and Context

The other important layer, and something people seem to not realise as a fundamental problem, are intent and context. So we have computational effects, which are things that you can *observe,* but they can be further divided into two things:


- The **intent** of the programmer: what does the programmer wants the program to do;
- The **context** in which the program is being observed: what does the user care about *right now* when running the program.

Existing programming languages seldom let you choose how to treat these two pieces separately. Instead, they force you to *choose* one—and only one!—context when writing the program, and that context is always used.

Now, you may use something like parameterisation and conditionals, and duplicate a large amount of code to *choose* more than one context. But you’ll still be putting the context in your source code, where it does not really belong—you don’t know in which context your program will run.

But what does this mean in practice? Imagine you have the following code:

```js
function greet() { 
  let now = time.now().hour; 
  if (now < 12) {  
    print("Good morning")  
  } 
  else if (now >= 12 && now < 18) {  
    print("Good afternoon")  
  } 
  else if (now >= 18) { 
     print("Good evening") 
  } 
}
```

That’s a very simple piece of code that greets someone according to the time of the day. It works wonders if you run it, and seems to print the right thing, except… how do you write tests for it?

Well, the code should depend on “some way of getting the current time” and “some way of showing messages”, but instead we’re depending on a particular *context* for them. We’ve defined in this source code that the context will always be “looking at the wall clock” and “showing messages on the standard output”. Testing becomes very difficult because those are not things we control.

But it’s *not just* testing, though. What happens if we want to move this application to the web? What happens if we move it to a GUI? By specifying the context where our application will run in our application’s source code we’ve made all of these a lot more difficult.

The work-around for this problem varies depending on the language, but includes things like [dependency injection](https://en.wikipedia.org/wiki/Dependency_injection), [parameterised modules](https://gbracha.blogspot.com/2009/06/ban-on-imports.html), [reader monads](https://softwaremill.com/reader-monad-constructor-dependency-injection-friend-or-foe/), [the cake pattern](https://www.infoq.com/presentations/io-functional-side-effects/), [mocks](https://en.wikipedia.org/wiki/Mock_object), [implicits](https://wadler.blogspot.com/2014/06/the-implicit-calculus-new-foundation.html), and several other forms of boilerplate, impossible-to-reuse-as-abstractions thingies that we only really have to resort to because we haven’t separated intent from contexts.

All of these require extensive changes to the previous example. They make code more complex, they are difficult to explain, they are difficult to maintain, and they often come with serious limitations and edge-cases that have implications on security, robustness, and determinism.


> <strong class="heading">Note</strong>
> [Context-Oriented Programming](https://www.quora.com/What-are-some-mind-refreshing-programming-paradigms-not-FP-OOP-procedural-declarative-concatenative-term-rewrite/answer/Quildreen-Motta) actually gets this right, and it was one of the points Ungar and Smith were making in their Us paper , although Us didn’t include extensible perspectives, their follow up work with [Korz](https://homepages.ecs.vuw.ac.nz/~servetto/Fool2014/FundationForObjectAspectAndContextOrientedProgramming) really went all out with that.

## Effect handlers

So, the problem is that we’re mixing intent and context and treating them as a single thing. Let’s fix that *first*. We’ll start by defining the intent of what we want to do. We’ll call these intentions “effects”, because it’s what they’ll ultimately be.

```ts
effect CurrentTime() -> { hour: int, min: int, sec: int };
effect Display(message: string);
```

So we can do two things. We can get the current time. And we can display textual messages. None of these tell us “how” these things get done. That’s a totally separate concern because the “how” depends on the context in which this “what” happens.

We also have to define `print` and `time.now()`. But we don’t want to choose a context yet. So the only thing we’ll do is say that these functions *perform* some effect:

```ts
function print(message: string) { 
  perform Display(message); 
} 
 
function time.now() -> { hour: int, min: int, sec: int } { 
  return perform CurrentTime(); 
}
```

So these also don’t tell us anything about “how” these effects get done. So far we haven’t changed anything about our code. If we run the program right now, there’s nothing that says what `perform Display(message)` should do.

That’s where *handlers* come in. Handlers define the “how” of effects. But they do so separately. They’re pretty similar to exception handlers that you see in most languages (and that’s actually where they come from), thus they’re dynamically scoped. This is great, because it means we can change the context in which we run `greet` without ever touching its source code.

In our original program we would simply call `greet()`. This is no longer possible because we need to tell the system how to handle the effects performed from the `greet()` entrypoint. So our program becomes this instead:

```ts
handle { 
  greet(); 
} with (k) { 
  Display(message) -> System.out.printLine(message); k(); 
  CurrentTime() -> k(System.time.now()); 
}
```

A test program would not require any changes to `greet()`, nor any plumbing of variables and values. It would just provide another execution context for `greet()`:

```ts
function test(hour: int, message: string) { 
  handle { 
    greet(); 
  } with (k) { 
    Display(actual) -> assert actual == message; k(); 
    CurrentTime() -> k({ hour: hour, min: 0, sec: 0 }); 
  } 
} 
 
test(6, "Good morning"); 
test(14, "Good afternoon"); 
test(19, "Good evening");
```

Likewise, if we wanted to display things in a GUI instead of the standard output, we could do so easily with another program that calls `greet()`:

```ts
handle { 
  greet(); 
} with (k) { 
  Display(message) -> App.StatusBar.setText(message); k(); 
  CurrentTime() -> k(System.time.now()); 
}
``` 

This is a very simple example, but even so it shows that being able to separate intention and context is a good thing. Supporting new contexts without changing the code is powerful.

In all of these, `k` represents the captured continuation, which you can call to resume your program with some computed value (if you’re not familiar with continuations, you can think of them as callbacks in Node—or see [Matt’s article on continuations with examples](http://matt.might.net/articles/by-example-continuation-passing-style/)).


> <strong class="heading">Note</strong>
> Some implementations of effect handlers allow you to call the continuation more than once, which can be used to implement powerful control-flow abstractions like non-deterministic execution (e.g.: exploring all possible executions of a function in parallel), or transactions with automatic retries.

The concept is even more interesting when you consider live programming. Imagine you have the following piece of code:

```ts
let files = someDirectory.find("*.txt");
files.remove();
```

This finds all `.txt` files in some directory and *deletes them*. Now, while this is really what we want to happen, it’s not very fun to type this program and have it execute at each character you type—the chances of disastrous and irreversible things happening are too high.

Effect handlers provide a really good solution for this (and this is the major reason I’m using them in Purr). You can change the *context* while you’re running this code in the IDE so that “remove” doesn’t actually remove the files from the disk, but simply lets you see *what is going to happen* with the file system when you run the code.

Another kind of feedback that is difficult when you can’t control the context is talking to external services. Imagine you have this:

```ts
let user = someApi.retrieveAndUpdate("some-id"); 
user.inventory.add(rustySword); 
```

This operation retrieves an user from the server and updates some aspect of it. It’s probably not something that you can call more than once and hope things won’t be screwed up. Maybe the server isn’t even up at the time you want to test it. Separating the context from the intent lets your IDE ask you for some test data; or do the request only once and remember the data it received, then reuse that for all subsequent runs; or let you time-travel forward and backward in time with any set of data; or simulate this piece of code for multiple users using data you’ve downloaded before and provide a comparison of their results at the same time. And so on, and so forth.


## Conclusion

Effect handlers are amazing and solve many real problems that programs have today (especially if they have some kind of live-programming—like Swift’s playground thingie). Even though they’re a fairly recent thing (research on them “started” ~8 years ago), programming languages really should start adopting them.

If you’re looking for what a practical language with effect handlers and an effect system would look like, [Lindley, McBride, and McLaughlin’s paper on Frank](https://arxiv.org/abs/1611.09259) provides a thorough academic report on that. Someone has also collected [a bibliography on relevant work done on effects so far](https://github.com/yallop/effects-bibliography) on GitHub, which includes formulations of the concept on existing languages as well.