---
layout: post
title:  "Siren: A REPL Language"
snip:   Siren is an experimental prototype and context based programming language designed to be used in the REPL, in a similar vein to the Unix shell.
---

<h2>Table of Contents</h2>

  * TOC
{:toc}

## 1. Introduction

Very few programming languages are designed for a particular
**experience**. Most of them are designed to solve a specific problem,
be they general-purpose or domain-specific. But still, some are designed
to realise a particular vision of computing that goes far beyond just
solving problems people see today in existing approaches. A notorious
example of this is the Self programming language, whose vision has been
eloquently captured in
[Programming as an Experience: The Inspiration for Self][self-experience].

Siren's design is, similarly, driven by a vision of computing which has
as its central point the intent of delivering a particular experience of
interacting with the program. While in Self's case this experience is to
feel a program as a world of live objects, Siren attempts to provide a
view of a program as a repository of commands. In essence, this would be
a similar (but richer) experience than interacting with a computer
through the command line.

Siren doesn't really bring anything novel to the table as far as
programming languages are concerned, but it approaches programming in a
way that's very different from mainstream languages. This article tries
to describe this approach.


## 2. Interlude: Interacting with Computers

In the past, the only way people had to interact with a computer was
through the command line. Life was *great*. You could invoke any program
by its name, and then process the results with any other
program. They were composable. Sadly, another very important feature of
interfaces wasn't really there: there was no way of discovering how to
do what you wanted to do, so we could pretty much describe the command
line as some arcane magic thing of sorts.

Fast forward a few years and we get graphical interfaces. Now we didn't
need to remember the name of things, we could **see** them. Life was
*great*. Except every program just kind of did its own thing and it was
entirely impossible to make it interact with something else unless
someone programmed this interaction from the beginning. Programs got
bigger.

It's 2015, we still don't have composable graphical interfaces. Programs
now communicate through APIs, when they exist. But other than that they
are complete black boxes. You put things on them, it gets hot, you see
it getting hot, but you don't get food back. And this is pretty annoying
(also, I am hungry. But I digress).

One day, this person had an epiphany[^1]:

> Maybe we can solve one problem with another and win a victory for the
> Southerners, in other words—
>
> — James Madison, in Hamilton.
{: .highlight-paragraph}

What if we could not only interact with a computer in a compositional
way, but **also** have a way for the system to tell us how to achieve
the things you want to do?


## 3. Programming, Revisited

People write programs to have computers do things, but in most
programming platforms you get hardly any feedback while doing this. One
would start by typing words in a text editor, according to the rules
described by the language they're using. At certain points, they'd stop
using the text editor, and hop into their web browser to search the
documentation for the `String` class. Much later, once they are
satisfied with all the words they have written, they would bring in yet
another program to translate those words into something the computer can
understand, and finally run it, so they can see what the computer does
with that.

In this very simple interaction we had to use three entirely different
programs, and none of them knew anything about the context in which they
were being used. The computer also provided little to no help during the
entire process, which is not much different from how people used to
program with punch cards, except now we have smaller and faster
computers.

Interestingly, these same programmers will often interact with the
computer in a different way. They hop into their terminal emulators, and
start typing commands away. Each program they invoke immediately gives
them some feedback. Programs can tell the user how they can interact
with the program. When they notice that they need to use a sequence of
commands more often, they put that sequence in a file, and the file
becomes a new command that they can invoke, in the same fashion.

![](/files/2015/12/siren-01.png)
*Interacting with computers through the command line*
{: .centred-image .full-image}

The command line interface offers a much better workflow. There are
fewer context switches, and one can formulate shorter phrases, instead
of entire articles, before they get a response from the computer. If we
trace a parallel with real world communication mediums, the traditional
model of computing would be equivalent to sending a letter to a distant
pen pal and wait for their reply, whereas the command line model would
be much similar to chatting with your best friend over an instant
messaging service.

When you put the two approaches side to side, even though they use
roughly the same medium for interaction, the command line model can
provide much richer interaction just because it has a much faster
feedback loop. The major difference is that this enables the programmer
to **ask** things to the computer. One can have the computer correct or
explain things to them, ask about what they can do with some data, try
different things to decide which one to use, etc.

Now, making the feedback loop faster when programming isn't a novel
idea. It's been done over and over again in Smalltalk, Lisp, and other
languages. REPLs[^2] are, in fact, very popular these days, to the point
where you see them even for languages that are traditionally used in an
IDE, such as Java. But Siren, like older LISP machines, has this idea as
its very core goal.


## 4. Command Line, Revisited

I've mentioned before that I see the command line model of programming
in a very similar light to chatting with a friend over IM. This is
because programming in this context can be seen as a mutual exchange of
messages.









## References

[Programming as an Experience: The Inspiration for Self][self-experience]
: *Randall B. Smith, and David Ungar* —
  Describes the vision of the Self programming platform as a malleable
  world of objects, and how the language tries to achieve that.

[A Simple and Unifying Approach to Subjective Objects](http://dl.acm.org/citation.cfm?id=246311)
: *Randall B. Smith, and David Ungar* —
  Describes Us, a Self dialect that introduces the concept of
  "subjective objects", where the behaviours of an object are subject to
  the context in which they are perceived.

[Self and Self: Whys and Wherefores](https://www.youtube.com/watch?v=3ka4KY7TMTU)
: *David Ungar* —
  Describes the inspiration for, history of, and goals of the Self
  project (among other interesting things).


<div class="contact-footer">
    Quil has used emphasis for sarcasm in this article. What do you mean
    that's not <em>cool</em>?! Geez, okay. If you have any further complaints,
    enquiries, or just want to chat about stuff, you can contact the
    person who writes here through <a
    href="https://twitter.com/robotlolita">Twitter</a> or <a
    href="mailto:queen@robotlolita.me">Email</a>.
</div>


- - -

<h4 class="normalcase borderless">Footnotes</h4>

[^1]: 
    This was actually much before I became obsessed with Hamilton, but
    no one needs to know that.

[^2]:
    “Read Eval Print Loop” is an interactive program that can take
    expressions in some programming language, evaluate them, and show
    the result to the user.

[self-experience]: http://bibliography.selflanguage.org/programming-as-experience.html


<!--
Local Variables:
ispell-local-dictionary: "british"
fill-column: 72
End:
-->
