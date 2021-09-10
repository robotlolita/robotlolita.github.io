---
layout: talk
title: "How To Quickly Understand Millions of Lines of Code?"
language: English
venue: Klarna Loves Erlang 2020
snip: >
  How and why we prototyped Glass---a semantic code search and static analysis tool---during an open source hackathon.
thumbnail: /media/talks/2020-klarna-loves-erlang/thumbnail.png
---

<div class="rl-slide-show" data-start="1" data-end="58" data-format="/media/talks/2020-klarna-loves-erlang/slide%3d.png">
</div>

- - -

Reading source code is not really doable once you hit the tens of thousands of lines of code. It's even more hopeless at millions of them. Yet, analysis tools that can summarise this information struggle just as much as humans do. So how do we build tools that can handle such ginormous codebases, anyway?

In this talk we'll take a practical (but superficial) look at some of the algorithms involved in the making of Glass, a static analysis tool developed at Klarna, and the optimisations that allow providing answers to analysis in real-time for IDEs, and reasonable-time for build/CI tools.

### Additional material

- [Glass' GitHub repository](https://github.com/klarna-incubator/glass)

- [µKanren: A Minimal Functional Core for Relational Programming](http://webyrd.net/scheme-2013/papers/HemannMuKanren2013.pdf) --- Jason Hemman and Daniel P. Friedman (2013)
- [How Developers Search for Code: A Case Study](https://research.google/pubs/pub43835/) --- Caitlin Sadowski, Kathryn T. Stolee, and Sebastian Elbaum (2015)
- [Adapton: Composable, Demand-Driven Incremental Computation](http://matthewhammer.org/adapton/adapton-pldi2014.pdf) --- Matthew A. Hammer, Khoo Yit Phang, Michael Hicks, and Jeffrey S. Foster (2014)