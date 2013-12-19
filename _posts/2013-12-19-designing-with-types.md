---
layout: post
title: Designing With Types
snip: "On applying type theory to jQuery to achieve a simpler, faster and correct API."
published: false
---

When designing an API, we are obviously looking to give our users something that will be a joy to use, and easy to understand, but we also have other concerns to care about, such as guaranteeing that the library does what it should do, and that it is fast enough for the things it should be used for. To achieve correctness and security, our library must impose constraints on which operations are valid, and which are not (so that, for example, an user that is not logged in can not update the status for any user; or an user with an empty shopping cart can't proceed to the payment screen). To make our libraries fast, in a language like JavaScript, our best bet is to make our code predictable, which helps JITs analysing and optimising our code by not needing as many guards, branching, and worse of all, deoptimising the code it had already optimised!

Turns out we can easily achieve all of these goals by applying the type theoretical reasoning to designing our libraries. It should come at no surprise that types would help to enforce constraints, after all, that's all types are for: they're there to prove that your program is correct. But doesn't types make things unnecessarily complex and unflexible? How would types help with making things simpler, and easier to use? Well, this is a common misconception about types, usually arising from experiences with fairly limited type systems (e.g.: Java, C, C#, C++, etc.). The concepts underlying types are a great aid for the library designer, specially to achieve simplicity and easy of use — and in the case of JavaScript, which is an untyped language, it happens to be something they'll help more than achieving correctness in itself.

In this article I'm going to show some of the reasoning about optimising programs for JIT'ing JavaScript VMs, programming for correctness (which incurrs in fewer bugs), separation of concerns, and simplifying APIs for ease of use. Everything backed up with the concepts from type theory.

## Table of Contents

 1. [Introduction]
 2. [An objective analysis of jQuery's problems]
 3. [The essence of jQuery: what makes it good?]
 4. [Separatating concerns into orthogonal concepts]
 5. [Managing complexity through composition]
 6. [Achieving performance through purity]
 7. [Abstraction as a case for flexibility]
 8. [Verifying the properties of our work]
 9. [Conclusion]
 10. [References and Additional Reading]


