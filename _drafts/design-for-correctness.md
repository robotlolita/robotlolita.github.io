---
layout: post
title:  Design for Correctness
snip:   On using data structures to make incorrect states impossible to happen.
---


## Table of Contents
 *  TOC
{:toc}


## 1. Introduction



## References and Additional Reading

[May Your Data Ever Be Coherent](https://www.youtube.com/watch?v=gVXt1RG_yN0)
: Daniel Spiewak argues that you should write code in terms of data flow,
  in order to avoid flow bugs and make reasoning easier.

[Functional Programming with Bananas, Lenses, Envelopes, and Barbed Wire](http://eprints.eemcs.utwente.nl/7281/01/db-utwente-40501F46.pdf)
: Meijer, Fokkinga, and Paterson goes through the fundamental recursion
  patterns in functional programming, such as Catamorphism, Anamorphism,
  Hylomorphism, and Paramorphism.

[An Introduction to Recursion Schemes and Codata](http://patrickthomson.ghost.io/an-introduction-to-recursion-schemes/)
: Patrick Thomson expresses the ideas of Meijer et al's paper in a more
  "accessible" way.

An Introduction To Functional Programming
: Bird, and Wadler provide an introduction to functional programming with an
  emphasis on mathematical proofs and equational reasoning. The chapter on
  recursion is particularly useful for the concepts described here.

[Worked Example: Designing for Correctness](http://fsharpforfunandprofit.com/posts/designing-for-correctness/)
: A straight-forward article on how ADTs can be used in F# to disallow the
  application ever entering an invalid state.

[Theorems for Free!](http://homepages.inf.ed.ac.uk/wadler/papers/free/free.ps)
: Wadler discusses how you can get useful theorems from just a (parametric)
  polymorphic function type. This helps not only understanding what the
  function must do, but reasoning and validating its implementations.

[The Early History of Smalltalk](http://gagne.homedns.org/~tgagne/contrib/EarlyHistoryST.html)
: An amazing essay by Alan Kay that shows how Smalltalk evolved, and how
  languages influence one's thinking process.


