---
layout: post
title:  "No, I Don't Want To Configure Your App!"
snip:   For the love of whatever you believe in, stop making applications that require the user to spend hours configuring stuff before they can do anything useful with it!
redirect_from:
  - /2016/01/09/no-i-dont-want-to-configure-your-app.html
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
beings) you believe in—even if you don't. And then, if you're very lucky
and the stars are properly aligned in the sky, you'll be able to
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
tools suck completely (or well, most applications, really[^1]), let us
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
  of them. Applications just get the job done. They're like the coffee
  machine on the office: you press the button, delicious coffee
  magically appears in your cup.

Given these definitions, we can only conclude that neither WebPack nor
Babel fit the definition of an *Application*, they hardly fit the
definition of *Framework* either, so that only leaves us with
*Library*.

This is hardly surprising considering that these tools come from the
same community that defines “transpiler” in the same way “compiler” is
defined in literature, then says the words are not synonymous.

> <strong class="heading">Hypothesis</strong>
> Programmers don't know the meaning of words.
{: .note .trivia }



## The way we think about Apps is wrong

The title says it all. My job here is done. Thank you for reading.

Or maybe I can be a little more helpful. Let's see...


## Applications are about *experience*

Let's go back to the coffee machine analogy for a second.

These are very neat machines. They have one button that says "Get
Coffee". You press it, things happen, you get your coffee.

![](/files/2016/01/gay1.png)
{: .pull-left .bring-to-top }

You are happy and gay.

![](/files/2016/01/gay2.png)
{: .centred-image .special-image-1 }

But... what if you want your coffee in a different way? The coffee
machine could add more buttons. Maybe a button where you select if your
coffee will have sugar or not. Maybe a button where you select the
amount of milk you want to put in your coffee. Maybe a button where you
select if you want cream or not. Maybe a button where you can get *tea*
instead of coffee! Maybe...

At this point people have to do so many things to even get something to
drink that it feels just as overwhelming as brewing coffee yourself. Not
only that, you now need a *manual* just to operate the machine.

![](/files/2016/01/sad1.png)
{: .pull-left .bring-to-top }

Sadness and frustration fill what seems to be a way too tiny
body for the amount of negative feelings this evokes.

![](/files/2016/01/sad2.png)
{: .centred-image .special-image-2 }

If you compare the experience of using both coffee machines, even if
the former doesn't give you the exact kind of coffee you want, *you
are still far better off*.

> <strong class="heading">Hypothesis</strong>
> Humans are bad with choices, and they'd rather not make them.
{: .note .trivia }

Even though this is common knowledge, computer applications still
insist in being the latter. We can compare how it feels to use Babel v5
against how it feels to use Babel v6.

This is Babel v5:

![](/files/2016/01/babel5.png)
*Things with Babel v5 Just Work™*
{: .centred-image .full-image }

And this is Babel v6:

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
**actually** install the compiler:

![](/files/2016/01/babel-w-h-y.png)
*I have no words*
{: .centred-image .full-image }

> <strong class="heading">Hypothesis</strong>
> Programmers are just terrible with logic.
{: .note .trivia }

So, after reading the two links provided in that note (one of which
tells you absolutely nothing about how to solve the problem you just
saw, and only serves to make you more confused and frustrated), you
install 200MB worth of data[^2] just to compile arrow functions and
array spreads so they actually work in your environment. You also need
to create some kind of text file that you have no idea where to, which
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

So, how do you create applications that don't suck, and make your users
want to never have known what a computer is? Well, the
[Human Interface Guidelines from ElementaryOS](https://elementary.io/docs/human-interface-guidelines#avoid-configuration)
are a very great place to start. If you copy everything there, even if
you don't design an ElementaryOS application, your application will
likely be **actually usable by human beings**.

I can't stress the **human** part of “human-computer interfaces”
enough. Please, think about humans when you're designing something that
you want them to use.

> <strong class="heading">Hypothesis</strong>
> Programmers employ robots in their HCI tests.  
> <small>(T-They do tests to at least figure out if their things are
> usable, right...?)</small> 
{: .note .trivia }


### 1. Convention over configuration

The ideal application is one that works out of the box. No configuration
needed. No way of wasting time. Sometimes certain pieces of data are
necessary to get the application get up and running. What do you do?

> Rule #1: If I need to configure your application, you're doing it
> wrong.
{: .highlight-paragraph .pull-in }

“Uh, ask the user to provide that information?”

That's the one thing you **do not** do. Most likely this information is
already available for you:

- “I need the user's github repository so I can present a list of issues
  whenever they—” parse it from Git or whatever other thing you
  can (`package.json` already has that information!);

- “I need the user's name so I can associate it with—” ask the OS for
  that information.

- “I need the directory where people put their dependencies so—” come up
  with a convention for it, `node_modules` in Node is a great one. Use
  it.

- “I need people to provide a tool to open .xyz f—” associate the
  extension with external tools, suggest to download and install said
  tool whenever you see a `.xyz` file.

- “But I—” GET THAT INFORMATION FROM **SOMEWHERE ELSE**.

Okay, sometimes there are pieces of information that aren't already
available somewhere in the computer. “For those cases I just ask the
user to provide it... right?” That depends, is it absolutely required
that the user provide such information in order to **run the application
at all**? If so, you're probably doing something wrong. Try packaging
all of the things that are required to run your application together,
instead.

“But at some point in time people will need a different configuration
*profile*, and—” sure. Give them a tool to configure that **if and
when** they absolutely need to, and guide them through choosing
the best settings for their use case. Just don't use configuration
files. Don't require your users to edit configuration files by hand.


### 2. Hold your user's hand through using your app

Ideally, an application should work by just running it. Sometimes,
however, that's not really possible. Consider the `nvm` application, for
example. It's a tool to manage Node versions, so how would it know what
version you want to use if you don't provide it?

> Rule #2: If you really need to, hold your user's hands through using
> your app.
{: .highlight-paragraph .pull-in }


If you type `nvm` in the command line, you'll be presented with an
overwhelming amount of information:

![](/files/2016/01/nvm.png)
*This is seriously too much. It doesn't even fit in one screen*
{: .centred-image .full-image }

Worse than that, this text tells you nothing about how you can
**start using** the application. But there's a `nvm use <version>` in
that list, and that's exactly what you want, right? You just want to use a
particular version of Node. So you try it:

![](/files/2016/01/nvm2.png)
*Uh... how do I use it, then?*
{: .centred-image .full-image }

It says “version 5.0 is not yet installed”, which is not a very helpful
thing to do. You're there reading this as "Hey, there's a problem," and
waiting for it to tell you something besides the obvious. You shout back
“Okay, I know that, but how do I fix it?” Nothing happens. So what do
you do? You read *more things*.

Back to the first wall of text, there does seem to be something like
`nvm install <version>` in the list. It at least seems to fit the
cryptic error description above, so **maybe** they are related? You
don't know, the text doesn't tell you in which order you have to run
things (why separate things in steps at all if you need to run all of
them anyway?!).

“Okay, lemme try this one.”

![](/files/2016/01/nvm3.png)
*Wow, am I supposed to just run `install`?*
{: .centred-image .full-image }

You ponder a bit about why the application decided that it was a good
idea to include two commands that do the same thing, but only one which
works. Nevertheless, you settle for the fact that things (at least
apparently) work now.

And then you open a new shell to run a different application, so of
course that application also depends on Node, and:

![](/files/2016/01/nvm4.png)
*But... it was working just fine a couple of seconds ago!*
{: .centred-image .full-image }

You stare blankly at your screen trying to understand what just
happened. Node was working just fine, and then it wasn't. Maybe nvm is
just terrible and breaks randomly? You decide to try `node --version` in
the other shell, which to your surprise gives you what you expect:
`v5.0.0`. “Am I just supposed to run `nvm install <version>` in *every*
shell I open!?”

You decide to run `nvm install <version>` again just to test your
theory:

![](/files/2016/01/nvm5.png)
*It works. Really?*
{: .centred-image .full-image }

You're flabbergasted. Never in your life you would have thought that
people would try to make it so hard for one to use things on their
computers. Then you remember your previous experience with Babel. “Okay,
*maybe* they would,” you conclude, with a heavy sigh.

But there **must** be something else, right? They can't just expect you
to run `nvm install <version>` all the time (actually `nvm run <version>`,
but you don't know that, it didn't seem to work for *you* when you tried).

You go back to the first wall of text, searching for anything that would
hint at not having to do this work all the time. `nvm alias default <version>`
catches your attention. It does mention "default. node. shell", after
all. Those are, like, keywords, right? You decide to give it a try:

![](/files/2016/01/nvm6.png)
*Welp, why would you require all this?*
{: .centred-image .full-image }

“Oh goddess, finally!” you exclaim, exasperated. You feel as if a major
weight had been lifted from your shoulder, but you're too frustrated
with how bad computers are to think properly about this. “Now I can actually
move on and get some work done,” you conclude, grumbling.

Could this have been different? Sure, let's look at another quite
possible interaction between the aforementioned human and nvm. Let's
assume that nvm decided that their goal is to help people manage their
Node versions. With this goal in mind, nvm has traced a very common use
case for new (and long-term) users of the application:

- You download the `nvm` application because you want `nvm` to install
  and configure different Node versions for you.
- You care about having a default node version, after all, since nvm is
  going to be managing that.
- You care about running node with the least amount of commands
  possible. Ideally you'd just write `node` and things would work.

You start with running `nvm`. The application notices it can't actually
get any work done for you, so it suggests some common actions:

![](/files/2016/01/nvm7.png)
*A more helpful way of telling your users they need to do something*
{: .centred-image .full-image }

You note that it's still necessary to configure `nvm` for it to work. An
interactive screen where the application suggests installing the
`stable` version for you (which is a good default) would allow you to be
done with this configuration biz faster. Nonetheless, this is already
a huge improvement over the previous screen. It at least *tells you*
what you have to do to get it working.

![](/files/2016/01/nvm8.png)
*One command to rule them all*
{: .centred-image .full-image }

Oops, you didn't have any version of Node installed before running
`use`. But the command acknowledged so and installed the version for
you. **It was the only sensible thing to do**, there was nothing else that
*could* be done there.

> <strong class="heading">A quick reminder</strong>
> When your application sees an error, and there's only one way to fix
> it, **fix it**.
{: .note .trivia }

After installing it, you're asked if you'd like to make the version we
just installed your default Node version. It dutifully notes that you
can change it at any point in time, if you want to. Running `npm use <version>`
 is a common thing to do—it's the whole point of the
application. Given this, it's only reasonable to give you an option
of reducing that work.

“B-But this doesn't apply to every program, right? How do you do this
for a programming language's implementation?” An application developer
cries. Well, here's an example from
[Amber Smalltalk](http://amber-lang.net/learn.html)

![](/files/2016/01/amber.png)
*Interactive tutorials for learning PLs are a really good idea*
{: .centred-image .full-image }


### 3. Things will fail, tell me how to fix it!

The best way of handling unexpected actions in your application is just
fixing it for the user and proceeding to do what the user wants—if you
can solve it in a sensible manner. This is not always possible, however.

> Rule #3: If anything goes wrong, you **must** help your users fix
> those problems in the best way possible.
{: .highlight-paragraph .pull-in }

Consider the following example:

![](/files/2016/01/v8.png)
*v8 has one of the worst error messages I've ever seen*
{: .centred-image .full-image }

So, `JSON.parse()` says “Sorry, I can't parse this, there's a `b`
here”. A `b` WHERE?! What should have been there? Do you realise there's
like two `b`'s in this code? Which one is wrong? Are both wrong? How do
I fix this?

As you can see, v8's error messages, even though they have improved a
little bit, remain largely useless. This, in particular, is one of those
errors that a little bit more of work on your JSON parser could actually
give the user a very useful error message:

![](/files/2016/01/v82.png)
*A few simple changes to the parser and you can get this*
{: .centred-image .full-image }

Now, not only the error message helps you understand **what** is wrong,
it also tells you how to fix it. Telling the user how to fix something
is desirable, but not always possible. Still, one has to at least make
some effort to tell the user what's wrong, in a way they can understand,
instead just screaming “I'm sorry Dave, I can't do that.”

Speaking of usable error messages,
[Elm](http://elm-lang.org/blog/compilers-as-assistants) has a
[very good blog post on the subject](http://elm-lang.org/blog/compilers-as-assistants),
and also one of the most helpful error messages, as far as static
compilers go:

![](/files/2016/01/elm.png)
*The above image is shamelessly stolen from Elm's blog post*
{: .centred-image .full-image }



### 4. Stop thinking about documentation!

Documentation is good for libraries and frameworks. Documentation is
**terrible** for applications. If you think that your application really
requires documentation, it's too complicated, and it's going to make
your users frustrated.

This is true because it's on [XKCD](https://xkcd.com/1343/):

![](http://imgs.xkcd.com/comics/manuals.png)
*I rest my case*
{: .centred-image .full-image }

Instead of documentation, just have your application do its job by
simply running it. No configuration. No nothing. Just let the user get
the stuff done.

> Rule #4: Don't require users to read manuals before using your thing.
{: .highlight-paragraph .pull-in }

Apple gets it, you can just copy them:

<p><iframe class="centred-image" width="708" height="520" src="https://www.youtube.com/embed/G2YNqr-V-xM" frameborder="0" allowfullscreen></iframe></p>


## Conclusion

Computers suck.

Applications suck.

We can make them better.

But y'all aren't even trying for fuck's sake.

<small>(I'm guilty of this too)</small>


## Related articles/stuff

[Software You Can Use](https://glyph.twistedmatrix.com/2015/09/software-you-can-use.html)
: *Glyph*

[JavaScript Fatigue](https://medium.com/@ericclemmons/javascript-fatigue-48d4011b6fc4#.dy1w11on6)
: *Eric Clemmons*

[The Future of Programming](https://vimeo.com/71278954)
: *Bret Victor*

[A Whole New World](https://www.destroyallsoftware.com/talks/a-whole-new-world)
: *Gary Bernhardt*

[Self and Self: Whys and Wherefores](https://www.youtube.com/watch?v=3ka4KY7TMTU)
: *David Ungar*


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


- - -

<h4 class="normalcase borderless">Footnotes</h4>

[^1]: Yes. Computers are awful.

[^2]: I'm not even kidding: <img src="/files/2016/01/not-even-kidding.png">


<!--
Local Variables:
ispell-local-dictionary: "british"
fill-column: 72
End:
-->
