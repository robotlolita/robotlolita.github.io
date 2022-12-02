---
layout: article
title:  "OOP is great: Multi-methods"
---

> This is the first article in the "OOP is great" series, where we look at some of the features in OOPLs that I've adopted in Crochet, and what makes them great. Much of it might go against what you believe about OOP if you're only familiar with languages like Java or C#.

I have previously written a [not so short article](https://robotlolita.me/diary/2022/06/when-is-oop-not-great/) on some very unfortunate things about OOP, both as a programming philosophy and an umbrella description for features, that I've found during the years I spent researching programming languages.

This series will instead look into the *positive* things I've found during that time, and how these things shaped Crochet into what it is today. Features are neither "good" nor "bad" in isolation—I don't think that kind of judgement is useful. So this series will look into these features in the context of Crochet, with a bit of more general reasoning here and there. Just keep that in mind.

This time we'll look into Multi-methods: sets of functions that are selected based on more than one of its arguments. Though it hasn't been adopted by many mainstream languages, you might have seen it in [Julia](https://docs.julialang.org/en/v1/manual/methods/) and [Clojure](https://clojure.org/reference/multimethods). They also appear in languages that are less popular, but feel "closer" to what most people think about when they hear "OOP", like [Slate](https://github.com/briantrice/slate-language), [Dylan](https://opendylan.org/) and [Cecil](https://en.wikipedia.org/wiki/Cecil_(programming_language)).

Cecil's implementation of this concept, in particular, is a huge inspiration for Crochet, and we'll discuss more about it further down.

<!--more-->


## What are methods?

Most programming languages have the concept of a "function". Some entity that has partial behaviour, but for which you can "plug" the missing parts afterwards. In that way, these behaviours are reusable for different such "parts".

For example, we know that twice the value of 2 is 4. We could capture this knowledge as such:

```js
const twice_of_two = 4;
```

But surely we may also want to know what twice of 3 is. And what twice of 4 is. And what twice of 5 is. And surely we could go on just listing each of these individual examples for ever. Still, there's a pattern here: we're always talking about twice of *something*, and that "something" is the only thing that varies. A function allows us to capture such notion:

```js
function twice(Something) {
  return Something * 2;
}
```

Here the expression `Something * 2` does not make any sense on its own; we don't know what `Something` is. When we define the function `twice` we also define the meaning of `Something` as whatever the user of `twice` decides to plug there. This makes `Something` a "parameter" of the `twice` function.

We can get the same behaviour we had before listing the twice of things exhaustively by, instead, spelling `twice(3)` and relying on the idea of multiplication, that both us and the computer already know. So `twice(2)` is still 4. `twice(3)` is still 6. And `twice(4)` is still 8. We just no longer need to spell out that association directly.

However, there's one problem with functions. So far we can plug numbers in our little `twice` function and everything works perfectly fine, because multiplication over numbers is a well-defined and already shared concept. But what if we wanted to invent a new concept? What if we wanted `twice("hey")` to be a thing?

Well, right now, if we simply spell out `twice("hey")` the system cannot make sense of such phrasing, as it's the same as `"hey" * 2`. What *should* happen if you multiply a text by 2? Should that be a concept at all? Is that what we want to achieve by this?

Okay, perhaps we first ought to decide what we want to mean by `twice("hey")`, just like we first defined what we wanted to mean by `twice(2)`. Let's write some examples:

```js
const twice_of_hey = "heyhey";
const twice_of_bye = "byebye";
```

Alright, so now we have a sense of what `twice(SomeText)` ought to mean. We want to have the text repeated two times. We want to see the same text twice. Now, arithmetic multiplication does not provide such affordance, and it feels odd to write `"hey" * 2` anyhow—even if we make it work somehow, it'll just make readers of this phrase as confused as we first were.

At some point in the past, Smalltalk designers asked the question of ["Why must we limit operations to a single shape?"](http://worrydream.com/EarlyHistoryOfSmalltalk/#p17). Why must `*` or `twice` have a meaning only for numbers? Thus, they came up with the idea of leaving the meaning of `*` or `twice` up to its arguments: the idea of "objects" that "receive messages" to "do things".

In essence, this meant that we must have different definitions of `twice` to cover all its possible meanings:

```js
function twice(Something: an integer) {
  return Something * 2;
}

function twice(Something: a piece of text) {
  return concatenate_text(Something, Something);
}
```

Now if we spell out `twice(2)` we're referring to the first definition of `twice`, for `2` is an integer. But `twice("hey")` refers to the second definition of `twice`, for `"hey"` is a piece of text. They have the same name, but they mean very different things. Words sometimes do that in English as well.

Of course, most object-oriented languages that went to adopt this idea, which they called "methods", decided to have a different way of expressing such:

```js
function <Something: an integer>.twice() {
  return Something * 2;
}

function <Something: a piece of text>.twice() {
  return concatenate_text(Something, Something);
}
```

With the phrasing changing to `(2).twice()` and `"hey".twice()` respectively. But the inner workings and the way to reason about these remains the same, regardless of how languages choose to express them in writing.


## Side note: Type Classes and friends

You might find that the idea of [Type Classes in Haskell](https://www.haskell.org/tutorial/classes.html), [Protocols in Elixir](https://elixir-lang.org/getting-started/protocols.html), or [Traits in Rust](https://doc.rust-lang.org/book/ch10-02-traits.html) shares some similarities with the idea of methods. That's because, fundamentally, there's one thing that underlies them: the idea of "dispatch".

Essentially, all of these ideas allow you to have a single name potentially refer to many different kinds of operations. And then a way of "selecting" which operation to use based on its argument. We could have likewise defined this in pseudo-Haskell:

```hs
class Twice a where
  twice a :: a -> a

instance Twice <an integer> where
  twice Something = Something * 2

instance Twice <a piece of text> where
  twice Something = concatenate_text Something Something
```

It's still roughly the same thing, just allowing us to have multiple `twice` definitions going around, but with a different way of phrasing that. There *are* some other implications here around execution phase and language terms that we'll not get into details in this article. It's not the point here to categorise any of these expressions as "OOP" or not "OOP", so it doesn't matter.


## Methods vs. "Multi"-methods

Okay, so methods are a concept that allows you to select an operation based on what values you're plugging into it, as arguments. But most OOP languages you see around only allow this for *one* of the things you plug in the method. This doesn't matter in the `twice` example we've seen because it only has one parameter anyway.

But what about `*`? For example, it might be interesting to allow one to express things like `Matrix * 2`, where each element of a mathematical matrix is multiplied by 2. Indeed, you can find this exact kind of operation in array-oriented languages like [APL](https://en.wikipedia.org/wiki/APL_(programming_language)).

But this is where our problems start. If we follow what we've done so far we'll end up with this:

```js
function <This: an integer> *(That) {
  return integer_multiply(This, That);
}

function <This: a matrix> *(That) {
  const result = allocate_matrix(matrix_size(This));
  for (let index = 0 until matrix_size(This)) {
    result[index] = integer_multiply(This[index], That);
  }
  return result;
}
```

Now, `2 * 2` gives us back `4`, as expected. And `[1, 2, 3] * 2` gives us back `[2, 4, 6]`, as we also expected. The problem is that `[1, 2, 3] * [4, 5, 6]` does not have any meaning from the definitions we wrote, but, since it's only the first argument that is "special", it'll select the second definition of `*` and run it anyway.

Now, of course, we can account for this and make sure that `That` in that operation truly is an integer:

```js
function <This: a matrix> *(That) {
  if (typeof That !== "an integer") {
    throw new TypeError("Expected an integer");
  }

  const result = allocate_matrix(matrix_size(This));
  for (let index = 0 until matrix_size(This)) {
    result[index] = integer_multiply(This[index], That);
  }
  return result;
}
```

This way `*` will at least give us a better error message when we try spelling out the unsupported concept of multiplying a matrix by another matrix. But what if... what if we wanted to do that later? What if we wanted matrix multiplication to be a thing, too?

I mean, we can just edit that definition of `*` again, like we've done before, but using a conditional to select the behaviour this time:

```js
function <This: a matrix> *(That) {
  if (typeof That === "an integer") {
    const result = allocate_matrix(matrix_size(This));
    for (let index = 0 until matrix_size(This)) {
      result[index] = integer_multiply(This[index], That);
    }
    return result;
  } else if (typeof That === "a matrix") {
    // very complicated matrix multiplication goes here, probs
  } else {
    throw new TypeError("Expected an integer or a matrix");
  }
}
```

`*` can now handle this additional case, but in the process we've lost something important: the consistency of how to extend the meaning of words. Now if we want a word to have multiple meanings we need to figure out if that meaning is defined by the first argument, in which case we add a new definition and let the language's dispatch rules give us the right behaviour. Or if the meaning is decided by the second argument (or third, or fourth, or...), in which case we modify an existing definition and add our own little dispatch logic in that definition.

That runs into other problems, too: we now must have access to all source code, and we might have to modify code that isn't even authored or controlled by us (e.g.: code from a dependency, where we wish to add new behaviours), and there's no clear way of how to document these little custom dispatch logic scattered all around—one can't even be sure they'll do the same thing in two different functions!

Multi-methods solve all of these problems by, instead, getting rid of the "only the first argument is special" restriction. What if all arguments were considered in order to select one of the operations? Well, that would give us this instead:

```js
function <This: an integer> * <That: an integer> { ... }
function <This: a matrix> * <That: an integer> { ... }
function <This: a matrix> * <That: a matrix> { ... }
```

And just like that we can now teach the language how to select the correct operation based on more than one of the arguments. That's really all there is to multi-methods, as far as the concept goes.


## Multi-methods in Crochet

The remaining of this article will use [Crochet's semantics and syntax](https://crochet.qteati.me/docs/reference/system/commands/dispatch.html). In Crochet a multi-method is called a "command". Commands are written with postfix, infix, and mix-fix syntax. That is, our `twice` example could be written as follows:

```
command (Something is integer) twice = Something * 2;
command (Something is text) twice = Something ++ Something;
```

That's used as `2 twice` and `"hey" twice`, respectively.

Something like `*` could be written as follows:

```
command (This is integer) * (That is integer) = ...;
command (This is matrix) * (That is integer) = ...;
command (This is matrix) * (That is matrix) = ...;
```

That's used as `2 * 2`, `[1, 2, 3] * 2`, and `[1, 2, 3] * [4, 5, 6]`, respectively.

And something like "the greater of X and Y" could be written as follows:

```
command greater-of: (X is integer) and: (Y is integer) = ...;
```

That's used as `greater-of: 1 and: 2`.

Crochet tries to keep the syntax for declaring a command and the syntax for using a command as close as possible. Parameter definitions, such as `X is integer`, are called [requirements](https://crochet.qteati.me/docs/reference/system/commands/signatures.html). That's because we're telling the language what is required for that command to be considered at all when we see an expression such as `greater-of: X and: Y`, or `A * B`. 


## The ambiguous nature of multi-dispatch

One may ask, "If multi-methods are so good, why aren't they adopted by more languages?". And this is where context matters: multi-methods allow you to support extension *even if* someone has not designed their code for that, but on the other hand you have to contend with the possibility of code being ambiguous at runtime.

It's a trade-off, and many languages choose to have more restricted dispatch to avoid ambiguity instead. Crochet cannot make that choice because one of its core design goals is to be a language for non-professional programmers, used to build things that can be remixed and reused even if not designed for that, so instead it has to accept the possibility of ambiguity and mitigate that instead.

Anyway! How does ambiguity arise in multi-methods? Consider:

```
command (A is number) * (B is number) = ...;
command (A is integer) * (B is integer) = ...;
```

An integer is a more specialised version of a number; that is, a number can be fractional or integral. An integral number can be an integer or a sized integer (e.g.: `integer-32bit`). But nonetheless we have an ambiguous command: both the first and second commands are perfectly valid for handling an expression such as `1 * 2`.

Crochet (and many other languages using multi-methods based on type hierarchies) [uses specialisation to disambiguate this dispatch](https://crochet.qteati.me/docs/reference/system/commands/dispatch.html#the-selection-algorithm). That is, if two or more commands could be used for an expression, then the one selected is the most specific one. Crochet ranks all possible commands, and picks the one where the required types are closest (most specific) to the concrete types of the arguments. So, in the case above, `1 * 2` would select the second command, because `integer` is closer than `number`. But `1.0 * 2.0` would select the first command, because `number` is the closest on we've defined to `float-64bit`.

But just making disambiguation based on how close things are doesn't solve all problems. For example, consider:

```
command (A is number) * (B is integer) = ...;
command (A is integer) * (B is number) = ...;
```

Now both commands are equally "close" to `1 * 2`. They each have one `number` requirement and one `integer` requirement. They both match the expression. They're both equally suitable candidates. For this one most multi-method languages will tell you this definition is ambiguous and will refuse to run your program until you disambiguate them manually.

For Crochet this is a big problem: the definition that conflicts might be in a dependency! It might not have been written by you, you might not even be aware that it was a thing. And it might have completely different behaviour from what you intended! But just telling users please edit the definitions and fix them is a terrible idea in Crochet [because of how it handles security through capabilities and strong trust boundaries](https://robotlolita.me/diary/2021/04/why-crochet-is-oop/). So, instead, Crochet disambiguates by sorting parameters from left to right. Leftmost parameters have higher weight than rightmost parameters, and Crochet uses that to disambiguate the dispatch.


## How to dispatch?

We've talked about how multi-methods allow us to select between different implementations of a function based on their arguments, but we haven't discussed how this selection is done at all.

It turns out there are many ways of going about it. [Julia](https://julialang.org/) takes the classic method of defining a type hierarchy, and then using that hierarchy to do the selection. This is similar to Crochet's basic dispatch, so likewise Julia uses this hierarchy to disambiguate, which means that requirements closer to the arguments will win when ranking the possible matches.

A very different way to approach this is the way [Clojure](https://clojure.org/reference/multimethods) does multi-methods. In Clojure, when you define a multi-method you also define your own dispatch function. The return value of your dispatch function is then used to select one of the possible implementations. This is a simple, but nice way of addressing many of the problems with multi-methods, but also requires you to be in control of all definitions. Here's `*` written in Clojure:

```clj
(defmulti multiply
  (fn [X, Y]
    (cond
      (and (integer? X) (integer? Y)) [::int, ::int]
      (and (list? X) (integer? Y))    [::matrix, ::int]
      (and (list? X) (list? Y))       [::matrix, ::matrix]
      true                            ::unknown
      )))

(defmethod multiply [::int, ::int] [X, Y] ...)
(defmethod multiply [::matrix, ::int] [X, Y] ...)
(defmethod multiply [::matrix, ::matrix] [X, Y] ...)
```

Indeed, the way Clojure does this can be linked to Michael D. Ernst, Craig S. Kaplan, and Craig Chambers' work on [Predicate dispatching in Cecil](https://homes.cs.washington.edu/~mernst/pubs/dispatching-ecoop98-abstract.html). Where Clojure uses arbitrary code to define the dispatch rules, however, Cecil uses a more restricted logical language—and this allows Cecil's dispatch to be optimised by a compiler as well, and thus used more broadly.

It is Cecil's work that underlies the design of the new VM for Crochet-related languages: Meow. And, being a VM, Meow's implementation of multi-dispatch also makes it easier to see all of the pieces independently (which in turn makes my work of doing compiler specialisation and inlining a lot easier, too). Here's multiply in Meow's [CEK-based](https://en.wikipedia.org/wiki/CEK_Machine) IR (which we don't expect anyone to write by hand):

```
.define-type @number;
.define-type @integer extends @number;
.define-type @matrix;

.define-method @multiply/2 {
  .match-type 0 {
    @integer {
      .match-type 1 {
        @integer {
          .select-function @multiply-integers;
        }
      }
    }

    @matrix {
      .match-type 1 {
        @integer {
          .select-function @multiply-matrix-and-integer;
        }

        @matrix {
          .select-function @multiply-matrix;
        }
      }
    }
  }
}

.define-function @multiply-integers/2 {
  let X0 = %load-parameter(0) in
  let X1 = %type-unwrap(X0, @integer in
  let Y0 = %load-parameter(1) in
  let Y1 = %type-unwrap(Y1, @integer in
  let R0 = %integer-multiply(X1, Y1) in
  let R1 = %type-wrap(R0, @integer) in
  %return R1
}

.define-function @multiply-matrix-and-integer/2 {
  ...
}

.defune-function @multiply-matrix/2 {
  ...
}
```

One particularly challenging thing with type-based dispatch that predicate dispatching allows dealing with in a very consistent manner is the idea of "exact dispatch" or "invariant dispatch". Crochet does have a type hierarchy, but types have no field inheritance. That is, if you define:

```
type rectangle(width is integer, height is integer);
type square(side is integer) is rectangle;
```

Then `new square(2) is rectangle` will be true, but `new square(2).width` will halt the VM, because there's no field `width` in `square`. Crochet solves this by allowing commands to be defined with exact dispatch. That is:

```
command (X is exactly rectangle) width = X.width;
command (X is exactly rectangle) height = X.height;

command (X is exactly square) side = X.side;
```

With this `new square(2) width` still isn't accepted by the VM, because the `_ width` command is only defined for values that are of the exact type `rectangle`, ignoring any concept of type hierarchy. But this gives us enough to then go on and define:

```
command (X is square) width = X side;
command (X is square) height = X side;
```

And with this the commands need not be tied to the internal memory representation of these objects anymore, but commands that *do* depend on internal memory representations can be defined safely (and overriden when needed).

Predicate dispatching can, of course, do more than that, depending on what predicates you provide your users with. Crochet's idea of this is to keep the predicates restricted and make use of something similar to [Wadler's idea of Views](https://www.cs.tufts.edu/~nr/cs257/archive/phil-wadler/views.pdf) instead, which is in line with what Cecil's paper describes, and works a lot better with Crochet's more restricted security approach, which eschews reflection entirely.

The intersection of predicate dispatch and abstraction-preserving perspectives of values makes this a very powerful feature to stand at the core of a security-oriented language, particularly because it makes the *experience/usability* of restricting values and enforcing such restrictions throughout the program a lot more tractable. Particularly when combined with a form of [object-capability security](https://en.wikipedia.org/wiki/Object-capability_model).

Or, well, that's at least what I'm banking on in Crochet right now after a few years of experiments. So far it has been working very well for the language.

- - -

## More on this

That's all on the side of Crochet. I'll hopefully not take 6 months to write the next article on this series, but you never know~

Anyway, if you're interested in diving deeper in the subjects I've touched upon in this article, here are some links to get you started:

- [The Early History of Smalltalk](http://worrydream.com/EarlyHistoryOfSmalltalk/)
  --- *Alan C. Kay*<br>
  Multi-methods build on top of methods, and methods build on top of early ideas of messaging. Kay's writing of this history is very interesting to be able to situate how things got here.

- [Predicate Dispatching: A unified theory of dispatch](https://homes.cs.washington.edu/~mernst/pubs/dispatching-ecoop98-abstract.html)
  --- *Michael D. Ernst, Craig S. Kaplan, and Craig Chambers*<br>
  Predicate dispatch in Cecil is a generalisation of previous ideas of dispatch that allows it to not be tied to type hierarchies. In the paper they define a small language for dispatch that can be optimised by compilers, and also touch on more restricted dispatch over controlled shapes.

- [Extensibility for the Masses: Practical Extensibility with Object Algebras](https://www.cs.utexas.edu/~wcook/Drafts/2012/ecoop2012.pdf)
  --- *Bruno C. d. S. Oliveira, and William R. Cook*<br>
  The idea of Object Algebras as a pattern for capturing safer extensions overlaps with some of the discussions here about multimethod-based extensions and ambiguity, and with the idea of Type Classes. Algebras avoid that by controlling the extension mechanism itself.

- [Views: A way for pattern matching to cohabit with data abstraction](https://www.cs.tufts.edu/~nr/cs257/archive/phil-wadler/views.pdf)
  --- *Philip Wadler*<br>
  Wadler idea of views essentially amounts to constructing new "restricted type hierarchies" (remember: sum types ARE a restricted type hierarchy!) that expose different aspects of a value, and in that way make pattern matching work with data abstractions as well.

- [Multi-polymorphic programming in bondi](https://trustworthy.systems/publications/nicta_full_text/7180.pdf)
  --- *Thomas Given-Wilson, Freeman Huang, and Barry Jay*<br>
  You might find the inclusion of Views strange here, as we're talking about dispatch. Bondi's pattern-based dispatch ties that together. The idea of pattern-calculus introduced in Bondi has some very interesting overlap with Views, Multi-methods, and even control-flow-aware type systems like TypeScript. Though even regular pattern matching has interesting overlap with multi-method-based dispatch!
