---
layout: post
title:  Folktale 2 and beyond~!
snip:   Where we are, and where we'd like to go in the future.
---

> $ npm install folktale@2.0.0
{: .highlight-paragraph .pull-in }

![A skinny and short 26 year old woman is sitting on a sofa, with a laptop on her lap. Her hands hover the keyboard, pressing some keys. She has short red hair, which falls just below her chin, and green eyes. She wears a T-shirt with a minimalist panda design, a purple jacket, and blue jeans pants. Her 8 year old daughter stands to her right side, leaning towards her. The slightly plump kid wears a frilly strawberry dress, and a big red ribbon on her head. Her wavy, light brown hair falls just a bit below her shoulders, and her bangs cover her eyebrows partially. A message that reads "Folktale 2 is released!" stands by the side of the two figures.](/files/2017/folktale2-release.png)
*Sara demands some attention from her mom. Alissa continues fighting her computer…*
{: .centred-image .full-image }

The new version has been in the works for more than one year. Its main focus was providing better documentation and a more consistent package for functional programming in JavaScript. This blog post discusses these future plans, and a new release plan.


* TOC
{:toc}


## A standard library for FP

Folktale 2 is a major change from the previous libraries that made out Folktale 1, both in features and design goals. The idea is to turn Folktale into a fully-featured standard library for doing functional programming in JavaScript. Functional programming has many benefits, but it can also be fairly difficult. There are many barriers to entry, whether one decides to write these programs in JavaScript or some other language. Ideally we'd like to lessen that a little bit, but that's hard to do when you don't have a well-defined set of tools and practices, a curated ecosystem, etc.

This release gets at the heart of some of the problems we had with Folktale 1, chiefly the lack of documentation. Sadly, [we're still limited by tooling](https://github.com/origamitower/folktale/issues/132), so while documentation now *exists*, there are no cross-references, and it's hard to navigate. In terms of functionality, the 2.0 release addresses a major pain point of Tasks in the previous version, fixing race problems in the model, and making them easier to use.

The move to a monolithic repo is an attempt to fix some of the consistency problems that the previous libraries had, but also to build a better community around the libraries, and make it easier to use these tools and get help related to them. There's now [a central place to track the evolution and problems of Folktale](https://github.com/origamitower/folktale/issues), and [a Twitter account for news on the project](https://twitter.com/OrigamiTower). The [gitter chat](https://gitter.im/folktale/discussion) will continue to be used as an additional support channel for the community.


## Release strategy

The old Folktale libraries had no release strategy (besides following [semver](http://semver.org/)), and the pre-releases of Folktale often broke many features. The new release strategy tries to address these, while allowing experimental releases.

Folktale 2 and beyond will always properly follow semantic versioning. This means that you can always update within a major release (e.g.: from `2.0.0` to `2.1.0`) without having any of the APIs break. Major release updates (e.g.: from `2.3.0` to `3.0.0`) will have a migration guide so you know what you need to change in your code for it to work.

As far as npm releases go, we'll have two channels:

  - The **stable channel** (`@latest`) will contain only releases that have been tested for a while. The stable channel updates slowly, but updates are less likely to break things. Stable is the default in npm, so if you run `npm install folktale`, that's what you're getting.

  - The **experimental channel** (`@next`) will contain releases directly from the master branch. Because features are developed in feature branches and merged back on master only after they're finished, this code is relatively stable. The major difference is that these versions will not have been tested on actual production code, by actual users. You can install from the experimental channel by using `npm install folktale@next`.

If you install a particular version (`npm install folktale@2.3.x`), you'll get that package independently of what channel it's in.


## API stability

Along with the different channels, APIs will also have different states of stability. We adopt the same stability index as Node, so APIs may be one of:

  - `experimental` — The design of the API is still in the process of being refined and tested. Changes to the API *may* occur during this proccess. If they happen, the old API will be deprecated, and removed in the next *major* release. In general you shouldn't rely on experimental APIs for production code, as the release cycles for major releases may not give you enough time to update your code.

  - `stable` — The design of the API was considered good and is finished. Changes to the API are *unlikely* to happen. If any change happens, the old API will be deprecated, but supported for one year after that. After this period, it'll be removed from the library.

  - `deprecated` — The design of the API was considered bad, and the feature will be removed in the future. Deprecated features should not be used for any new code, and code using deprecated APIs should upgrade as soon as possible (using one of the migration guides that will be provided).


## The roadmap for Folktale

There's a [roadmap](https://github.com/origamitower/folktale/blob/master/ROADMAP.md) in the repository that outlines some high-level goals for the next releases. The first thing that will be worked on after this release is moving the library to TypeScript.

With the new additions to the TypeScript type system, most contructs in Folktale can be given *reasonable* types. The 2.4 release also includes some enhancements on the type inference which are greatly appreciated. All in all, moving to TypeScript means that types can now be used to check if the composition of functional components are correct in your code, with no runtime overhead, and give you useful errors if they're wrong. Types also help in design and discoverability from a text editor like Visual Studio Code, and better tooling is always a nice thing.

Constructs that can't be typed in TypeScript right now will end up with a `any` type for the time being, which means that while TypeScript people can use it, no type checking will be done. This does not change any of the library for people using JavaScript without a type checker. Sadly, Facebook's Flow can't be supported by this move, as the type systems have different semantics.

Once the current features are moved to TypeScript, we'll add more concurrency structures (CSP channels and Observable streams), and persistent collections (Range, Linked list, Vector, Map, and Set), as well as other common structures for programming in general, and Racket-ish style [higher-order contracts](https://www.eecs.northwestern.edu/~robby/pubs/papers/ho-contracts-techreport.pdf).


## Functional programming beyond Folktale

You might have noticed the drawing at the top of this blog post. Why, that's Announcement Number 2!

I have been doing research for a [little big project](http://codeland.robotlolita.me/) for the past year. The focus is on making resources and tools for CS education more accessible. There's still a lot that needs to be done, and a lot of challenges to tackle (for example, supporting live programming for a large amount of different programming languages that have not been designed with that in mind).

