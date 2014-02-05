---
published: false
layout: post
title:  Modularity Is A Social Problem, Too
snip:   What's modularity? How is it a social problem? How Harmonia fixes it?
---

Use numbered headers: True

<!-- * * * -->

Modularity is one of the big problems we, language designers, try to solve in programming languages.
There is this beautiful ideal where you would write programs by just putting small pieces together
and things would Just Work™. Sadly, reality is a lot more harsh, and modularity and composition are
neither simple, nor easy, and things get worse as you stray from the trivial use cases.

Even Haskell, a language that's praised for its modular and compositional approach still has plenty
of pain points around the corners (whenever effects are involved), and in its module construct.
Things get worse as you consider modularity in a larger, social context, which packages and
package managers were supposed to fix, but never got anywhere close to that. Package management
and modularity is a hard problem, and it is a hard problem because it's largely a **social**
problem. It's about people and interactions, just as it is about technology.

There is some research that acknowledges such problems, and proposes solutions to them. In this
article I'll walk you through how I'm lessening these problems in my new programming language: Harmonia.
Stick with me!



# Table of Contents
 *  TOC
{:toc}
