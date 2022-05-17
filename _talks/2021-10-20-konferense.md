---
layout: talk
title: "Securing Your Systems By Befriending Ghosts"
language: English
venue: Konferense 2021
snip: >
  Do we really need new security tools in programming languages? Yes, we do! In this talk we motivate and see how some practical techniques can help make systems more secure.
thumbnail: /media/talks/2021-konferense/thumbnail.jpg
category: storybook
---

<div class="rl-slide-show" data-start="1" data-end="133" data-format="/media/talks/2021-konferense/slide%3d.jpg">
</div>

- - -

How often do you worry about forgetting to validate an input? Or escaping it correctly to prevent injection attacks? How often do you worry about changing your logs and accidentally leaking personal (or secret!) data?

Sure, we've all learned to live with these worries, but things don't have to be this way. Meet your new (old) best friend: the type system. We'll see how a single technique of types as capabilities can be used to express and enforce security constraints throughout your system. And then see it in practice in TypeScript. This technique liberates you from worrying about leaks and injection attacks by leveraging your existing build pipeline to automate these audits so you can spend that energy creating smooother experiences for your users.


### Related material


- [A Decentralized Model for Information Flow Control](https://www.cs.cornell.edu/andru/papers/iflow-sosp97/paper.html)
  --- *Andrew C. Myers, and Barbara Liskov (1997)*
- [Robust Composition: Towards a Unified Approach to Access Control and Concurrency Control](http://www.erights.org/talks/thesis/)
  --- *Mark Samuel Miller (2006)*<br>
  This thesis covers capability security in E and object-oriented programming. It's a major influence on this particular technique.
- [Parse, don't validate](https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/)
  --- *Alexis King (2019)*<br>
  A really great write up on type-driven design and which clarifies a lot of the points I was trying to make with "parsing over validation".
- [A Tale of 4+ Strings](https://robotlolita.me/diary/2021/06/a-tale-of-4-strings/)
  --- *Quil (2021)*<br>
  My own personal ramblings on security and composition with types as capabilities in Crochet, and how exactly this particular technique is used in a real project.
{:.rl-reading-list}