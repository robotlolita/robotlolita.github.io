---
layout: post
title:  How do Promises Work?
snip:   Promises are an old concept that have become a fairly big thing in JavaScript recently, but most people still don't know how to use them properly. This blog post should give you a working understanding of promises, and how to best take advantage of them.
---

<h2>Table of Contents</h2>

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
> This article assumes the reader is at least familiar with higher-order
> functions, closures, and callbacks (continuation-passing style).  You
> might still be able to get something out of this article without that
> knowledge, but it's better to come back after acquiring a basic
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
matter which order we
 pick, the result is always going to be the
same. The order expressed in our programs is too arbitrary.


> […] order is very expensive.
{: .highlight-paragraph}gde33: 


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


### 2.2. Promises and Concurrency

The execution model described in the previous section, where order is
defined simply by the dependencies between each expression, is very
powerful and efficient, but how do we apply it to JavaScript?

We can't apply this model directly to JavaScript because its semantics
are inherently synchronous and sequential. But we can create a separate
mechanism to describe dependencies between expressions, and to resolve
these dependencies for us, executing the program according to those
rules. One way to do this is by introducing this concept of dependencies
on top of promises.

This new formulation of promises consists of two major components:
Something that makes representations of values, and can put values in
this representation. And something that creates a dependency between one
expression and a representation of a value, creating a new
value representation for the result of the expression.

![](/files/2015/09/promises-06.png)
*Creating representations of future values.*
![](/files/2015/09/promises-07.png)
*Creating dependencies between values and expressions.*
{: .pull-left .width-350}

Our promises represent values that we haven't computed yet. This
representation is opaque: we can't see the value, nor interact with the
value directly. Furthermore, in JavaScript promises, we also can't
extract the value from the representation. Once you put something in a
JavaScript promise, you can't take it out of the promise [^1].

This by itself isn't much useful, because we need to be able to use
these values somehow. And if we can't extract the values from the
representation, we need to figure out a different way of using
them. Turns out that the simplest way of solving this “extraction
problem” is by describing how we want our program to execute, by
explicitly providing the dependencies, and then solving this dependency
graph to execute it.

For this to work, we need a way of plugging the actual value in the
expression, and delaying the execution of this expression until strictly
needed. Fortunately JavaScript has got our back in this: first-class
functions serve exactly this purpose.
{: .clear}

### Interlude: Lambda Abstractions

If one has an expression of the form `a + 1`, then it is possible to
abstract this expression such that `a` becomes a value that can be
plugged in, once it's ready. This way, the expression:

{% highlight js linenos=table %}
var a = 2;
a + 1;
// { replace `a` by its current value }
// => 2 + 1
// { reduce the expression }
// => 3
{% endhighlight %}

Becomes the following lambda abstraction:

{% highlight js linenos=table %}
var abstraction = function(a) {
  return a + 1;
};

// We can then plug `a` in:
abstraction(2);
// => (function(a){ return a + 1 })(2)
// { replace `a` by the provided value }
// => (function(2){ return 2 + 1 })
// { reduce the expression }
// => 2 + 1
// { reduce the expression }
// => 3
{% endhighlight %}

Lambda Abstractions[^2] are a very powerful concept, and because
JavaScript has them, we can describe these dependencies in a very
natural way. To do so, we first need to turn our expressions that use
the values of promises into Lambda Abstractions, so we can plug in the
value later.


## 3. Understanding the Promises Machinery

### 3.1. Sequencing Expressions with Promises

Now that we went through the conceptual nature of promises, we can start
understanding how they work in a machine. To do so, we'll describe the
operations we'll use to create promises, put values in them, and
describe the dependencies between expressions and values. For the sake
of our examples, we'll use the following very descriptive operations,
which happen to be used by no existing Promises implementation:

- `createPromise()` constructs a representation of a value. The value
  must be provided at later point in time.
  
- `fulfil(promise, value)` puts a value in the promise. Allowing
  the expressions that depend on the value to be computed.

- `depend(promise, expression)` defines a dependency between
  the lambda abstraction and the value of the promise. It returns a new
  promise for the result of the expression, so new expressions can
  depend on that value.


Let's go back to the circles and squares example. For now, we'll start
with the simpler one: turning the synchronous `squareArea` into a
concurrent description of the program by using promises. `squareArea` is
simpler because it only depends on the `side` value:

{% highlight js linenos=table %}
// The expression:
var side = 10;
var squareArea = side * side;
print(squareArea);

// Becomes:
var squareAreaAbstraction = function(side) {
  var result = createPromise();
  fulfil(result, side * side);
  return result;
};
var printAbstraction = function(squareArea) {
  var result = createPromise();
  fulfil(result, print(squareArea));
  return result;
}

var sidePromise = createPromise();
var squareAreaPromise = depend(sidePromise, squareAreaAbstraction);
var printPromise = depend(squareAreaPromise, printAbstraction);

fulfil(sidePromise, 10);
{% endhighlight %}

This is a lot of noise, if we compare with the synchronous version of
the code, however this new version isn't tied to JavaScript's order of
execution. Instead, the only constraints on its execution are the
dependencies we've described.


### 3.2. A Minimal Promise Implementation

There's one open question left to be answered: how do we actually run
the code so the order follows from the dependencies we've described?
If we're not following JavaScript's execution order, something
else has to provide the execution order we want. 

Luckily, this is easily definable in terms of the functions we've
used. First we must decide how to represent values and their
dependencies. The most natural way of doing this is by adding this data
to the value returned from `createPromise`.

First, Promises of **something** must be able to represent that value,
however they don't necessarily contain a value at all times. A value is
only placed into the promise when we invoke `fulfil`. A minimal
representation for this would be:

{% highlight haskell linenos=table %}
data Promise of something = {
  value :: something | null
}
{% endhighlight %}

A `Promise of something` springs into existence containing the value
`null`. At some later point in time someone may invoke the `fulfil`
function for that promise, at which point the promise will contain the
given fulfilment value. Since promises can only be fulfilled once, that
value is what the promise will contain for the rest of the program.

Given that it's not possible to figure out if a promise has already been
fulfilled by just looking at the `value` (`null` is a valid value), we
also need to keep track of the state the promise is in, so we don't risk
fulfilling it more than once. So we change the representation
accordingly:

{% highlight haskell linenos=table %}
data Promise of something = {
  value :: something | null,
  state :: "pending" | "fulfilled"
}
{% endhighlight %}

We also need to handle the dependencies that are created by the `depend`
function. A dependency is a lambda abstraction that will, eventually, be
filled with the value in the promise, so it can be evaluated. One
promise can have many lambda abstractions which depend on its value, so
a minimal representation for this would be:

{% highlight haskell linenos=table %}
data Promise of something = {
  value :: something | null,
  state :: "pending" | "fulfilled",
  dependencies :: [something -> Promise of something_else]
}
{% endhighlight %}

Now that we've decided on a representation for our promises, let's start
by defining the function that creates new promises:

{% highlight js linenos=table %}
function createPromise() {
  return {
    // A promise starts containing no value,
    value: null,
    // with a "pending" state, so it can be fulfilled later,
    state: "pending",
    // and it has no dependencies yet.
    dependencies: []
  };
}
{% endhighlight %}

Since we've decided on our simple representation, constructing a new
object for that representation is fairly straightforward. Let's move to
something more complicated: attaching dependencies to a promise.

One of the ways of solving this problem would be to put all of the
dependencies created in the `dependencies` field of the promise, then
feed the promise to an interpreter that would run the computations as
needed. With this implementation, no dependency would ever execute
before the interpreter is started. We'll not implement promises this way
because it doesn't fit how people usually write JavaScript programs[^3].

Another way of solving this problem comes from the realisation that we
only really need to keep track of the dependencies for a promise while
the promise is in the `pending` state, because once a promise is
fulfilled we can just execute the lambda abstraction right away!

{% highlight js linenos=table %}
function depend(promise, expression) {
  // We need to return a promise that will contain the value of
  // the expression, when we're able to compute the expression
  var result = createPromise();

  // If we can't execute the expression yet, put it in the list of
  // dependencies for the future value
  if (promise.state === "pending") {
    promise.dependencies.push(function(value) {
      // We're interested in the eventual value of the expression
      // so we can put that value in our result promise.
      depend(expression(value), function(newValue) {
        fulfil(result, newValue);
        // We return an empty promise because `depend` requires one promise
        return createPromise();
      })
    });

  // Otherwise just execute the expression, we've got the value
  // to plug in ready!
  } else {
    depend(expression(promise.value), function(newValue) {
      fulfil(result, newValue);
      // We return an empty promise because `depend` requires one promise
      return createPromise();
    })
  }

  return result;
}
{% endhighlight %}

The `depend` function takes care of executing our dependent expressions
when the value they're waiting for is ready, but if we attach the
dependency too soon that lambda abstraction will just end up in an array
in the promise object, so our job is not done yet. For the second part
of the execution, we need to run the dependencies when we've got the
value. Luckily, the `fulfil` function can be used for this.

We can fulfil promises that are in the `pending` state by calling the
`fulfil` function with the value we want to put in the promise. This is
a good time to invoke any dependencies that were created before the
value of the promise was available, and takes care of the other half of
the execution.

{% highlight js linenos=table %}
function fulfil(promise, value) {
  if (promise.state !== "pending") {
    throw new Error("Trying to fulfil an already fulfilled promise!");
  } else {
    promise.state = "fulfilled";
    promise.value = value;
    promise.dependencies.forEach(function(expression) {
      expression(value);
    });
  }
}
{% endhighlight %}


### 3.3. The Machinery of Concurrency With Promises

While sequencing operations with promises requires one to create a chain
of dependencies, combining promises concurrently just requires that the
promises don't have a dependency on each other.

For our Circle example we have a computation that is naturally
concurrent. The `radius` expression and the `Math.PI` expression don't
depend on each other, so they can be computed separately, but
`circleArea` depends on both. In terms of code, we have the following:

{% highlight js linenos=table %}
var radius = 10;
var circleArea = 10 * 10 * Math.PI;
print(circleArea);
{% endhighlight %}

If one wanted to express this with promises, they'd have:

{% highlight js linenos=table %}
var circleAreaAbstraction = function(radius, pi) {
  var result = createPromise();
  fulfil(result, radius * radius * pi);
  return result;
};

var printAbstraction = function(circleArea) {
  var result = createPromise();
  fulfil(result, print(circleArea));
  return result;
};

var radiusPromise = createPromise();
var piPromise = createPromise();

var circleAreaPromise = ???;
var printPromise = depend(circleAreaPromise, printAbstraction);

fulfil(radiusPromise, 10);
fulfil(piPromise, Math.PI);
{% endhighlight %}

We have a small problem here: `circleAreaAbstraction` is an expression
that depends on **two** values, but `depend` is only able to define
dependencies for expressions that depend on a single value!

There are a few ways of working around this limitation, we'll start with
the simple one. If `depend` can provide a single value for one
expression, then it must be possible to capture the value in a closure,
and extract the values from the promises one at a time. This does create
some implicit ordering, but it shouldn't impact concurrency too much.

{% highlight js linenos=table %}
function wait2(promiseA, promiseB, expression) {
  // We extract the value from promiseA first.
  return depend(promiseA, function(a) {
    // Then we extract the value of promiseB
    return depend(promiseB, function(b) {
      // Now that we've got access to both values,
      // we can execute the expression that depends
      // on more than one value:
      var result = createPromise();
      fulfil(result, expression(a, b));
      return result;
    })
  })
}
{% endhighlight %}

With this, we can define `circleAreaPromise` as the following:

{% highlight js linenos=table %}
var circleAreaPromise = wait2( radiusPromise
                             , piPromise
                             , circleAreaAbstraction);
{% endhighlight %}

We could define `wait3` for expressions that depend on three values,
`wait4` for expressions that depend on four values, and so on, and so
forth. But `wait*` creates an implicit ordering (promises are executed
in a particular order), and it requires that we know the amount of
values that we're going to plug in advance. So it doesn't work if we
want to wait for an entire array of promises, for example (although one
could combine `wait2` and `Array.prototype.reduce` for that).

Another way of solving this problem is to accept an array of promises,
and execute each one as soon as possible, then give back a promise for
an array of the values the original promises contained. This approach is
a little more complicated, since we need to implement a simple Finite
State Machine, but it scales.

{% highlight js linenos=table %}
function waitAll(promises, expression) {
  // An array of the values of the promise, which we'll fill in
  // incrementally.
  var values = new Array(promises.length);
  // How many promises we're still waiting for
  var pending = values.length;
  // The resulting promise
  var result = createPromise();

  // We start by executing each promise. We keep track of the
  // original index so we know where to put the value in the 
  // resulting array.
  promises.forEach(function(promise, index) {
    // For each promise, we'll wait for the promise to resolve,
    // and then store the value in the `values` array.
    depend(promise, function(value) {
      values[index] = value;
      pending = pending - 1;

      // If we finished waiting for all of the promises, we
      // can put the array of values in the resulting promise
      if (pending === 0) {
        fulfil(result, values);
      }

      // We don't care about doing anything else with this promise.
      // We return an empty promise because `depends` requires it.
      return createPromise();
    })
  });

  // Finally, we return a promise for the eventual array of values
  return result;
}
{% endhighlight %}

If we were to use `waitAll` for the `circleAreaAbstraction`, it would
look like the following:

{% highlight js linenos=table %}
var circleAreaPromise = waitAll([radiusPromise, piPromise]
                               ,function(xs) {
                                  return circleAreaAbstraction(xs[0], xs[1]);
                               })
{% endhighlight %}


## 4. Promises and Error Handling

### Interlude: When Computations Fail

Not all computations can always produce a valid value. Some functions,
like `a / b`, or `a[0]` are partial, and thus only defined for a subset
of possible values for `a` or `b`. If we write programs that contain
partial functions, and we hit one of the cases that the function can't
handle, we won't be able to continue executing the program. In other
words, our entire program would crash.

A better way of incorporating partial functions in a program is by
making it total. That is, defining the parts of the function that
weren't defined before. In general, this means that we consider the
cases the function can handle a form of "Success", and the cases it
can't handle a form of "Failure". This alone already allows us to write
entire programs that may continue executing even when faced with a
computation that can't produce a valid value:

![](/files/2015/09/promises-08.png)
*Branching on partial functions*
{: .centred-image .full-image}

Branching on each possible failure is a reasonable way of handling them,
but not necessarily a practical one. For example, if we compose three
computations that could fail, that means we'd have to define at least 6
different branches, for the simplest composition!

![](/files/2015/09/promises-09.png)
*Branching on every partial function*
{: .centred-image .full-image}

> <strong class="heading">Fun fact!</strong>
> Some programming languages, like OCaml, prefer this style of error
> handling because it's very explicit on what's happening. In general
> functional programming favours explicitness, but some functional
> languages, like Haskell, use an interface called Monad[^4] to make
> error handling (among other things) more practical.
{: .note .trivia}

Ideally, we'd like to write just `y / (x / (a / b))`, and handle
possible errors just once, for the entire composition, rather than
handling errors in each sub-expression. Programming languages have
different ways of letting you do this. Some let you ignore errors
entirely, or at least put off touching it as much as possible, like C
and Go. Some will let the program crash, but give you tools to recover
from the crashing, like Erlang. But the most common approach is to
assign a "failure handler" to a block of code where failures may
happen. JavaScript allows the latter approach through the `try/catch`
statement, for example.

![](/files/2015/09/promises-10.png)
*One of the approaches for handling failures in a practical way*
{: .centred-image .full-image}



### 4.1. Handling Errors With Promises

Our formulation of Promises so far does not admit failures. So, all of
the computations that happen in promises must always produce a valid
result. This is a problem if we were to run a computation like `a / b`
inside a promise, because if `b` is 0, like in `2 / 0`, that computation
can't produce a valid result.


![](/files/2015/09/promises-11.png)
*Possible states of our new promise*
{: .pull-left}

We can modify our promise to contemplate the representation of failures
quite easily. Currently our promises start at the `pending` state, and
then it can only be fulfilled. If we add a new state, `rejected`, then
we can model partial functions in our promises. A computation that
succeeds would start at pending, and eventually move to `fulfilled`. A
computation that fails would start at pending, and eventually move to
`rejected`.

Since we now have the possibility of failure, the computations that
depend on the value of the promise also must be aware of that. For now
we'll have our `depend` failure just take an expression to be run when
the promise is fulfilled, and one expression to run when the promise is
rejected.

With this, our new representation of promises becomes:
{: .clear}

{% highlight haskell linenos=table %}
data Promise of (value, error) = {
  value :: value | error | null,
  state :: "pending" | "fulfilled" | "rejected",
  dependencies :: [{
    fulfilled :: value -> Promise of new_value,
    rejected  :: error -> Promise of new_error
  }]
}
{% endhighlight %}

The promise may contain either a proper value, or an error, and contains
`null` until it settles (is either fulfilled or rejected). To handle
this, our dependencies also need to know what to do for proper values
and error values, so the array of dependencies has to be changed
slightly.

Besides the change in representation, we need to change our `depend`
function, which now reads like this:

{% highlight js linenos=table %}
// Note that we now take two expressions, rather than one.
function depend(promise, onSuccess, onFailure) {
  var result = createPromise();

  if (promise.state === "pending") {
    // Dependencies now gets an object containing
    // what to do in case the promise succeeds, and
    // what to do in case the promise fails. The functions
    // are roughly the same as the previous ones.
    promise.dependencies.push({
      fulfilled: function(value) {
        depend(onSuccess(value),
               function(newValue) {
                 fulfil(result, newValue);
                 return createPromise()
               },
               // We have to care about errors that
               // happen when applying the expression too
               function(newError) {
                 reject(result, newError);
                 return createPromise();
               });
      },

      // The rejected branch does the same as the
      // fulfilled branch, but uses the onFailure
      // expression.
      rejected: function(error) {
        depend(onFailure(error),
               function(newValue) {
                 fulfil(result, newValue);
                 return createPromise();
               },
               function(newError) {
                 reject(result, newError);
                 return createPromise();
               });
        }
      });
    }
  } else {
    // if the promise has been fulfilled, we run onSuccess
    if (promise.state === "fulfilled") {
      depend(onSuccess(promise.value),
             function(newValue) {
               fulfil(result, newValue);
               return createPromise();
             },
             function(newError) {
               reject(result, newError);
               return createPromise();
             });
    } else if (promise.state === "rejected") {
      depend(onFailure(promise.value),
             function(newValue) {
               fulfil(result, newValue);
               return createPromise();
             },
             function(newError) {
               reject(result, newError);
               return createPromise();
             });
    }
  }

  return result;
}
{% endhighlight %}

And finally, we need a way of putting errors in promises. For this we
need a `reject` function.:

{% highlight js linenos=table %}
function reject(promise, error) {
  if (promise.state !== "pending") {
    throw new Error("Trying to reject a non-pending promise!");
  } else {
    promise.state = "rejected";
    promise.value = error;
    promise.dependencies.forEach(function(pattern) {
      pattern.rejected(error);
    })
  }
}
{% endhighlight %}

We also need to review the `fulfil` function slightly due to our change
to the `dependencies` field:

{% highlight js linenos=table %}
function fulfil(promise, value) {
  if (promise.state !== "pending") {
    throw new Error("Trying to fulfil a non-pending promise!");
  } else {
    promise.state = "fulfilled";
    promise.value = value;
    promise.dependencies.forEach(function(pattern) {
      pattern.fulfilled(value);
    });
  }
}
{% endhighlight %}

And with these new additions, we're ready to start putting computations
that may fail in our promises:

{% highlight js linenos=table %}
// A computation that may fail
var div = function(a, b) {
  var result = createPromise();

  if (b === 0) {
    reject(result, new Error("Division By 0"));
  } else {
    fulfil(result, a / b);
  }

  return result;
}

var printFailure = function(error) {
  console.error(error);
};

var a = 1, b = 2, c = 0, d = 3;
var xPromise = div(a, b);
var yPromise = depend(xPromise,
                      function(x) {
                        return div(x, c)
                      },
                      printFailure);
var zPromise = depend(yPromise,
                      function(y) {
                        return div(y, d)
                      },
                      printFailure);
{% endhighlight %}

The above code will never execute `zPromise`, because `c` is 0, and it
causes the computation `div(x, c)` to fail. This is exactly what we
expect, but right now we need to pass the failure branch every time we
define a computation in our promise. Ideally, we'd like to only define
the failure branches where necessary, like we do with `try/catch` for
synchronous computations.

Turns out that our promises *already* support this
functionality. Because 



## 5. A Practical Understanding of Promises
A practical understanding of Promises/A+.

## 6. Why Use Promises?
The benefits.

## 7. Why Not Use Promises?
Where they really don't fit.

## 8. Conclusion
gde33: 

## References and Additional Reading

- - -

<h4>Footnotes</h4>

[^1]:
    You can't extract the values of promises in Promises/A,
    Promises/A+ and other common formulations of promises in JavaScript.

    In some JavaScript environments, like Rhino and Nashorn, you might
    have access to implementations of promises that support extracting
    the value out of it. Java's Futures are an example.

    Extracting a value that hasn't been computed yet out of a promise
    requires blocking the thread until that value is computed, which
    doesn't work for most JS environments, since they're
    single-threaded.

[^2]:
    “Lambda Abstraction” is the name Lambda Calculus gives to these
    anonymous functions that abstract over terms in an
    expression. JavaScript itself just calls them “Functions,” they may
    be created with arrows, or with a Named Function
    Expression/Anonymous Function Expression construct.


[^3]:
    This separation of "computation definition" and "execution of
    computations" is how the Haskell programming language works. A
    Haskell program is nothing more than a huge expression that
    evaluates to a `IO` data structure. This structure is somewhat
    similar to the `Promise` structure we've defined here, in that it
    only defines dependencies between different computations in the
    program.

    In Haskell, however, your program must return a value of
    type `IO`, which is then passed to a separate interpreter, which
    only knows how to run `IO` computations and respect the dependencies
    it defines. It would be possible to define something similar for
    JS. If we did that, then all of our JS program would be just one
    expression resulting in a Promise, and that Promise would be passed
    to a separate component that knows how to execute Promises and their
    dependencies.

    See the
    [Pure Promises](https://github.com/robotlolita/robotlolita.github.io/tree/master/examples/promises/pure/)
    example directory for an implementation of this form of promises.

[^4]:
    A Monad is an interface that can be (and often is) used for
    sequencing semantics, when described as a structure with the
    following operations:

    {% highlight haskell linenos=table %}
    ∀a. class Monad a where
          -- Puts a value in the monad
          of    :: ∀b. b -> Monad b
          -- Transforms the value in the monad
          -- (The transformation must maintain the same type)
          chain :: ∀a, b. (Monad m) => m a -> (a -> m b) -> m b
    {% endhighlight %}

    In this formulation, it would be possible to see something like
    JavaScript's "semicolon operator" (i.e.: `print(1); print(2)`) as
    the use of the monadic `chain` operator: `print(1).chain(_ =>
    print(2))`.
