---
layout: post
title: "A Monad in Practicality: First-Class Failures"
snip:  How monads help you to deal with failures in a sane way
published: false
---

There are [plenty of tutorials][] [on what][] [monads are][] out there, some
times using fairly "interesting" (i.e.: weird) analogies. This is not one of
them. Instead, here I'll provide a walk through some practical use cases for
specific monadic structures in the JavaScript land. Stick with me!


[plenty of tutorials]: http://www.haskell.org/haskellwiki/Monad_tutorials_timeline
[on what]: http://learnyouahaskell.com/a-fistful-of-monads
[monads are]: http://channel9.msdn.com/Shows/Going+Deep/Brian-Beckman-Dont-fear-the-Monads


## Table of Contents

 1. [Introduction](#1_introduction)
 2. [Modelling Errors](#2_modelling_errors)
    1. [Maybe Things Don't Work](#21_maybe_things_dont_work)
    2. [Interlude: chain](#22_interlude_chain)
    3. [You Either Succeed, or You Fail](#23_you_either_succeed_or_you_fail)
    4. [Sometimes You Fail More Than Once](#24_sometimes_you_fail_more_than_once)
 3. [Composing Computations](#3_composing_computations)
 4. [Abstracting Computations](#4_abstracting_computations)
 5. [Conclusion](#5_conclusion)
 6. [References and Additional Reading](#6_references_and_additional_reading)


## 1. Introduction

Failures are difficult, yet our applications tend to fail more than we would
want them to. More so, failures in the presence of side-effects are specially
dangerous, because we need to somehow revert the changes we've applied, but
before we do that we need to **know how much of the changes got applied, and
what the correct state should be**. The usual solution for impure failures is
to use exceptions, JavaScript handles this through the `try ... catch`
statement and `Error` objects, similar to other mainstream programming
languages, like Java, Python and Ruby.

While I will not argue that exceptions don't have their place (all the more
because my reading on the subject is somewhat lacking), most of the common uses
of them in mainstream programming has a handful of problems:

#### Non locality

when you throw an exception, you leave the local stack and environment, and
ends up God-knows-where. Maybe the recovering site will be able to handle the
failure, maybe it won't. In the latter case, your program will be running in an
inconsistent state and as long as it continues to do so, bad things can happen.

Consider the case where you fail to handle a failure to connect with the
database due to a temporary network failure, but the recover site happens to
swallow the error/or is not able to react in a sensible manner. Your
application goes up, and all data every user tries to save in your website is
silently moved over to `/dev/null`.
    
    
#### Lack of compositionality

we want to compose computations to cut down
the complexity of the application, but exceptions limit the amount of
compositionality we can achieve. This happens because throwing and
recovering from exceptions is a second-class construct, thus we need to
write call-site specific code to compose computations that use such
mechanisms.


#### Impaired reasoning

With side-effects, non-local exceptions and
recovering, our code ends up with a contrived flow which is difficult to
follow, since now a small piece of code may affect several places,
depending on how the exceptions are handled up the call chain.


#### Ad-hoc pattern matching galore

Due to the issue of non-locality, to properly control and recover from
side-effectful exceptions, one needs to model all possible kinds of failure as
specific sub-classes of the `Error` object, then re-throw all of the exceptions
that don't match a specific subclass in the recovering site. In JavaScript,
there are three main problems with this approach: first one, most people don't
ever use specific subclasses of `Error`, thus you would have to **PATTERN MATCH
WITH REGULAR EXPRESSIONS ON NATURAL LANGUAGE, INITIALLY WRITTEN FOR THE (HUMAN)
DEVELOPER** in order to achieve this; it leads to an unnecessary amount of
code-bloat; and all cases of failure need to be shared with all code (Instead
of being local to a specific failure).
    

#### What about monads, then?
    
Monads solve all of these problems, so they are a good fit for modelling
failures that **can be recovered from**, in some way, programmatically. There's
no way to recover from a dead HDD, for example, thus your program should just
fail as fast as possible in these cases — throwing exceptions here is
great.

This article describes how the [Maybe][], [Either][] and [Validation][] monads
provide the necessary framework for modelling these kinds of computations and,
more importantly, composing and abstracting over them, without impairing
reasoning about the code. To do so, we use objects that follow the laws of
algebraic structures defined in the [Fantasy Land][] specification for
JavaScript.


[Maybe]: https://github.com/folktale/monads.maybe
[Either]: https://github.com/folktale/monads.either
[Validation]: https://github.com/folktale/monads.validation
[Fantasy Land]: https://github.com/fantasyland/fantasy-land

## 2. Modelling Errors

Some computations might not be able to give you a response, but in most
programming languages we still regard them as a computation where you provide
some values, and get a new value back. The thing is: what happens when the
computation can't provide the value? You don't know, unless you read the
documentation or source code for that particular functionality.

Some monads allow one to make this kind of effect (*potential failure*)
explicit, thus you're always forced to acknowledge that things might go wrong
when using the function. While this might sound like too much work at first, we
should initially consider that just making the effects of a computation
explicit we gain astounding clarity about the code we're reading — suddenly,
the contracts of what a function may do are expressed in the code, rather than
on the documentation. The code can't get out of sync with itself!

None the less, since monads are a kind of structure that follows a standard
representation and laws, we can easily write functions to abstract over any
kind of monad — just as you could write a generic function that works in any
kind of collection. This allows one to abstract over computations, avoiding the
issue of repeating yourself over and over and over again.


### 2.1. Maybe Things Don't Work

The simplest case of potential failure is a computation that may say: “Yes, I
have a result and this is the result,” or “I am sorry, but I don't have a
result.” This effect is usually handled implicitly in major programming
languages by returning something like `Null`, but of course
[this comes with its own well-known problems](http://www.infoq.com/presentations/Null-References-The-Billion-Dollar-Mistake-Tony-Hoare),
but we can easily capture the effect using the [Maybe][] monad, without the
problems associated with null references!

Let's consider a simple case: I want to extract the first item of a
sequence. The problem is that sequence might not have any items, in which case
it would not make sense for the operation to return any value. In JavaScript,
if you use `sequence[0]` you're always going to get `undefined` if the item
doesn't exist. The problem is that the list *can also contain `undefined`*.

Furthermore, I want to combine the results of this operation from two different
sequences, and some of these sequences might have no elements. A naïve approach
would be to just extract the first element and use the concatenation operator:

{% highlight js %}
// Array(a) -> undefined | a
function first(sequence) {
  return sequence[0]
}

var consonants = 'bcd'
var vowels     = 'aei'
var nothing    = []

firstConsonant = first(consonants)
firstVowel     = first(vowels)
firstNothing   = first(nothing)

combination1 = firstVowel + firstConsonant // 'ab', yey!
combination2 = firstVowel + firstNothing   // 'aundefined', eugh!
{% endhighlight %}

Okay, so the naïve approach does not work, because the sequence may have no
items, so we need to check if we've got an answer before concatenating things
(let's disregard the fact that concatenating a string with something
non-existent should have been a type error for now):

{% highlight js %}
if (firstVowel !== undefined && firstConsonant !== undefined) {
  combination1 = firstVowel + firstConsonant // 'ab', yey!
}

if (firstVowel !== undefined && firstNothing !== undefined) {
  combination2 = firstVowel + firstNothing // never happens
}
{% endhighlight %}

Okay, so now we have our code working greatly, but just look at how many checks
we had to do just in order to combine two things! Let's try modelling our
operation in terms of the Maybe monad and see if we can get rid of all this
cruft:

{% highlight js %}
// Array(a) -> Maybe(a)
function first(sequence) {
  return sequence.length > 0?  Maybe.Just(sequence[0])
  :      /* otherwise */       Maybe.Nothing()
}
{% endhighlight %}

Now, for any sequence that we feed into the `first` function, we may either get
an answer, or we may get no answer, and this is reflected on what we return
from the function. We've made the effects (the potential failure) of this
function explicit, but in doing so we've increased the amount of code we had to
write slightly. Sadly, not only this, but our original code for combining
things don't work anymore!

{% highlight js %}
var consonants = 'bcd'
var vowels     = 'aei'
var nothing    = []

firstConsonant = first(consonants)
firstVowel     = first(vowel)
firstNothing   = first(nothing)

firstVowel + firstNothing   // doesn't make sense
firstVowel + firstConsonant // doesn't give you 'ab'
{% endhighlight %}

We can't really combine an answer with something that has no answer. It doesn't
make sense. Likewise, we can't straightforwardly combine `firstNumber` and
`firstLetter`, because the addition operator doesn't know how to handle a
`Maybe` monad. Not being able to combine straight-forwardly an answer with
something that doesn't exist is a good idea, for the second case, we would of
course like to have an operator that can work with maybes. Luckily, since
monads are first-class values, we can!

{% highlight js %}
// Monad(a), Monad(a) -> Monad(a)
function concatenate(monadA, monadB) {
  monadA.chain(function(valueA) {
    monadB.chain(function(valueB) {
      return monadB.of(valueA + valueB)
    })
  })
}
{% endhighlight %}

And finally, we can use the `concatenate` operation instead of the `+`
operator:

{% highlight js %}
combination1 = concatenate(firstVowel, firstNothing)   // stays Nothing
combination2 = concatenate(firstVowel, firstConsonant) // Just('ab')
{% endhighlight %}

Great, our code is terse again, and we didn't even have to do anything to
propagate the failures when it doesn't make sense to combine two things! Sounds
like the right path to be on.


### 2.2. Interlude: `chain`-ing monads

You might have realised we used two methods on the monad objects in the
previous section, which I have not explained: `chain` and `of`. These are the
two operations that all monads must implement to be considered a monad. More
so, these operations need to follow a few algebraic laws to ensure that all
monads can be composed without any edge case, or inconsistent behaviour!

Before I talk about the [Either][] monad, it helps to keep in mind that monads
are things that contain values, and have one operation to manipulate some
values of the monad (`chain`), and an operation to put values into a monad
(`of`). These are the only two (low level) ways we can interact with the
values, and what they do is highly dependent on the specific monad, we can
*never* interact with the values in a monad directly, because that would break
the laws, however we can easily write any sort of high-level construct to
manipulate the values just using these two functions.

Consider, for example, our concatenate operation. We've used `chain` twice, and
in the second case, we used the `of` method to return a monad of the same type
to the `chain` operation — `chain` always expects you to return a monad, but in
the second case, we're just transforming the value inside of the `monadB` monad
and putting it back there. It might remind you of an operation you should be
familiar with, but maybe hasn't applied it to monads yet: `Array.map`. We could
have abstracted this:

{% highlight js %}
// Monad(a), (a -> b) -> Monad(b)
function map(monad, transformation) {
  return monad.chain(function(value) {
    return monad.of(transformation(value))
  })
}

// Monad(a), Monad(a) -> Monad(a)
function concatenate(monadA, monadB) {
  return monadA.chain(function(valueA) {
    return map(monadB, function(valueB) {
      return valueA + valueB
    })
  })
}
{% endhighlight %}

We could even abstract it further by realising that we just want a monad with
the value computed from the value of two monads,
[a fairly common operation](https://github.com/fantasyland/fantasy-sorcery/blob/master/index.js#L47-L54)
that's called `lift2`:

{% highlight js %}
// Monad(a), Monad(b), (a, b -> Monad(c)) -> Monad(c)
function lift2(monadA, monadB, transformation) {
  return monadA.chain(function(valueA) {
    return map(monadB, function(valueB) {
      return transformation(valueA, valueB)
    })
  })
}

// Monad(a), Monad(a) -> Monad(a)
function concatenate(monadA, monadB) {
  return lift2(monadA, monadB, function(valueA, valueB) {
    return valueA + valueB
  })
}
{% endhighlight %}



### 2.3. You Either Succeed, or You Fail

While the `Maybe` monad is awesome for the simple cases, like “we want to
find an item in a list, but it might not be there,” “we want to get the value
associated with a key, but the key might not be there,” “we want to read a
file, but the file might not be there.” It doesn't really get us much farther
than the “it might not be there” kind of failure.

Sometimes our failures might be a little more complex, they might require a
little bit more of information to the developer, they might even encompass
several different types of failures! We just can't model these kinds of
computations with the `Maybe` monad because the failure case doesn't accept any
additional information.

We clearly need a new monad for this: meet `Either`, the monad that can model a
success and its associated value, or a failure and its associated value! And
the best of all, since `Either` is a monad, we can seamlessly compose values
using `Either` with the functions we've defined before for the `Maybe` monad.

To see how the `Either` monad can be useful, let's consider the following
scenario: I want to read a couple of files, but I am not sure if the files
exist in the computer. Furthermore, there can be some situations where the user
doesn't have access to a particular file. One would want to model things in a
way that such failures are different, and you can react accordingly, if needed.

{% highlight js %}
var Fail  = Either.Left
var Right = Either.Right

// here we're relying on some hypothetical functions,
// but their meaning should be clear from the names.

// String -> Either([String, Error], String)
function read(path) {
  return !fs.exists(path)?   Fail(['inexistent'
                                  , new Error(path + ' does not exist')])
  :      !fs.canRead(path)?  Fail(['access'
                                  , new Error('No read access for ' + path)])
  :      /* otherwise */     Right(fs.readFile(path))
}
{% endhighlight %}

Now, we can use our previously defined functions to combine files:

{% highlight js %}
var text = lift2(read('intro.txt'), read('outro.txt'))
{% endhighlight %}

Terse and safe! If we fail to read any of the two files, the failure associated
with that is automatically propagated. In fact, if we fail to read the first
file, we're not even going to *bother* trying to read the second one. This is
usually a good idea, and makes monads a good candidate for sequencing actions
that might fail.

Suppose now that we want to read all of the files in a directory and display
the ones that contain a certain word to the user.  If we fail to complete this
task, we would like to tell the user (and developer) why the computation failed
as well.

{% highlight js %}
// String -> Either([String, Error], Array(String))
function readAll(path) {
  return fs.list(path).reduce(function(monadA, filename) {
    return zip2M(monadA, read(path + '/' + filename))
  }, Right([]))
}

// Monad(a), Monad(b) -> Monad([a, b])
function zip2M(monadA, monadB) {
  return lift2M(monadA, monadB, function(valuesA, valueB) {
    return valuesA.concat([valueB])
  })
}
{% endhighlight %}

Now that we have a function that will give us a list of the contents of all
files in a directory (or a failure), we can move on to the functionality we
need. First, we need to make sure the list only contains the contents that
contain a certain word:

{% highlight js %}
// String, Monad(Array(String)) -> Monad(Array(String))
function filterContainingWord(word, monadTexts) {
  return map(monadTexts, function(texts) {
    return monadTexts.filter(function(text) {
      return text.indexOf(word) != -1
    })
  })
}
{% endhighlight %}

And finally, we need to retrieve the contents to display them to the user:

{% highlight js %}
filterContainingWord('monad', readAll('~/texts')).chain(function(texts) {
  displayToTheUser(texts.join('\n---\n'))
  return Right()
})
{% endhighlight %}


### 2.4. Interlude: Recovering From Failures

The attentive reader would have noted that no errors were handled in the
previous section, even though the scenario required us to display an error
message to the user. There's a reason this: as you might have noticed from the
type for the `Monad` defines that they contain a thing of type `a`, and they
pass this thing of type `a` over to the continuation fed to the `chain`
method. The problem with the `Either` monad is that it has an `a` and a `b`!

We could solve this problem in two ways: both values could be projected into
the `chain` method, wrapped in a tuple (a static list containing two elements),
and the function would have to deal with both values. This would disallow us
from using the `concatenate` function we defined for the `Maybe` monad,
however, since that function expects to combine two things `a`, not a tuple of
`a` and `b`.

Then there's the approach that people usually use when implementing the
`Either` monad: project only the successful values. This bias does pose a
problem in our case because there are no rules for how to work with the value
we did not project in the monad, so if we want to recover from failures we'll
need new operations that are not monadic.

> My
> [Either](https://github.com/folktale/monads.either/blob/master/src/index.ls#L177-L212)
> monad implementation, which is heavily based on
> [Scalaz's Disjunction](https://github.com/scalaz/scalaz/blob/scalaz-seven/core/src/main/scala/scalaz/Either.scala#L194-L198)
> provides an `orElse` function, which works similarly to the `chain` method,
> but projects the value of the failure, and keeps the successful
> values. [Fantasy Land's Either](https://github.com/fantasyland/fantasy-eithers/blob/master/either.js#L15-L34)
> expects you to either use a [catamorphism][] or swap the values and project
> with the `chain` method. Haskell expects you to pattern match on the
> algebraic data types if you want to handle the failures. And so on, and so
> forth. You should assume that anything that isn't on the Fantasy Land
> specification refers to my monad implementations.

[catamorphism]: http://en.wikipedia.org/wiki/Catamorphism

A way to display the errors to the user would then involve using one of the
library-defined methods to deal with the other failure case:

{% highlight js %}
filterContainingWord('monad', readAll('~/texts')).chain(function(texts) {
  displayToTheUser(texts.join('\n---\n'))
  return Right()
}).orElse(function(error) {
  if (DEBUG === true) {
    throw error[1]
  } else {
    else displayToTheUser(error[1].message)
  }
  return Fail(error)
})
{% endhighlight %}


### 2.3. Sometimes You Fail More Than Once

One of the problems with sequencing operations with the monadic `chain`
operation is that, as we've seen with the `Either` monad, they're a fail-fast
path, which means that the whole sequence of actions is abruptly finished with
a failure in case any of the actions fail. Sometimes, however, you don't want
to sequence things in this fashion, but rather aggregate all of the failures
and propagate them. A common use case for this is validating inputs, which is
why our next monad is the `Validation` monad.

A `Validation` monad is almost exactly the same as the `Either` monad, with two
differences: it has a vocabulary aimed towards error handling, `Success` and
`Failure`, rather than the generalised disjunction tags `Left` and `Right` in
the `Either` monad; and it can aggregate and propagate all of the failures
through the `Applicative Functor` interface.




## 3. Composing Computations

## 4. Abstracting Computations

## 5. Conclusion

## 6. References and Additional Reading
