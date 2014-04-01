---
layout: post
title:  Types Might Not Matter!
snip:   Or how I discovered a better way for correctness-by-design by not worrying.
---

Use numbered headers: True

<!-- * * * -->

The functional programming community can be, sometimes, daunting. While we are
pursuing noble goals, of an expressive computational model that can enforce
correctness-by-design, more often than not we get too caught on the little
details of the known ways to achieve such, and end up considering that to be
the one and only true way. Yes, I'm talking about the idolisation of static
typing.

I, too, was one of the people in the cult of Martin-Löf. One of the proponents
of static typing above all. But not anymore. After watching so many talks by
Gilad Bracha, such as
[Deconstructing Functional Programming](http://www.infoq.com/presentations/functional-pros-cons),
I've started to wonder if types might actually be as important as I once
considered them. Turns out, it isn't **that** important (though they allow some
pretty interesting properties), which is why I've decided to drop static typing
from my programming language, Harmonia.

In this article I explain why static typing is not the one true way, as many
type theorists believe it to be, and show that there are ways to enforce
correctness-by-design otherwise. I also show that by dropping static types, a
range of interesting properties become available for the language designer, in
the quest to make the language safer and easier to use.


# Table of Contents
 *  TOC
{:toc}


## Introduction

Harmonia is a programming language designed for writing domain specific
embedded languages, and also happens to be a general purpose programming
language. Since I don't believe *general purpose* actually exists in
programming, and because coordinating and composing different domain specific
languages is usually a pain, the focus is on DSELs.

Lisps are good at DSELs, as is Haskell. But Haskell is also good at
composition, unlike most Lisps. I used to believe that such property was a
direct consequence of having a rich and expressive static type system, since
composition is all about design constraints, thus this was the original design
of Harmonia: a statically typed programming language, with compile-time (not
turing complete) macros, and a syntax that would make it easy to write
languages on top. These languages would share the same semantics and runtime,
and would have their composition enforced through types.

However, there are other programming languages that, despite not having a
static type system, are good at DSELs and composition. Newspeak is an example
of such. In fact, for some purposes, Newspeak happens to be better at
composition than Haskell! — theoretically, at least. I was thrilled to learn
more about them, and about how they solve the correctness-by-design problem. I
describe my, surprising even for me, findings in this article.


## Why correctness-by-design?

One of the major goals of Harmonia is to be able to guide the user towards a
correctness-by-design approach. This means that a program that is valid in the
language, should also be a correct program. The language should make an effort
of rejecting programs that can be wrong, and otherwise make them difficult to
write. The path of least resistance should be that which leads to safe programs
that do what they were designed to do.

While this noble goal might seem easy on the surface, in truth it's difficult
to conciliate correctness and expressiveness, for the more power you give to
the user, the less control you have over the ways and outcomes of using that
power. It's one of the reasons why pure functional programming is powerful,
since it eliminates a class of errors that would otherwise be possible when you
break referential transparency.

There is not a single answer to this problem, instead all of the features in
the language must contribute towards this goal. For example, allowing
computations that depend on the order in which a particular program was written
makes it difficult to achieve correctness, since the order says nothing about
the nature and dependencies of the computation in a way that can be easily
analysed by a static tool or the programmers themselves. On the other hand,
writing a program with explicit dependencies on data and their cases, makes it
easy to analyse when something should happen or not, by both a static tool and
the programmer. For example, a static tool could enforce that all possible
cases of a particular data structure should be handled by the programmer,
giving less room for human errors.

Above all features, static typing proponents contend that typing is able to
enforce the most correctness properties. It's not difficult to see this, since
types can be used as a way of enforcing constraints on valid values throughout
the program, and how they're supposed to flow from one place to another. Plus,
with dependent types (or even a less rich kind of type system), it's possible
to prove many valuable properties about a program. 


## Types versus syntactical constraints

So, types are not the only thing we can use to enforce design constraints and
get correctness-by-design, as shown by Smalltalk dialects. We can also use
syntactical constraints to, not only enforce these properties, but guide the
user towards them.

If we were to compare, for example, Haskell and Smalltalk, in terms of
syntactical constraints, we would see that the former makes no effort to guide
the user towards valid compositions of terms at this level, since there are
only curried functions and function application. Consider the following
example, where one is expected to sort a list of things descendingly, according
to its weight, and display the title of the first 2 items:

{% highlight hs %}
import Data.List

data Thing = Thing { title  :: String
                   , weight :: Int
                   } deriving (Show)

on :: (b -> b -> c) -> (a -> b) -> a -> a -> c
on f g a b = f (g a) (g b)

things = [
  Thing { title = "Foo", weight = 3 }
, Thing { title = "Bar", weight = 6 }
, Thing { title = "Baz", weight = 1 }
, Thing { title = "Qux", weight = 7 }
]

mostImportant :: [Thing] -> [Thing]
mostImportant = sortBy (flip compare `on` weight)

main = putStrLn $ show $ take 2 $ mostImportant things
{% endhighlight %}

As you can see, since all functions in Haskell are essentially `a → b`, you can
combine them in every which way syntactically. It's only the types that provide
compositional constraints, and these are not visible, for example, at the call
site (not in a text editor, at least). In contrast, Smalltalk languages provide
compositional constraints at the call-site, in exchange for the compositional
power of curried functions (though it's arguable if this is a problem if we
consider a simple syntax). Consider the following example in untyped Harmonia:

{% highlight hs %}
module Main for: Platform where

  -- Record syntax currently looks too funny in Harmonia,
  -- so it'll probably change later eh
  things = [[: title => "Foo", weight => 3 :]
           ,[: title => "Bar", weight => 6 :]
           ,[: title => "Baz", weight => 1 :]
           ,[: title => "Qux", weight => 7 :]
           ]

  print = Platform IO print

  xs most-important = xs sort-by: { l r | r weight compare-to: l weight }

  main = things most-important |> _ take: 2 |> _ show |> _ print

end
{% endhighlight %}

The Harmonia counterpart provides much more guidance to the programmer on the
way things may be combined, thanks to the keyword syntax, and the use of
explicit partial application instead of curried functions. The symmetry between
curry/uncurry is lost, but the composition power for valid compositions is
still maintained, which is what matters in the end.


## Conclusion

Surely, if we were to consider only the development of programs using text
editors and a compiler, types will give you a much faster feedback when you get
something wrong. But we don't need to confine our design space to such
tools, and dynamic typing provides some interesting benefits as far as tools
for interactive development are concerned, given they're easier to work with.

Whether an interactive development can take the role of a static type system in
aiding the programmer designing correct programs remains to be seen. But I'm
confident that the trade-offs amount to comparable compositional power and
constraints, albeit through entirely different paths. And for Harmonia, I'd
like to try walking down the dynamic typing route with a powerful interactive
development environment, which most of the functional programming community
doesn't seem to be interested in.



## References and Additional Reading

<dl>
  <dt><a href="http://lucacardelli.name/Papers/TypeSystems.pdf">Type Systems</a></dt>
  <dd>Lucca Cardelli</dd>

  <dt><a href="http://www.haskell.org/definition/haskell98-report.pdf">Haskell 98 Language and Libraries: The Revised Report</a></dt>
  <dd>Simon Peyton Jones</dd>

  <dt><a href="http://bracha.org/newspeak.pdf">The Newspeak Programming Platform</a></dt>
  <dd>Gilad Bracha, Peter Ahe, Vassili Bykov, Yaron Kashai, and Eliot Miranda</dd>

  <dt><a href="http://bracha.org/newspeak-modules.pdf">Modules as Objects in Newspeak</a></dt>
  <dd>Gilad Bracha, Peter von der Ahé, Vassili Bykov, Yaron Kashai, William Maddox, and Eliot Miranda</dd>

  <dt><a
  href="http://www.schemeworkshop.org/2011/papers/Scholliers2011.pdf">Computational Contracts</a></dt>
  <dd>Christophe Scholliers, Éric Tanter, and Wolfgang de Meuter</dd>

  <dt><a href="http://dl.acm.org/citation.cfm?id=2162141">Epigram: Practical
  Programming with Dependent Types</a></dt>
  <dd>Conor McBride</dd>

  <dt><a href="http://www.mpi-sws.org/~rossberg/f-ing/">F-Ing Modules</a></dt>
  <dd>Andreas Rossberg, Claudio Russo, and Derek Dreyer</dd>

  <dt><a
  href="http://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.39.6996">Types, Abstraction, and Parametric Polymorphism, Part 2</a></dt>
  <dd>QingMing Ma, and John C. Reynolds</dd>

  <dt><a
  href="http://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.67.5276">A theory of type polymorphism in programming</a></dt>
  <dd>Robin Milner</dd>

  <dt><a
  href="http://web.cs.wpi.edu/~cs4536/c12/milner-damas_principal_types.pdf">Principal type-schemes for functional programs</a></dt>
  <dd>Luis Damas, and Robin Milner</dd>

  <dt><a
  href="http://haskell.cs.yale.edu/wp-content/uploads/2011/01/DSEL-Little.pdf">Domain Specific Languages</a></dt>
  <dd>Paul Hudak</dd>

  <dt><a
  href="http://www.cs.kent.ac.uk/people/staff/dat/miranda/whyfp90.pdf">Why Functional Programming Matters</a></dt>
  <dd>John Hughes</dd>

  <dt><a
  href="http://www.infoq.com/presentations/functional-pros-cons">Deconstructing Functional Programming</a></dt>
  <dd>Gilad Bracha</dd>

  <dt><a
  href="http://www.infoq.com/presentations/past-present-future-programming">Onward! — Does Thought Crime Pay?</a></dt>
  <dd>Gilad Bracha</dd>
</dl>
