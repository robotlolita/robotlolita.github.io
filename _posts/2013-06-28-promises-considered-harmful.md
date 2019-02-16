---
published: true
layout: post
title: Promises/A+ Considered Harmful
snip: The drawbacks of using a Promises/A+ implementation
redirect_from:
  - /2013/06/28/promises-considered-harmful.html
---

> <strong class="heading">Warning</strong>
> This article was written a long time ago. Since then, Bluebird has
> solved most of the performance problem with Promises/A+ (at the cost
> of a lot of added complexity). Keep this in mind when reading the
> section on performance.
{: .warning .note}


Before I even start talking about the drawbacks of Promises/A+, let me
start by saying that the concept of Promises is one of the best things
for handling asynchronous computations in JavaScript right now. It's
also going to be supported in the next versions of ECMAScript and DOM
APIs.

There are, however, some problems with the Promises/A+ specification,
which makes it difficult to write efficient code in a mixed
environment. The specification is also more complex than it should
be. In this blog post I'll visit the design decisions behind the
specification and how they can impact your application once you start
using them.

*This is where [Domenic](https://twitter.com/domenic) comes in giving me
a Roundhouse Kick and saying **thou must not use promises for
synchronous computations**. :)*

TL;DR: Promises/A+ are complex, and can have a large impact if your code
is mostly serial and have many mixed-in synchronous operations. Other
than that (and a few spec complexities), they are fairly cool for most
cases.

## Table of Contents
 *  TOC
{:toc}


## 1 What are promises?

So, what **are** promises, anyways? Well, promises are a way to
represent future values. In laymen terms, this just means you can use
the value before you get it back from whatever call you made. You
declare the relationships and dependencies between values and their
transformations, then the computer will figure out the best way to
fulfill those relationships and dependencies once it's got the value
back.

Promises are awesome because they give you back a way to compose values
regardless of when they are available, so it doesn't matter if you're
going to take 100ms to receive a String back from a REST call, and 20ms
to read a file, you can concatenate them together right now, and the
computer will figure out how once it gets those values back.

I'm not going to write too much about promises here, since
[James Coglan](http://blog.jcoglan.com/2013/03/30/callbacks-are-imperative-promises-are-functional-nodes-biggest-missed-opportunity/),
and
[Domenic](http://domenic.me/2012/10/14/youre-missing-the-point-of-promises/)
did a great job on that already. Instead, I'll focus on the advantages
and disadvantages of the Promises/A+ specification here.


## 2. So... Promises/A+?

Promises/A+ is a specification for how promises in JavaScript should
behave, so that we can treat asynchronous code in a similar fashion to
their synchronous counterpart. Broadly, what this means is that we allow
asynchronous functions to return a value, and errors to be handled by
the caller.

The specification builds on lots of previous works in the promise
landscape in JavaScript, and attempts to unify them, so each one can
talk to each other — which is the whole point of standardising
something. As such, we can use different Promises/A+ interchangeably,
and we can build useful libraries that work on promises generically,
rather than implementation A or B. In short, everyone wins.


## 3. Sources of complexity

Sadly, not everything is bright, sweet and cheerful in the Promises/A+
land. There are a couple of problems with it that make Promises/A+ a
complex thing, which is what people oposing the use of promises in
JavaScript usually mean when they say "promises are complex" — though
those are not an inherent fault of promises, per se. In part, these
complexities are there to "play along well" with legacy
implementations. Not exactly what I would consider a good idea, but
Promises/A+ proponents think it was necessary for Promises/A+ to do
that.


### 3.1. Exception handling

The first big problem with Promises/A+ is how it decides to provide
asynchronous exception handling: wrapping every asynchronous call in an
implicit `try...catch` block. While the caught exceptions are available
in the Promise object, such that the caller can decide how to handle it,
catching all the exceptions by default is not the best way to do
this. In fact, this makes all your programs instantly less robust,
because you're catching things you're not sure you can handle, instead
of just letting it crash and solve the problem.

Let me walk you through a few examples where this is harmful, and then
I'll talk about an alternative for asynchronous error handling in
promises.

Imagine you're calling a particular API which sums all the values in
a list, asynchronously. You write the following piece of code:

{% highlight js linenos=table %}
var sum = list.sum(xs)
// (...)
sum.then(display)
{% endhighlight %}
> 
> The obvious outcome is that the sum of every item in `xs` will be
> displayed on the screen... right? That's not what happens. You check
> the console, but see no errors. You double-check the `list.sum`
> implementation, and confirms it should work. You add an additional
> error handling branch to the promise, because you're not sure what
> to do next, and realise the browser is throwing a `RangeError:
> Maximum call stack size exceeded.` Dang! Now if you just... oh,
> wait, you can't fix a stack overflow error at runtime.


Imagine you're calling a RESTful API, which gives you back some JSON
array. You parse it, then map over the array of objects to extract just
the name of the things returned. `TypeError: Object #<Object> has no
method 'map'`, looks like someone changed the API you were expecting.
 
 
The examples go on, but I think those give you a feel of what I'm
talking about: problems that are entirely impossible to fix at run-time
are easily caught by this approach, and now you need to deal with these
at every place you use promises (e.g.: by using `foo.then(bar).done()`
in Q), because you can never be sure that if you let some code deal with
it at a later point in time your program will be in a consistent
state. It could well enough be receiving quota-error messages from your
database and losing all your customer's data, for what is worth.

So, implicit catching of all possible exceptions is bad, but we still
need to catch errors if we want asynchronous code to compose well with
synchronous code. My take is that the Promises/A+ shouldn't have this on
the standard, just let code that throws error crash, and allow people to
selective wrap their code if they're interested in handling something:

{% highlight js linenos=table %}
function identity(a){ return a }

function catchErrors(f) {
  try {
    return f() }
  catch (e) {
    return promise.error(e) }}


Promise.prototype.onError = function(predicate, f) {
  return promise.then( identity
                     , function(e) {
                         if (predicate(e))  return f(e)
                         else               throw e })}
{% endhighlight %}

Now people are forced to explicitly specify all the errors they're
interested in handling, thus it's much less likely that errors will go
by unnoticed:

{% highlight js linenos=table %}
function isQuotaError(a){ return a instanceof QuotaError }

var record = catchErrors(makeDbCall())
               .onError(isQuotaError, notifyQuotaError)

// You can do a similar thing with Promises/A+ if the implementation
// supports the equivalent of Q.done()
var record = makeDbCall()
               .onError(isQuotaError, notifyQuotaError)
               .done() // throw all the rest
{% endhighlight %}


### 3.2. Thenable assimilation

This particular {mis,}feature of Promises/A+ has been the subject of
several discussions, both in the Promises/A+ issues on Github and on the
es-discuss mailing list (for DOM Futures and ES promises). Long story
short: if any of your callbacks for the `then` method returns something
that has a `then` method, that object will be treated as a promise, and
assimilate the state of the old promise.

On the one side you have a huge increase in the implementation
complexity for this auto-lifting, on the other side you have to be
extra-careful about what kind of data you're passing in to a
Promise-accepting function — in other words, since JavaScript doesn't
have a type system, if you're using promises in it you have to keep a
type system in your head as you read your code.



## 4. Performance hits

So, big overview aside, let's get down to the part that matters in this
blog post: what about Promises/A+ performance? Well, I should say that
they're not that bad if your application is primarily asynchronous and
they'll also help you reduce the overall complexity and coupling of your
application, which is always a win.

To test Promises/A+ in particular I've set up three major scenarios. The
tests were ran on Node v0.10.2, v0.10.12 and v0.11.{0..3}. For Node
v0.11.2 a separate test was ran with the `--harmony-generators` flag so
I could check how
[TJ's library for semi-coroutines: Co](https://github.com/visionmedia/co)
performed against other alternatives. I wanted to get a few other
alternatives, like
[IcedCoffeeScript](http://maxtaco.github.io/coffee-script/),
ClojureScript's [core.async](https://github.com/clojure/core.async), and
Brian's
[fantasy-land (monadic) promises](https://github.com/puffnfresh/fantasy-promises),
which aren't executed asynchronously — but I wanted to continue hacking
on my lazy list implementation & property-based testing library, so...

At any rate, I might add those later on, I've set up a [Github repository
with the benchmarks](https://github.com/killdream/promises-benchmark),
so you can just try it out for yourself, or even contribute other
scenarios/libraries. Do note that by default the results of running the
benchmark are saved in a `bench.json` file at the root as a discrete
list of benchmarks over time, so you can analyse it later on, or test
the evolution of different libraries over time — that's how I generated
these graphics, by the way ;3

I've used plain Node-style callbacks as the baseline for the tests,
other contestants are: 

 - [Q@0.9.6](https://github.com/kriskowal/q)
  
 - [pinky@0.1.3](https://github.com/killdream/pinky)

 - [pinky's semi-synchronous branch@0.2.0](https://github.com/killdream/pinky/tree/sync-then) — not Promises/A+ compliant

 - [when.js@2.1.1](https://github.com/cujojs/when)

 - [deferred@0.6.5](https://github.com/medikoo/deferred) — not Promises/A+ compliant

 - [async@0.2.9](https://github.com/caolan/async)

 - [co@1.4.0](https://github.com/visionmedia/co)
  
The results in the graphs are from Node v0.11.2, which seems to have a
worse performance when using `setImmediate` compared to Node v0.10.2,
though I still have to investigate that. Also, do note that the
scenarios are quite complex, and all Promise implementations use generic
combinators. Thus, concluding that X is fast than Y is not the point
here, but rather looking at the relative trade-offs in a kind-of-real
scenario.

Do note that, at the time I ran the tests, `Co` only worked in Node
v0.11.2 with the `--harmony-generators` flag, since the generators API
changed a little in the v8 included in v0.11.3.


### 4.1. The worst case: serial computations

You've got a few operations that need to be done asynchronously, and
some that are fairly fast so might be done synchronous. The problem is
that to get to point B you first need to execute all of the previous
operations in order — IOW, you have serial code rather than concurrent
computations.

I've had to deal with it two times recently in the context of promises,
the first one was for a
[BDD test runner](https://github.com/brofistjs/brofist) I had to write
recently as an alternative to Mocha, since the latter has too many
special cases. The test runner uses promises all the way down, such that
people can write asynchronous tests easily. In this case performance is
largely irrelevant, however.

The second one is for a
[lazy list library](https://github.com/killdream/lazysex) inspired by
Haskell where I wanted to support asynchronous and synchronous values to
coexist. By representing all the values in the stream as lazy promises
of a certain value I could get both memoisation and a standard way of
grabbing values that was easily composable and abstractable. Since the
primary use of such library was for a
[property-based testing library](https://github.com/killdream/claire)
I'm working on, I could somewhat ignore a little performance hit, which
prompted me to write some benchmarks on promises and their alternatives.

For this scenario, I've ran two different cases. The first uses
heavy-weight asynchronous operations, where they're definitely the
bottleneck of the application. There's little variation in the
performance of each alternative in this case, but they diverge much more
as you add some noise to the list (no-ops). In the light-weight case the
difference between each alternative is greater.

Q and Pinky were consistently the slowest implementations, whereas When,
Deferred and the semi-synchronous branch of Pinky had a more reasonable
performance. Co's performance was fairly close to using raw callbacks,
and given that the Generators implementation in v8 is experimental, this
might change in the future — though I am not aware if there's any
optimisations planned for this case in particular.

Still, the penalty of using Promises/A+ in this scenario is fairly huge. If
we compare the fastest approach (`Callbacks: ~89 ops/sec`) with the
slowest one (`Q: ~32 ops/sec`), that gives us almost a 3x performance
penalty for a fully asynchronous scenario — the difference is even
greater as you have larger data sets with synchronous "noise" in
application (`85 ops/sec × 14 ops/sec`).

<div id="chart-worst-case-heavy-weight" style="height: 400px">&nbsp;</div>
<div id="chart-worst-case-light-weight" style="height: 400px">&nbsp;</div>


### 4.2. The best case: concurrent computations

Now, serial computations are horrible in a concurrent application
anyways, so let's see a better scenario: concurrent computations. In
this scenario, imagine you have to grab all data from some place and
asynchronously process all of them, though since no data depends on one
another you can just process everything at the same time.

This scenario is fairly common for web services, where you receive a
connection, then do some processing and send a response. This processing
might involve loading data from a file or querying the database. In
either case, you'll likely want to avoid doing work as much as you can,
so you'll probably aggressively.

The idea of this scenario is to start with a fully concurrent case (for
example, where you have to work with non-cacheable data, data that
changes too fast, etc), and progressively see the effects of each
approach as you start caching the computations. Again there's lots of
mixed synchronous computations here, since we deal with the best case
that's just grabbing it from a node's memory. But depending on your
computation and application architecture, you could be using something
like a key/store database as a cache server, so you'd have to pay the
price of asynchronously querying the database anyways.

It's unsurprising that there's absolutely no difference between
Promises/A+, Co or callbacks in a fully concurrent application. But the
differences start to show as you deal with cache hits. The more you can
grab the data back from the cache synchronously, the most performance
you lose from sticking with Promises/A+ — or rather, the least performance
you gain.

I should note that the caching here for the callback scenario is
implemented with the
[simplest-promises-implementation-that-could-possibly-work](https://github.com/killdream/promises-benchmark/blob/master/scenarios/parallel/utils.js#L5-L19),
so, yes, Promises can be fast, but Promises/A+ are particularly bound to
performance hits by the specification — everything must be resolved
asynchronously, etc.

<div id="chart-best-case" style="height: 400px">&nbsp;</div>


## 5. Conclusion

More abstractions are definitely a **nice thing**. They let you focus on
what matters, and leave the details to be figured out by someone else
(library or compiler). However, nice abstractions might be filled with
design problems from a performance or complexity point of view, and
Promises/A+ suffers from some of these.

Whether this would matter is something that depends entirely on which
application you're writing. In my case it does, I can't just put a
Promises/A+ implementation in a generic lazy list to support synchronous
and asynchronous values because then everyone loses — too many
performance penalties.

It's also interesting to note that, while you lose some performance from
the mandatory asynchronous resolution of Promises/A+, you get something
that's less prone to breaking in the JavaScript environment, when working with
larger dependency chains. Since JavaScript doesn't have
[Tail Call Optimisation](https://en.wikipedia.org/wiki/Tail_call), you
can easily run into a `Stack Overflow` error when applying
transformations — which was one of the reasons I didn't include Brian's
Fantasy Promises, despite it being straight-forward to do so.

Still, it's always nice to know the trade-offs of using something or
another with some data.

{% raw %}
<script type="text/javascript" src="https://www.google.com/jsapi"></script>
<script type="text/javascript">
// 
void function() {
  var g    = google
  var $    = document.querySelector.bind(document)

  
  g.load("visualization", "1", {packages:["corechart"]})
  g.setOnLoadCallback(function() {
    serialHeavyWeight()
    serialLightWeight()
    parallel()
  })

  function drawChart(where, options, data) {
    var chart = new g.visualization.LineChart(where)
    var table = g.visualization.arrayToDataTable(data)
    chart.draw(table, options) }


  function serialHeavyWeight() {
    drawChart( $('#chart-worst-case-heavy-weight')
             , { title: 'Serial (heavy weight)' }
             , [[" ","Co","Callbacks (baseline)","Async","Pinky","Pinky (synchronous)","Q","When","Deferred"],["no noise",32.519173604351,35.96972430155409,34.23811381114325,23.744542971504302,23.518421308371014,19.518709345108196,30.61805346380897,24.77546591634284],["some noise",27.575673299844333,36.236815894631874,34.590987622995904,22.567069885175588,28.89818014014961,20.00642532511564,37.57164412802995,34.576442422482714],["noisy",50.284494991384584,54.78038673568307,54.2099787146745,18.784028295107113,27.74607085071483,18.011338171149998,30.23438637069121,26.278709602130146],["mostly noise",34.59294117195647,36.80935167943721,35.43029272091939,12.727836448066581,19.32027357853607,11.570371975262237,23.985985012942926,24.532327708587545]])}
  
  function serialLightWeight() {
    drawChart( $('#chart-worst-case-light-weight')
             , { title: 'Serial (light weight)' }
             , [[" ","Co","Callbacks (baseline)","Async","Pinky","Pinky (synchronous)","Q","When","Deferred"],["no noise",57.7557973296999,88.6899512932491,81.5798178770351,33.352994338355536,55.50136348465255,31.84607189042393,52.95256156313721,64.24315846409094],["some noise",54.747458161549275,85.63924760682417,81.736353011638,28.76720052721058,50.97032824297314,25.178618840595824,49.5187854457161,61.56686433951277],["noisy",55.93551838675452,85.43082634026786,78.24291129218358,24.23705717788733,42.073233861531904,21.854828914912137,45.6172183741739,54.84475918704662],["mostly noise",61.93818997256397,85.4669843723255,78.53539112114193,16.2586423063676,28.857069384373336,13.99230589785452,35.861052243406334,40.40320526042508]])}

  function parallel() {
    drawChart( $('#chart-best-case')
             , { title: 'Concurrent' }
             , [[" ","Co","Callbacks (baseline)","Async","Pinky","Pinky (synchronous)","Q","When","Deferred"],["no cache",109.94617704627407,113.0451735288885,109.45421407193892,102.70239648621954,109.71059339456268,91.43610012975475,114.49082839449001,114.03679826671352],["small cache",117.2295582548977,134.65490641625044,113.02389453802718,105.27978486660851,118.50792704581539,94.34858438413413,117.96702316213924,114.94084026487191],["big cache",135.8560707076883,217.75419137151425,182.0133308589409,118.91262180544882,128.39892966032036,115.34699337243114,150.5069281031857,124.64553163556451],["fully cached",235.50753640995677,540.6447308810799,479.1049775458859,149.77892988216345,172.52857485048114,150.3645689675505,272.0039675503765,159.09271523149897]] )}

}()
</script>
{% endraw %}


Quil has murdered many Promises for Christmas. Unfortunately the universe just swallowed their deaths and no one ever noticed. You can contact her on [Twitter](https:/twitter.com/robotlolita) or [Email](mailto:queen@robotlolita.me).
{: .contact-footer}
