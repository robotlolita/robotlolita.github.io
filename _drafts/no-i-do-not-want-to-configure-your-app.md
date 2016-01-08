---
layout: post
title:  "No, I Don't Want To Configure Your App!"
snip:   For the love of whatever you believe in, stop making applications that require the user to spend hours configuring stuff before they can do anything useful with it!

---

> <strong class="heading">Warning</strong>  
> This blog post is a rant. A very. opinionated. long. and angry. rant.
{: .warning .note}


<h2>Table of Contents</h2>

  * TOC
{:toc}


There seems to be a very *interesting* trend re-emerging in software
development lately, influenced by Node's philosophy, perhaps, where to
use anything at all you first need to install a dozen of "dependencies,"
spend the next 10 hours configuring it, pray to whatever gods (or
beings) you believe in—even if you don't, and then, if you're very lucky
and the stars are properly aligned in the sky, you'll be able to finally
see "Hello, world" output on the screen.

Apparently, more configuration always means more good, as evidenced by
new, popular tools such as [WebPack](https://webpack.github.io/) and
[Babel.js's 6th version](https://babeljs.io/). Perhaps this also
explains why Java was such a popular platform back in the days.

> <strong class="heading">Hypothesis</strong>
> The popularity of a tool is proportional to the amount of time it
> makes their users waste.
{: .note .trivia }


## What's in an Application?

Before we proceed with our very scientific analysis of why programming
tools (or well, most applications, really[^1]) suck completely, let us
revisit some of the terminology:

- **Library**, a usually not-so-opinionated solution for a particular
  problem. Libraries **do things**, and they allow you to configure how
  things get done. They also allow you to combine stuff to do **more
  things**. Of course, you pay the price of having to configure,
  program, and combine things. And they won't help you get any of those
  three done.

- **Framework**, an opinionated solution for a particular
  problem. Frameworks do things **in a very specific way**, which the
  author considered to be good enough for the particular problem they
  solve. Frameworks can't be combined. They can't be configured. The
  only thing you can do is program on top of them. A framework helps you
  very little with programming on top of them, unless you stick close to
  whatever people have already done before—but then why are you doing
  those same things again?

- **Application**, an opinionated, properly packaged,
  *usable-out-of-the-box* solution for a particular problem. Applications
  do things **in one way, and one way only**. You can't change that. You
  can't combine them. You can't configure them. You can't program on top
  of them. Applications just get the job done. They're like the espresso
  machine on the office: you press the button, delicious espresso
  magically appears in your cup.

Given these definitions, we can only conclude that neither WebPack nor
Babel fit the definition of an *Application*. They hardly fit the
definition of *Framework* either. Thus, that only leaves us with
*Library*.

This is hardly surprising considering that these tools come from the
same community that defines “transpiler” in the same way “compiler” is
defined in literature, then says the words are not synonymous.

> <strong class="heading">Theorem</strong>
> Programmers don't know the meaning of words.
{: .note .trivia }



## The way we think about Apps is wrong

The title says it all. My job here is done. Thank you for reading.

Or maybe I can be a little more helpful. Let's see...


## Applications are about *experience*

Let's go back to the espresso machine analogy for a second.

These are very neat machines. They have one button that says "Go". You
press it, things happen, you get your espresso.

You are happy and gay.

But... what if you want your espresso in a different way? The espresso
machine could add more buttons. Maybe a button where you select if your
espresso will have sugar or not. Maybe a button where you select the
amount of milk you want to put in your coffee. Maybe a button where you
select if you want cream or not. Maybe a button where you can get *tea*
instead of coffee! Maybe...

At this point people have to do so many things to even get something to
drink that it feels just as overwhelming as brewing coffee yourself. Not
only that, they now need a *manual* just to operate your machine.

Sadness and frustration fill what seems to be a way too tiny
body for the amount of negative feelings this evokes.

If you compare the experience of using both espresso machines, even if
the former doesn't give you the exact kind of espresso you want, *you
are still far better off*.

> <strong class="heading">Hypothesis</strong>
> Humans are bad with choices, and they'd rather not make them.
{: .note .trivia }

Even though this is common knowledge, computer applications still
insist in being the latter. We can compare how it feels to use Babel v5
against how it feels to use Babel v6.

![](/files/2016/01/babel5.png)
*Things with Babel v5 Just Work™*
{: .centred-image .full-image }

![](/files/2016/01/babel6.png)
*W-What is this even supposed to mean?*
{: .centred-image .full-image }

So, as you can see, not only does Babel v6 not work at all, it still
leads to cryptic errors that give you no insight into how to solve the
problem.

> <strong class="heading">Hypothesis</strong>
> Programmers don't know how to help people fix things.
{: .note .trivia }

What do you do? Well, you ask around the Internets why something that
should work is not working. You spend time doing that. You have to read
the documentation of a thing that just says in its `--help` command
`"Usage: babel [options] <files ...>"`.

Once you get around to reading the documentation, you'll discover that,
even though you should have installed an ES6→ES5 compiler by running
`npm install babel-cli`, to get the compiler to work, you have to
ACTUALLY install the compiler:

![](/files/2016/01/babel-w-h-y.png)
*I have no words*
{: .centred-image .full-image }

> <strong class="heading">Theorem</strong>
> Programmers are just terrible with logic.
{: .note .trivia }

So, after reading the two links provided in that note (one of which
tells you absolutely nothing about how to solve the problem you just
saw, and only serves to make you more confused and frustrated), you
install 200MB worth of data just to compile arrow functions and array
spreads so they actually work in your environment. You also need to
create some kind of text file that you have no idea where to, which
format, or how it gets used, because nothing anywhere in the linked
pages (or any page in the documentation) says a thing about it.

> Did I mention that we're supposed to just accept all of this as
> “that's the way things are” because goddesses forbid you complain
> about it? Okay, cool.

![](/files/2016/01/babel6-take2.png)
*Things apparently work maybe who knows*
{: .centred-image .full-image }

So, what was so wrong with the previous Babel approach that they thought
this was a good idea? Well, nothing really. They could have just as
easily added a way to configure the program if you wanted to opt-out of
something, but instead they decided to burden **everyone** with making
the choice they had already made by installing Babel in the first place.


## How do we solve this?





- - -

<h4 class="normalcase borderless">Footnotes</h4>

[^1]: Yes. Computers are awful.

<div class="contact-footer">
    Quil has spent countless hours configuring things.
    She's sick of it. She just wants to drink some Irish coffee.
    Why must you torture this poor soul like this, people?!
    You can contact said
    person through <a
    href="https://twitter.com/robotlolita">Twitter</a> or <a
    href="mailto:queen@robotlolita.me">Email</a>. Bonus points if you
    bring her sweets.
</div>


<!--
Local Variables:
ispell-local-dictionary: "british"
fill-column: 72
End:
-->
