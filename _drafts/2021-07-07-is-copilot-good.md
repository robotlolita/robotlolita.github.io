---
layout: article
title: Is Copilot a Good Idea?
---

I have previously shared [some concerns about GitHub's Copilot](https://twitter.com/robotlolita/status/1410907996469792769) on Twitter, and I've been meaning to write a more well-reasoned piece on why I'm skeptical that the project is a good thing---and a good research direction. So now that I finally have time to do that, I'm writing this (short-ish) post.

My concerns over GitHub's synthesis tool hinge on three main things, but they're all connected:

  - Who is it for? --- and other design questions;
  - Who will it harm? --- and other security design questions;
  - What systems will it poison? --- and other execution semantics questions;

Most of these questions are formulated in terms of "harm" because I believe that's the relevant sociological aspect to evaluate here, not because I think that the people behind the project *mean* any harm---they're probably good people wanting to do more good in the world, and unfortunately this is often not enough.

<!--more-->

## "Who is it for?"

Copilot is a product. From a company. In a capitalist world. Companies exist to make money---incidentally most of them *also* want to improve the world they inhabit in some way, but that's not their primary means of existence.

Sure, Copilot is currently a "limited beta" product. But it's a product nonetheless. And it must be seen as such. Whether it incorporates research in it is not really relevant here.

Now, one important question to ask of a product is: "Who is it for?" What is the target audience of Copilot? How does Copilot aim to improve their lives? And how exactly does it plan to make money? (It has to make money somehow because someone will have to pay for its servers, and I'm sure that won't be cheap. And if it doesn't *have* a plan on how to make the product profitable **yet**, that's another reason to be very skeptical of it).

The Copilot official "Frequently Asked Questions" answers none of these questions. It does answer "What is Copilot?" with something along the lines of "It's a tool that helps you write code faster and with less work", which is both too vague and not enough to derive a target audience.

Without a target audience it's very difficult to evaluate almost any design question you can posit[^1]. "Programmers" is not a homogeneous group. A senior engineer working on safety-critical systems will have wildly different requirements from a synthesis tool compared to a data-scientist that happens to use programming for making sense of data.

This also make it difficult to answer our next concerns, so we'll segue into them assuming "any user" as an approximation, and using more specific personas where relevant.

## "Who will it harm?"

Harm is a strong word, but is also the correct word here. Harm does not require *intention*.

In order to evaluate harm we'll first look at how Copilot works. From the same FAQ page, we get the answer that Copilot will send your code to an external service, which will analyse it in order to synthesise more code. It doesn't currently send your entire codebase to the service, but they plan to ease the limitation in the future.

Information sent to Copilot is treated as sensitive, encrypted, and accessed on a "need-to-know" basis. However, I can imagine some companies still seeing this as a form of exfiltration. Especially if they don't have special agreements in place with GitHub.

Be that as it may, we do hit our first harm potential here: there isn't really any way for users to know or control *what* they're sending to Copilot. 





- - -

[^1]: [You can't really build a tool for everyone][titus]. And no, "general-purpose programming languages" are a miscategorisation; [there is no such thing as "general-purpose"][abstract-enemy].


[titus]: https://www.youtube.com/watch?v=4or-eQ8fPl8

[abstract-enemy]: https://www.cl.cam.ac.uk/~afb21/publications/BlackwellChurchGreen-PPIG08-The_Abstract_is_an_Enemy-distribute.pdf

