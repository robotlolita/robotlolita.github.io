---
title: Why Prototypical OO Matters
snip: Prototypes solve outstanding issues with the classical formulation.
published: false
---

Albeit being one of the most *fuzzy* concepts in computer science, **Object
Orientation** is fairly pervasive. Of all the different school of thoughts on
this field, the **classical** object orientation is the most mainstream, and
widely known. However, different forms of object orientation, like
**prototypical**, **protocols** or **generic** exists, and try to address
outstanding problems with the classic formulation.

In this article, I focus on prototypical object orientation, a philosophy where
objects inherit directly from other objects, which is *arguably* more "object
oriented" than other formulations. To do so, I use the
[Io](http://iolanguage.org/) programming language, a minimal, object oriented,
prototypical language with multiple-delegation. Knowledge of **Io** is not
required to read this paper, as the syntax and concepts are explained
thoroughly.

As it is to be expected, this article is heavily influenced by Hughes' classic
[Why Functional Programming Matters](http://www.cse.chalmers.se/~rjmh/Papers/whyfp.html),
and the papers on the [Self](http://selflanguage.org/) programming language,
the language that started it all.


## Definitions

**Object Orientation** is a rather fuzzy, yet pervasive concept, in computer
science. Given this general disagreement, I use "Objects" and "Object
Orientation" in this article according to
[William Cook's definition](http://wcook.blogspot.com.br/2012/07/proposal-for-simplified-modern.html),
which describes *objects* as first-class entities of dynamically dispatched
behaviour, where behaviour is a collection of named operations. *Object
Orientated* (OO) is a term that describes languages supporting the dynamic
creation and use of objects.

Additionally I use *object oriented* to refer to a programming philosophy
which prescribes that programs be organised in terms of behaviours — objects
are what they do, — rather than strict types and data structures. This
definition might exclude general usage of popular languages considered OO,
like Java, but it's otherwise paramount to the concepts that will be
introduced in this article.


## Introduction

Throughout the story of computing, there's been great disagreement on what
*object oriented* means, likely driven by the nonexistence of a formal
definition, which at times created false dichotomies between Functional
programmers and Object Oriented programmers. However, both philosophies can be
seen as complementary to each other. Whereas functional programming excels in
equational reasoning, object orientation is terrific at organising
programs. In fact, if one is to consider untyped lambda calculus an
object-oriented language, it's only logical that functional languages would
later incorporate more common idioms from object-orientation, modules being
the most obvious one.





## The different philosophies of OO

## A taste of Io

## What are objects?

## What sets prototypical apart?

## Behaviour composition

## Delegative and Concatenative inheritance

## Dynamic inheritance

## Conclusion
