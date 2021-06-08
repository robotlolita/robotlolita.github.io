---
layout: article
title: A Tale of 4+ Strings
---

Most programming languages need to deal with text in some way or
another---and programming languages for writing interactive fiction
need to deal a lot with text. The way modern languages do it is to
have some sort of String type, which will generally support text
encoded using some Unicode format.

But text is deceptively simple. Even if we don't get into all of the
complexities of Unicode and internationalisation (["I just want to count
the characters in this text, how hard could that be?"][unicode-quora]),
requirements on how you store and operate on this text can vary wildly
depending on the operations and limitations that you have. For example,
a contiguously-stored binary is good for displaying text, but terrible
for editing it, if you have a text editor. A rope storage is the complete
opposite of that. Storing Unicode in UTF-16 is great for implementing
operations on a JavaScript string, but it wastes too much memory on
small devices like mobile phones.

Because of this, even though we generally talk about "String" as a single
type, modern languages will tend to have several of these that embody
different trade-offs. This may be exposed to the user (Haskell has at
least 5 in the standard library, and you're supposed to pick the tradeoff
that fits your use-case), but it may also just be a runtime detail
(JavaScript implementations have one "String" type, but multiple
representations covering interning, ropes, slices, and ASCII-only special
cases for saving memory).

Crochet has many types of strings as well, and it forces you to pick one
of them. The difference here is that Crochet's types are not about
*storage*, they're about *security*.

So, why would you *want* to differentiate strings for security, even if
ultimately they have the exact same storage representation?

<!--more-->

## What is text used for in programs, really?

Text is used for several different things in real programs, and not all of
them have the same *semantics*. For example, consider the following
JSON blob, which represents the state of a character in a game:

```json
{
  "x": 10,
  "y": 20,
  "direction": "north"
}
```

Here, `"north"` is definitely a piece of text in JSON, however we don't
necessarily think about it as *arbitrary* text. Indeed, the common case is
that `direction` will contain one of many pre-defined values, and the use
of text here just makes it easier to communicate which one of the pre-defined
values we're talking about *for other humans*. The computer honestly doesn't
care.

Likely, the code that processes and produces this blob will have a definition
such as:

```
enum direction = north, east, south, west;

type player( x is integer
           , y is integer
           , direction is direction
           );
```

So each of these directions is known in advance and could've just as easily
been represented in the JSON blob as a single number. Some programming
languages, indeed, go the additional mile and define a specific "textual"
type for it: a "symbol" or an "atom", as generally called. We'll call it a
"symbol" here.

A "symbol" has very different semantics---that is, we *think* about it in
a very different way, and give it very different *affordances*---when
compared to arbitrary text such as the following:

```
let Title = "A Tale of 4+ Strings";
```

For our symbols, we can forbid concatenation, we can restrict the grammar
to prevent the use of spaces, ensure that characters are always in
the ASCII-range, avoid having to deal with the unicode normalisation
nightmare that makes comparisons like `"café" === "café"` fail---even
though they're rendered exactly the same way on the screen.
We can even build helpful IDEs that suggest symbols and automatically
corrects them---or converts from different spellings.
And we can do all of this because we *know* there are only a handful
of valid values for symbols.

None of these things are possible for the `Title` example text because
that's an arbitrary piece of text. We don't know what language it's using---
or if it's even a known, existing natural language; it could just
as well be an arbitrary sequence of letters in some alphabet, or a piece of
text in a new constructed language. Or, indeed, a piece of text in a new
programming language. There's no real intrinsic semantics attached to this
piece of text.

Sure, we could always force people to tag their pieces of text with something
that tells us what semantics to consider. In this case:

```
let Title = english "A Tale of 4+ Strings";
```

Would tell us that this is a piece of English text, and that we can use that
information when comparing it to a different piece of text: for example, we
could avoid case sensitivity. 

Still, even if we know something is written in English, that doesn't mean
it has to follow the standard English grammar---or that it'll only use words
that are known, or even words in the meanings that are known and common. While
we could approximate several semantics based on more annotations, things get
quite ugly quite quickly, and we're forced to reckon the arbitrary nature of
text.

So that leaves us with at least two types of text so far: symbols, and
arbitrary text.


## Context and composition of text pieces

We've briefly touched on concatenation and semantics before, but it's time
to dive a bit deeper on that; this will be important when we discuss the
implications for security.

Text may be introduced in a program as some arbitrary collection of bytes
or characters. But the people who're putting it in the program generally
*have* some semantics for that piece of text; these semantics are just
not conveyed to the program---not right away, and sometimes never after
that either.

For example, consider the following:

```
let File = "paper.txt";
```

As far as the programming language knows, this is just as arbitrary of a
piece of text as the `Title` example we've seen before. However, to the
programmer, this likely has much better defined semantics. Indeed, they'll
often follow this line with something like:

```
let Contents = file-system read-as-text: File;
```

Here, the arbitrary piece of text we had is forced to be treated a relative
path to some file in a file system. As written, we can generally reason
about it somewhat: "It'll read a file called `paper.txt` in the current
directory!". But only somewhat, because there are additional things to
consider here. For example: "What is the 'current directory'?" or "What
will happen if there exists a file called 'paper.txt' and a file called
'Paper.txt'?"

But things get worse---they always do. Consider the following:

```
let Full-path = Directory ++ File;
let Contents = file-system read-as-text: Full-path;
```

Here we're trying to treat `Full-path` as some path to a file in the
file system and read it as a piece of text. Nothing here is really
different from before, except that `Full-path` is now the combination
of `Directory` and `File`. But what does it *mean* to combine
`Directory` and `File`?

Well, as the `_ ++ _` function is the textual concatenation function
in this case, the pieces of text are simply mashed up together. For
example, if we have `"/Users/q/" ++ "paper.txt"`, then its combination
would be `"/Users/q/paper.txt"`. We could likewise have
`"/Users/q" ++ "\u0301"`, resulting in `"/Users/q́"`. Both of them are
valid paths in a Linux machine, but it's very unlikely that the second
result was expected.

The problem here is that a file system path has very specific rules and
semantics, and we can't just mash things together and hope they'll still
work. Allowing string concatenation essentially breaks composition, if
you're going to represent things as strings---and people will do that,
because it's *convenient* (and somewhat universal).


## And then, injections

So combining strings sometimes is subject to more restricted contextual
rules, and when these rules are broken (and there's nothing there in
most languages to ensure that they won't be broken), programs do confusing
things.

However, programs only do confusing things when we're combining values that
*we* control. Values that were either statically defined in the program,
or produced by the program using values we likewise control.

Attackers will generally not want things to behave confusingly, if they can
avoid it.

So as soon as we allow strings to come from sources that we don't have full
control over, all bets on what the semantics of these combinations should
be are off. Just like missing a semicolon on line 39 of a 9467 lines
JavaScript file and having the parser go wild---except that at some point
between line 39 and 9467 some of the contents may have been put there by
an attacker.

For example, consider the following:

```
let Output = command-line arguments option: "--output";
let Program = command-line arguments option: "--program";

let File = compile: (file-system read-as-text: Program);
file-system at: ("_build/" ++ Output)
            write-text: File;
```

This example is a bit more contrived. When you invoke this program in the
command line, let's say with: `run --program file.in --output file.out`,
this program will read text from the path provided in the `--program` option,
then do some kind of compilation, and output the result in `_build/<output>`,
where `<output>` is whatever was provided for the `--output` option.

Both `--program` and `--output`, as well as the file we read, are outside of
our control. Now, our little program tries to be nice and output whatever it
compiles to a `_build` folder that's under its control.

What happens, however, when someone runs the program with?

```
run --program malicious.in
    --output ../../../usr/local/bin/python
```

If this program creates an executable, and it has write permission to that
folder---it generally does because desktop OSs don't use capabilities---,
then we've essentially allowed an attacker to replace the default
installation of Python in this user's machine, with one that's
attacker-controlled. Even though we've tried to sandbox the output inside
of the little `_build` folder, combining that with arbitrary text without
caring about the semantics of file system paths resulted in a vulnerability.

Of course, [all injection attacks steem from this][injection]. And it's such
a common occurrence that any secure-inclined language *has* to deal with
this; leaving it for users to worry about is just setting them up for
failure, because it's not reasonable to keep track of the flow of these
values as programs grow bigger.


## Labelling values

Injection attacks require us to keep track of, at the very least, which
values are "trusted" (we have fully control and knowledge of them), and
which values are "untrusted" (they come from malicious actors). Because
we can't really verify the intent of a piece of data in a computer, we
over-approximate the "untrusted" category to mean "all values that come
from outside of the program, even if it's this little configuration
file we have manually written 2 minutes ago".

One way of doing this is through labelling values. Some languages, like
Perl, do this through their [Taint checking](https://en.wikipedia.org/wiki/Taint_checking) mechanism, and it's
usually going to be limited to strings. Other languages, like 
[Jeeves][jeeves], have a richer idea of labelling and allow labels to
be attached to any value.

In Crochet, a label is really just a distinct type. So strings (which
Crochet actually calls "text") will have the following hierarchy:

```
unsafe-arbitrary-text     -- any piece of text
  |
  |--> text               -- any trusted piece of text
  | |--> static-text      -- literal text values in a program
  | `--> dynamic-text     -- produced by running the program on `text`
  |
  `--> untrusted-text     -- untrusted textual values, anything from outside
```

A function that accepts `text` accepts any trusted piece of text. A function
that accepts `unsafe-arbitrary-text` accepts **any** piece of text, even
those coming from untrusted sources. Most functions operate on `text`, and
Crochet tries to make operating on untrusted text as costly as possible.

Any operation that involves `untrusted-text` will yield another
`untrusted-text`. That means that, if you have an untrusted piece of
text `"hello"`, and you take the first 4 letters of this piece of text,
you're going to get back an untrusted `"hell"`.

Untrusted pieces of text can be promoted to trusted pieces of text by
*parsing*---not validation. A parser is something that analyses the
contents of the piece of text, and then decides how to interpret it.
For example, a file system API may provide the following function:

```
command #path parse-segment: (Text is unsafe-arbitrary-text)
  -> result<segment>;
```

It will take an arbitrary (possibly unsafe) piece of text, and try to
interpret it as a path segment (i.e.: anything that does not contain
a path separator or a relative path indicator such as `..`). If it
succeeds---the input was a valid segment---then it returns a proper
trusted segment value. Otherwise it will return a failure.

With this function, we can rewrite our previous example to:

```
let Program = command-line arguments option: "--program";
let Program-segment = #path parse-segment: Program
                        | value-or-panic: "Expected a segment";
let Program-path = #path current / Program-segment;

let Output = command-line arguments option: "--output";
let Output-segment = #path parse-segment: Output
                       | value-or-panic: "Expected a segment";
let Output-path = #path current / "_build" / Output-segment;

let File = compile: (file-system read-as-text: Program-path);
file-system at: Output-path
            write-text: File;
```

When our attacker tries their exploit for this new version of the
program, we'll just crash and burn instead of heeding its evil machinations:

```
$ run --program malicious.in
      --output ../../../usr/local/bin/python

*** panic: Expected a segment
```

So now our program is safe. But it's not *secure*.

And it isn't the lack of security concepts that is making it insecure.
Rather, there's too much of it. So much that, realistically, nobody
would write this program in the first place. If a simple program requires
as much boiler-plate in order to get anything done, people would simple
choose a different tool---especially if they're not professional
programmers to begin with.

So we need to step up our game and make the language actually usable,
which is a requirement for it to be secure. We have to make writing
secure programs not only possible and the default, but also *effortless*.

Or, well, we can't make anything really "effortless". But we can try
to reduce the friction of writing secure programs as much as possible.

The way Crochet deals with this is a bit complicated, because it also
needs to take into account [Capabilities][ocap], so we'll limit ourselves
here only to strings.

So a better API may be:

```
let Program = command-line arguments option: "--program";
let Program-path = #path current / Program;

let Output = command-line arguments option: "--output";
let Output-path = #path current / "_build" / Output-segment;

let File = compile: (file-system read-as-text: Program-path);
file-system at: Output-path
            write-text: File;
```

By folding parsing in the `_ / _` function for paths we're able to avoid
requiring users to think about it. The only thing that really makes sense
on each side of a `/` is either a fully-fledged path, or a segment, so
if we get a piece of text there, parsing it as a segment is the only
reasonable course of action. Type inference and IDEs can, then, explain
that decision to users.


## Combining pieces of text. Again.

There's one piece missing, however. We've discussed that combining 
pieces of text is a contextual operation, and that we often have many
different languages with more restricted semantics.

We've also looked at how, if you're willing to pay the price of parsing,
we can both ensure that these combined pieces of "text" (usually not text
anymore at that point) will be correct by construction, and they'll also
be resistant to injection attacks, which rely on rule violations in the
composition of strings.

But---and this is a big but---this is only the case if we both know what
the context of the composition will be before-hand, and we have parsers
available for the format, **and** we're willing to pay that price.
Particularly if what we write in the program is going to be a far cry
from how we'd generally express the same semantics *everywhere else*.

In the previous example, we were forced to rethink the way we express
file system paths in terms of this `#path` object and this `_ / _`
function. What does that mean if we want to combine XML? The result
is often attainable, but dreadful, confusing, and certainly not
friendly until you invest too much time and energy in a new esoteric
language.

[E][e] had this idea of [quasi-literals][quasi], which were
eventually turned into JavaScript's [template strings][template]. Here,
if you know the context before-hand, you can get all of the benefits
of required parsing to promote untrusted strings *without* giving up
on the familiar (and often more usable) syntax. With the idea of
quasi-literals, the program above could have been further refined to:

```
let Program = #path`[command-line arguments option: "--program"]`;
let Output = #path`_build/[command-line arguments option: "--output"]`;

let File = compile: (file-system read-as-text: Program);
file-system at: Output
            write-text: File;
```

Which is much closer to what we started with, but without any of the
security problems. Indeed, this new form even provides more opportunity
for better contextual parsing than before.

Now, we don't always have the appropriate context. And not everything will
have a pre-built parser we can use. And, as a programming language for
interactive fiction, most text in Crochet will actually have formatting
nodes inside, such as: `"A [strong: "key"]?"`. Here we *really* don't want
to have to interpret `strong` ahead of time because what it'll ultimately
mean depends on what rendering format the program is using---an HTML
renderer does not do the same thing as a Terminal or Canvas renderer.

So, instead, Crochet takes a page out of [Free monads][monads] and defines
a first-class interpolation type. With this we have:

```
let Program = command-line arguments option: "--program";
let Output = command-line arguments option: "--output";

let File = compile: (file-system read-as-text: (Program as segment));
file-system at: ("_build/[Output]" as path)
            write-text: File;
```

Now we have this `X as Y` syntax, which means "coerce X into Y somehow".
`_ as _` is just a regular multi-method, so the "somehow" is still defined
by invoking a function. What this does is straightforward for
`Program as segment`---it means the same as `#path parse-segment: Program`,
but `"_build/[Output]" as path` requires a bit more of attention.

If you have familiarity with a programming language that does string
interpolation, you'll likely see this as the equivalent of
`("_build/" ++ Output) as path`. Which is absolutely correct in
Crochet---they both do the same thing here. But this does *not* result
in any of the string types we've seen so far. Instead, it yields an
"Interpolation" type. And an interpolation is essentially a tree of
components, some of which may be pieces of text, and some of which
may be arbitrary values.

In this case we have:

```
Interpolation:
  "_build/"    Output
  ^^^^^^^^^    ^^^^^^
   |             `--- value of type untrusted-text
   `--- static component
```

So when this is passed to the `path` parser, it knows exactly which portions
of the program were literals in the interpolation, and which parts were
concatenated there. It can use that information to do the same contextual
parsing as before, so we may enjoy the same guarantees about correct
composition that we need for security.

First-class interpolations do come at a runtime cost, as does labelling.
Particularly for applications that might do a lot of text scanning and
parsing. But the trade-offs are completely worth it for Crochet's domain
and target audience.



[unicode-quora]: https://www.quora.com/How-do-you-get-the-last-character-of-a-string-in-JavaScript/answer/Quildreen-Motta

[injection]: https://security.googleblog.com/2009/03/reducing-xss-by-way-of-automatic.html

[jeeves]: https://projects.csail.mit.edu/jeeves/download.php

[ocap]: https://robotlolita.me/diary/2021/04/why-crochet-is-oop/

[e]: https://en.wikipedia.org/wiki/E_(programming_language)

[quasi]: http://www.erights.org/elang/grammar/quasi-overview.html

[template]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals

[monads]: https://typelevel.org/cats/datatypes/freemonad.html