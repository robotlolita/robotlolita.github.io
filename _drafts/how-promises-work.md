---
layout: post
title:  How do Promises Work?
snip:   Promises are an old concept that have become a fairly big thing in JavaScript recently, but most people still don't know how to use them properly. This blog post should give you a working understanding of promises, and how to best take advantage of them.
---

## Table of Contents
  * TOC
{:toc}


## 1. Introduction

Most implementations of JavaScript happen to be single-threaded, and
given the language's semantics, people tend to use *callbacks* to direct
concurrent processes. While there isn't anything particularly wrong with
[Continuation-Passing Style][CPS], in practice it's very easy for them
to make the code harder to read, and more procedural than it should be.

Many solutions for this have been proposed, and the usage of promises to
compose these concurrent processes is one of them. In this blog post
we'll look at what promises are, how they work, and why you should or
shouldn't use them.

> <strong class="heading">Note</strong>
> This article assumes the reader is at least familiar with
> higher-order functions, and callbacks (continuation-passing style).
> You might still be able to get something out of this article without
> that knowledge, but it's better to come back after acquiring a basic
> understanding of those concepts.
{: .note}


[CPS]: http://matt.might.net/articles/by-example-continuation-passing-style/


## 2. A Conceptual Understanding of Promises

Let's start from the beginning and answer a very important question:
“What *are* promises anyway?”

To answer this question, we'll consider a very common scenario in real
life.

### Interlude: The Girl Who Hated Queues

![](/files/2015/09/promises-01.png)
*Girfriends trying to have dinner at a very popular food place.*
{: .pull-left}

Alissa P. Hacker and her girlfriend decided to have dinner at a very
popular restaurant. Unfortunately, as it was to be expected, when they
arrived there all of the tables were already taken.

In some places, this would mean that they would either have to give up
and choose somewhere else to eat, or wait in a long queue until they
could get a table. But Alissa hated queues, and this place had the
perfect solution for her.
{: .clear}

> “This is a magical device that represents your future table…”
{: .highlight-paragraph .pull-in}

![](/files/2015/09/promises-02.png)
*A device that represents your future table in the restaurant.*
{: .pull-right}

“Worry not, my dear, just hold on to this device, and everything will be
taken care of for you,” the lady at the restaurant said, as she held a
small box.

“What is this…?” Alissa’s girlfriend, C. Belle, asked.

“This is a magical device that represents your future table at this
restaurant,” the lady spoke, then beckoned to Belle. “There’s no magic,
actually, but it’ll tell you when your table is ready so you can come
and sit,” she whispered.
{: .clear}


### 2.1. What Are Promises?

Much like the “magical” device that stands in for your future table at
the restaurant, promises exist to represent *something* that will be
available in the future. In a programming language, these things are
values.

![](/files/2015/09/promises-03.png)
*Whole apple in, apple slices out.*
{: .pull-left}

In the synchronous world, it's very simple to understand computations
when thinking about functions: you put things into a function, and the
function gives you something in return.

This *input-goes-in-output-comes-out* model is very simple to
understand, and something most programmers are very familiar with. All
syntactic structures and built-in functionality in JavaScript assume
that your functions will follow this model.

There is one big problem with this model, however: in order for us to be
able to get our delicious things out when we put things into the
function, we need to sit there and wait until the function is done with
its work. But ideally we would want to do as many things as we can with
the time we have, rather than sit around waiting.
{: .clear}

To solve this problem promises propose that, instead of waiting for the
value we want, we get something that represents that value right
away. We can then move on with our lives, and, at some later point in
time, come back to get the value we need.

> Promises are representations of eventual values.
{: .highlight-paragraph}

![](/files/2015/09/promises-04.png)
*Whole apple in, ticket for rescuing our delicious apple slices later out.*
{: .centred-image}


### Interlude: Order of Execution

Now that we, hopefully, understand what a promise is, we can look at how
promises help us write concurrent programs in an easier way. But before
we do that, let's take a step back and think about a more fundamental
problem: the order of execution of our programs.

As a JavaScript programmer, you might have noticed that your program
executes in a very peculiar order, which happens to be the order in
which you write the instructions in your program's source code:

{% highlight js linenos=table %}
var circleArea = 10 * 10 * Math.PI;
var squareArea = 20 * 20;
{% endhighlight %}

If we execute this program, first our JavaScript VM will run the
computation for `circleArea`, and once it's finished, it'll execute the
computation for `squareArea`. In other words, our programs are telling
the machines “Do this. Then do that. Then do that. Then…”


> <strong class="heading">Question time!</strong>
> Why must our machine execute `circleArea` before `squareArea`? Would
> there be any issues if we inverted the order, or executed both at
> the same time?
{: .note .info}


Turns out, executing everything in order is very expensive. If
`circleArea` takes too long to finish, then we're blocking `squareArea`
from executing at all until then. In fact, for this example, it doesn’t
matter which order we pick, the result is always going to be the
same. The order expressed in our programs is too arbitrary.


> […] order is very expensive.
{: .highlight-paragraph}


We want our computers to be able to do more things, and do more things
*faster*. To do so, let's, at first, dispense with order of execution
entirely. That is, we'll assume that in our programs, all expressions
are executed at the exact same time.

This idea works very well with our previous example. But it breaks as
soon as we try something slightly different:

{% highlight js linenos=table %}
var radius = 10;
var circleArea = radius * radius * Math.PI;
var squareArea = 20 * 20;
print(circleArea);
{% endhighlight %}

If we don't have any order at all, how can we compose values coming from
other expressions? Well, we can't, since there's no guarantee that the
value would have been computed by the time we need it.

Let's try something different. The only order in our programs will be
defined by the dependencies between the components of the
expressions. Which, in essence, means that expressions are executed as
soon as all of its components are ready, even if other things are
already executing.

![](/files/2015/09/promises-05.png)
*The dependency graph for our simple example.*
{: .centred-image .full-image}


Instead of having to declare which order the program should use when
executing, we've only defined how each computation depends on each
other. With that data in hand, a computer can create the dependency
graph above, and figure out itself the most efficient way of executing
this program.

> <strong class="heading">Fun fact!</strong>
> The graph above describes very well how programs are evaluated
> in the Haskell programming language, but it's also very close
> to how expressions are evaluated in more well-known systems, such as
> Excel.
{: .note .trivia}


### 2.3. Promises and Concurrency





## 3. How do promises work in JavaScript?
A practical understanding of Promises/A+.

## 4. Why use promises?
The benefits.

## 5. Why not use promises?
Where they really don't fit.

## 6. Conclusion


## References and Additional Reading
