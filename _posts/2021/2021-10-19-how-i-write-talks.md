---
layout: article
title: "How do I write talks?"
card_type: summary_large_image
card_image: /files/2021/10/talks-card.png
---

I've given a few technical talks in the past, and people seem to enjoy most of them. Sometimes they will tell me stuff like "wow, even though I'm not super technical I could still follow it." So, having finished writing my talk on security type systems, I thought this would be a great opportunity to talk a little bit about how I approach writing technical talks.

Spoiler: it's not through a programmer lens. I'm only incidentally a programmer, after all :)

![An illustration of a witch feeling overloaded with the amount of work. She's holding her face with her hands, elbows on the table. A black cat leans on her arm, concerned. She's surrounded by piles of papers. The text in the image reads "This is too much"](/files/2021/10/talks-card.png)
*This is exactly how I feel after having finished my talk*
{: .centred-image .full-image }

  * Table of Contents
{:toc}

<!--more-->

## 1. Coming up with an idea

The first hurdle. I personally have a hard time coming up with ideas for presentations, and a large part of it is that I doubt a lot of the things I have worked on would be that interesting for other people.

With my recent work on Crochet I've been trying to fix this a bit. So I've been trying to focus on presentations about ideas in Crochet that I wish people would be more motivated about trying out in their own languages and ecosystems.

My last two talks had idea paragraphs that looked like "oh, we did this semantic code search thingie for a hackathon, that might be interesting for people?" and "Crochet's type capabilities are expressible in TypeScript, aren't they?".

But, sometimes, this is more like a vague but funny title or phrase. For example, one of the ideas in my backlog is just: "Software verification is a game and we're winning". I'm bad with titles, however, so starting with a title is *very rare* for me.

Incidentally, this is often how I approach writing in general as well---it hardly ever starts with a question, but more like a general and extremely vague observation. Or feeling. Or scene. As long as *I* find it interesting, I try to keep it in mind for the future.


## 2. Brainstorming

Once I have at least some idea of what I could talk about, and need to elaborate on it a bit to send a proposal somewhere, I try to come up with things I could explore in the subject. This is very unstructured, and my main concern is figuring out what *is* the scope of what I'm trying to present.

For example, in [my talk on Glass][glass] these were things like "oh, maybe I should talk about miniKanren" and "something about incremental static analysis I guess?". When I was planning [my talk on JavaScript compilers' optimisation][jsvm], though, this was a lot more, uh, specific: "what's monomorphism?", "VM architecture", "Frances Allen", "polymorphism", "message splitting", "shapes".

My upcoming talk was a bit more thorough in the brainstorming phase, but that's just because the CFP required me to provide much more information, like the audience and what exactly I expected to convey to people. Apparently they didn't want me to write "heck if I know" as an answer there, so it was the first time I truly spent more time on brainstorming---I don't really regret it, but I also don't see myself doing the same for every presentation.


## 3. Writing

And so we finally hit the *writing* phase.

"Wait? Writing? What about plans?" you ask, naïvely.

I'm a [pantser][]. Someone who thinks *through* writing, rather than someone who plans what they have to write before they put ideas on the paper. I need to concretise something---anything---in order to be able to think about it. This has been the case for pretty much all my short fiction, comics, and DM'ing in D&D as well. Though I'm not including [world building][] here as "planning".

Honestly. I've tried planning before for games, and I've realised that my brain just does not work that way, and I cannot think when I'm planning. So I just don't even try anymore.

So this is how I write (my talks will generally have a common structure): I start by motivating what I'm talking about. Why should you even care about what I'm discussing? I follow that by describing what I've motivated. And end with how that works exactly.

Oh. My bad. That's not how I *write*. That's how I structure my writing. How I write is a bit more boring. I'll prompt my brain for an opening line, and then I just let whatever my brain comes up with fill the paper (or Word document) in real time. By which I mean: I play the entire talk in my head, without any planning, and write *anything* I think about. This will generally result in a two-hour long document with a ton of tangents. But the first five drafts or so of anything you do are going to be thrown into the trash anyway. The important thing here is the *flow*.

As a pantser---at least as what I think is the "pantser experience(tm)"---the flow of the story I'm trying to tell is really the thing that I'm the most concerned about. And I can't really get that from planning---it doesn't work for *me*. So I just have to see what my brain comes up with, how my brain ad-libs one hour of content, and then figure out how to make some sense of that and what I need to cut out from it.

It's important to note that the final talk will be completely different from this initial writing exercise. But the *flow*? The *cadence* of the story? A lot of that carries over.

For example, here's an excerpt from one of these first drafts for my upcoming talk on security type systems:

> But today I want to talk about a simpler---and more widely applicable---technique: security and privacy policies as plain types. Before we get into what that means, however, let's look into what kind of problem even warrants it.
> 
> Let's say you build a small service. It exposes an authenticated endpoint where we can get an user's address. Because we want to test and monitor it, we need to observe what the service is doing so we add some logging.
> 
> Logs are our first hurdle here. Naively logging a request or response from our service will disclose not only the user's address (bad) but also the authentication token (very bad). So we have to remember---not only when we're writing, but from every point since the log introduction---to ensure that no sensitive data can *flow* into public observable outputs. "flow" here is important because it's very unlikely that we'll disclose sensitive data directly. It's almost always accidental due to how complex it is to follow its entire lifecycle throughout the entire program---or worse, across different systems.

How much of this has made into the final talk? A whopping 0%. To be honest, I have changed the structure of my upcoming talk so much over the last three months that it even surprised me when I tried comparing my first drafts with what I ended up with---so please have fun doing that comparison too. :>


## 4. Storyboarding

After I'm happy with my "first" (out of many "first"s) draft, it's time to... storyboard it. I imagine that, in the case you also happen to be a regular writer AND a pantser who approaches your initial drafts by just writing out a short non-fiction story about what you want to present, following that by storyboarding *might* be where our paths diverge. But what do I know? Maybe you also happen to have writing fiction and drawing comics as a hobby.

So, my talks are generally very visual---they don't *start* very visual, but they become very visual soon after the initial thing is out of my brain. There are pros and cons here: it seems that, like me, there are other people out there who have a hard time following things that aren't visual. I'm particularly bad with language and words, so if I don't have anything visual for my brain to follow, the poor thing decides to just turn off on its own. Yes. I know how weird that sounds when writing fiction *is* one of my hobbies, and one I've done for well over a decade now. Go figure. Brains are weird.

The obvious cons here is that, by virtue of how I design my talks, they're entirely inacessible for blind people. I'll discuss this point later though; it's too important to leave it lost in this section.

But what do I mean by "storyboarding a talk"? That's right! I mean literally drawing every slide, by hand, as if it was a storyboard for a short comic. Or animation---I'm only a beginner at doing animation, but the heart of it feels quite similar, at least.

At this stage I want to figure out what kind of visual story I want to tell, and how I want this story to *flow*, visually.

I used to draw my storyboards with regular pen and paper. But these days I draw them on my Microsoft Surface, using Wacom's Bamboo Paper (RIP). There are two reasons for this new setup. The first one is that Bamboo Paper actually has something similar to *physical pages* in a notebook. This makes my workflow almost the same as before, except using digital paper and digital pens to draw. The second, and equally important one, is that it makes it a lot easier to revisit or incrementally build things, and also easier to remotely practice it with other people to get feedback.

![A screenshot of Bamboo Paper showing the title slide "Securing your systems by befriending ghosts", along with the first 5 pages of the storyboard](/files/2021/10/talks-bamboo.png)
*This is what the very first storyboard for my security type systems talk looked like. At this point I was pushing the talk in a completely different direction!*
{: .centred-image .full-image }

I've revisited and rewrote this storyboard *entirely* much more than usual. I threw away several storyboards. Changed directions many times. One of the things I found particularly difficult to figure out was how to motivate what I wanted to discuss, and which parts exactly to focus on. Security type systems are a *huge* topic, and you can barely touch the surface in a 30 minutes talk. Compromises had to be made.

One other thing that possibly contributed to it was that I was trying to figure out what the audience of the talk would be *while* I worked on it. Generally I just have a blanket "my talk is aimed at engineers" (even if they end up being understandable by non-engineers), but this time I ended up making it explicitly aimed at non-engineers as well. Figuring out how to do that was a bit of a pain for me, mostly because I had never given much tought to it before, and I ended up just mashing another hobby of mine in there: writing short fiction. So the entire talk went from a long exposition of the inner details of information flow security encodings in at least parametric polymorphic type systems (words!), to... a short and cohesive *story* about security.

It started like this:

<div class="rl-slide-show" data-start="1" data-end="10" data-keyboard-controls="false" data-format="/files/2021/10/talks-a-%2d.jpg">
</div>

And after many, many rewrites, it started looking like this:

<div class="rl-slide-show" data-start="1" data-end="8" data-keyboard-controls="false" data-format="/files/2021/10/talks-b-%2d.jpg">
</div>

Of course, the final talk ended up very different still. Not just in the illustrations, but also in how the story flows, the kind of emotions involved in the panels, and how the story and technical bits are intertwined.

The storyboard is the part of my "planning" (again, I "plan" by writing) that takes most of my time. Writing 50k words of stream-of-consciousness ramblings with a hundred of tangents? I can eat that for breakfast. Figuring out how to make something flow nicely and pleasantly, make sense, be cohesive, and fit the alloted puny amount of time one has to present a topic? Endless suffering.

This is also why this is the part that truly stresses me the most of this process. Editing is one of the most important things you can do. But, holy fuck, is editing *painful*.


## 5. Getting a feel of "practice"

So at this point I'll have a storyboard. For a 30 minutes talk, like my security type systems one, this was around 80 hand-illustrated panels. For a 40 minutes talk this might be a couple of 100s or a few dozens. It ends up depending a lot on how I decide to explain the topic I'm talking about, and which visualisations that topic lends itself to.

The only constant here is that this first storyboard draft will most definitely be *way above* the amount of information I can comfortably fit in the alloted time. So I'll practice it out loud a few times and try to figure out what I can improve. What I can cut. What I can change. I'll go back to storyboarding and practicing many times---sometimes just throwing the entire storyboard away and starting from scratch, because what felt *fun* on paper didn't work as well as I was expecting with recitation.

I guess one thing that I've hinted at in previous sections but haven't quite made clear yet is that, at each step of this process, I view technical presentations as an *artistic performance*. I view my planning as writing fiction. My storyboarding as writing comics. And my practices and actual delivery as spoken word performances.

Quite sadly, however, I never had much of a chance of taking vocal lessons or theatre classes, so that part doesn't work. *Yet*.

The thing about artistic performances, however, is that you're not always interested in letting people leave with some specific knowledge imparted on them. A lot of artistic performances, like fashion, live in the realm of self expression. Or, like illustration, are very *open* for different interpretations.

On the other hand, a lot of people who watch a technical presentation often want to get something more practical out of it. Tell them you're going to entertain them for the next 30 minutes with an artistic performance, and that it's up to them to decide what to do with that, and they'll most likely ask why you're wasting their time.

Anyway!

So, at this point, how many people will have seen whatever I'm working on? That's right: just me. To be fair, circumstances were a bit different this time around, but in general, because I see my presentations as a form of artistic expression, I really just make them for myself first and foremost. Not for others. And it feels really weird to show other people things I'm not that happy with yet.


## 6. Researching

I research by writing and experimenting, which is why "research" comes so late in this process. Of course, this *does* mean that I can only choose talk topics I'm comfortable enough with drafting without doing any extensive research first. If I were to talk about history of programming languages, for example, I'd have to move the research phase way up.

But what does this "research" entail anyway? Quite a few things!

  - A way of fact-checking whatever I'm talking about, so I can make sure I'm still up-to-date with the topic and my memory isn't playing tricks on me (as often happens).

  - A way of grounding whatever I'm talking about on a concrete timeline. Nothing that I talk about is ever going to be novel, and for me it's very important that I make this explicit to others.

  - A way of introducing people to cool research work and researchers, so people can further immerse themselves in the topic of their own accord, if they so desire. I do try to cite at least one woman researcher's work that's related to what I'm talking about, just because a lot of people I talk to are not even aware of women in the field who aren't Ada Lovelace---and yes, I do mean there are people out there who don't even know Barbara Liskov.


## 6. Practicing with others

Once I have some draft I'm okay with, I run the work-in-progress presentation through some other people to figure out how others feel about the topic. In art there's always a tension between what you want to express and what people want to get out of it, so it's ultimately up to you which side you want to lean towards.

For me, it's just doing whatever I feel like doing. So as much as my presentations may contain educational stuff, I'm more concerned with the kind of experience I'm building than with what people may take out of it---that is, my presentations will tend to be more open to interpretation. And I understand that might not be everyone's jam.

I generally do one or two of these rounds with other people, and try to incorporate their feedback if it aligns with the direction I'm going for. This time the circumstances were a bit different and I've done several of these, which had the added bonus of being able to test more things and explore a few things I wasn't entirely confident I could pull off.

(Sadly I am too shy to repeat this ever again. I'm too awkward to talk to people, let alone demand(ask nicely) them to give me some of their time)

As with my self-practices, each round of these will restart the entire writing
process. Most of these practices will still use the storyboarding version,
not the actual slides, which will inevitably result in a lot of "your handwriting is a bit hard to follow" feedback.


## A. Social responsibilities

These days, I hold a strong belief that if I do something that's somewhat prominent (i.e.: it's not just my own tiny personal hobby), I should at the very least try to be aware of social systems such as racism, ableism, and sexism, and how they both impact my work, and subsequently how my work impacts society.

Social systems and biases are a complicated topic, of which I only have a very tiny superficial understanding. It's not like any work I present is going to single handledly end racism---or really have any substantial effect on it. But it can definitely make things worse than they already are, and that is something I personally would like to avoid.

So I thought it was important to at least have a small section of notes on this, because it does impact how I approach writing these days.


### A.1. Representation

Who gets to do software engineering? Who is it for? A small part of the answer to these can be found by looking at the line-up for tech events in general. That's what we're advertising as "these are the people who make technology---this is what they look like".

An even smaller portion of these answers can be found by looking at the content in these people's presentations. What kind of imagery they use? What kind of faces are there? What kind of metaphors drive their content?

I can't really make much of an impact on the line-up of tech events, but I can at least try to be mindful of how I present my topics. And being mindful of how I present my topics requires me to at least be aware of the social systems that keep certain groups away from---well, away from pretty much all prestigious places in society, honestly.

So I've been trying to not only pay attention to the kind of language I use to talk about things, but also to what kind of illustrations I go with. I keep realising that I wrote an entire presentation, and then every single character in it is a thin, abled, light-skinned woman.

I've spent most of my life only drawing Japanese idols and anime girls, so I'm still learning how to draw everything else. And things like "this character is a black woman" don't really come naturally to me---so whenever I write something these days I try to be very intentional about race, disability, and body shapes in order to overcome this default and actually have characters that cover a larger portion of society.

I'm still learning about a lot of things, though, so I limit myself to the topics I'm comfortable with covering with at least some confidence (and a lot of research).


### A.2. Accessibility

None of my talks are very accessible to blind people because a really big part of them is conveyed in illustrations. Even the metaphors I use are very visual. This is something I want to address at some point, but still haven't figured out how to best approach it.

Should my talks be accessible to blind people, though? Heck yes they should. But I'm still unsure of how to approach this on stage. This time I tried to be a bit more redundant with what I speak, but being a very content-heavy talk for 30 minutes didn't make this easy, and I can probably do a lot better with more practice.

Outside of the stage, though, my current (at least initial) plan is to complement the current "share the slides + abstract and links" thing with having the talk contents in prose format, and with expanded metaphors.

But I haven't decided yet how I want to approach translating my illustrations. Diagrams aside, my illustrations don't really contribute anything to the content itself, their only role is to enrich the visual aesthetics and flow. You can't have "visual aesthetics and flow" in a screen reader, but I also never gave it much thought before on what I want to convey *non-visually*---having functional descriptions for them would just break the flow of the prose and be incredibly annoying.


## Conclusion

**TL;DR:** I write a bunch of random stream-of-consciousness stuff while thinking of how I would speak on stage. Then I turn that into a comic storyboard of the same presentation and keep cutting and changing stuff until it makes me happy. I try to be socially conscious of whatever I write and draw because that's important for me. And I present whatever comes out of this to other people to at least figure out how they feel about it, before I do it on stage. Research probably happens at some point. I end my suffering by drawing a bunch of stuff and putting it together in Google Slides or something.

Easy-breezy.



[pantser]: https://blog.nanowrimo.org/post/1308206994/the-great-debate-are-you-a-planner-or-a-pantser

[world building]: https://en.wikipedia.org/wiki/Worldbuilding

[glass]: https://robotlolita.me/talks/klarna-loves-erlang/
[jsvm]: https://robotlolita.me/talks/queer-js/