---
layout: post
title:  We're Doing It All Wrong!
snip:   Computer Science is all messed up, and here's why.
---

Use numbered headers: True

<!-- * * * -->

Recently a lot of people have been preaching that we “teach our kids how to
**code**,” which is a lovely idea except for the part of *coding*. You see,
it's 2014 and almost every little introduction to computation will start with:
“Here's how you destroy the world. Now I'm going to teach you how to destroy
the world many times; loops incoming!!1” which as you would have guessed is
astoundingly wrong.

I then
[voiced my complaints about this](https://twitter.com/robotlolita/status/433042231021563905)
which generated an interesting discussion. Of course I do agree that people
need to be literate about computers, and that they should know how to talk to
computers. The whole problem are us, programmers. We fail as a profession so
much, and end up blaming everyone else for *not getting how to play
computers*, which **we** shouldn't even be doing to begin with!

So, in this article I expand on what's wrong in introductory courses to
computer science, and how we can do better if we actually want people to learn
things and design correct programs.


# Table of Contents
 *  TOC
{:toc}


## Introduction
<!-- Frame the problem -->

Many people have voiced their complaints about the state of Computer Science as
a whole. You can see it in [Bret Victor](http://vimeo.com/71278954),
[Jonathan Edwards](http://alarmingdevelopment.org/?p=797),
[Paul Philips](http://www.youtube.com/watch?v=TS1lpKBMkgg), and lots of other
bright people who aren't satisfied that most of the tools we use today in our
field have not evolved in the slightest since the 70's. Likewise, the state of
introductory courses to Computer Science is laughable, if not downright
depressing. In fact, it's so bad, that things like these happen all the time:

<blockquote class="twitter-tweet" lang="en"><p>Every time I&#39;m teach a newbie and they give me the &quot;Seriously, it&#39;s 2014 and that&#39;s how it&#39;s done?&quot; look I die a little on the inside.</p>&mdash; deech (@deech) <a href="https://twitter.com/deech/statuses/430109164866527232">February 2, 2014</a></blockquote>
<script async="async" src="//platform.twitter.com/widgets.js" charset="utf-8">
</script>

It's even worse when you consider people's expectations, with what's possible
today, and with what we teach them:

<dl>
<dt>What they expect</dt>
<dd>
{% highlight smalltalk %}
Computer make me a sandwich
{% endhighlight %}
</dd>
<dt>What's possible</dt>
<dd>
{% highlight smalltalk %}
Computer make me sandwich
{% endhighlight %}
</dd>
<dt>What we teach them</dt>
<dd>
{% highlight java %}
package really.boring.stuff.goes.here;
import more.boring.stuff.TheComputer;
import meh.why.TheAction;
import you.gotta.be.kidding.TheSandwich;

public class NowImmaDestroyTheWorld {
  public static void main (String[] args) {
    TheComputer computer = TheComputer.makeMeABrandNewComputer();
    computer.initialise();
    TheAction action = new TheAction();
    action.setWhat("make");
    action.setForWho("me");
    TheSandwich sandwich = new TheSandwich();
    action.add(sandwich);
    computer.addAction(action);
    while (computer.hasActions()) {
      computer.executeNextAction();
    }
  }
}
{% endhighlight %}
</dd>
</dl>

So now we have a myriad of problems, because the first thing we expect people
entering Computer Science is to play computers (which is rather silly, since
the computer is there exactly for that), and we get mad at them for not
“getting” it, or blame them for not being interested in the field.


## The curriculum is the problem
<!-- What's wrong with the current CompSci curriculum -->

The major problem of introductory courses is, surely, the curriculum. To quote
Paul Philips' “We're Doing It All Wrong” talk:

> That's what I mean when I say we're terrible as a profession, because it's
> sick! It's sick! Like, new kids... I'm teaching a class at my daughter's
> school, and you know, they don't have any enormous amount of programming
> expertise, and then they go to CodeAcademy or whatever and the first thing
> they're teaching is like “Here we go~” with a loop and an `i` counter. **Why
> is this the first thing we're teaching them!?** This is like the worst thing
> to put into their heads!
>
> — Paul Philips, at Pacific Northwest Scala 2013

Mainstream imperative programming languages complect state and time, and force
people to not just play computers, but keep a whole timeline in their heads to
be able to say "Oh, so now `i` has this value, but a second ago it had this
other value and...” You can't expect someone that don't know anything about
programming yet to just “get” this madness, since it's an overtly complex
concept, and shouldn't be introduced before intermediary courses in programming
— in my humble opinion, this is something we should never need, in fact, that's
a job for computers and your compiler.

Other problems arise from the choice of programming languages to teach
particular concepts, and the way such concepts are explained. Object
Orientation is usually taught using languages that don't have a reasonable
support for this computational model, such as Java or C++. There are courses
who don't even introduce people to simpler and more powerful concepts, such as
generic programming and higher-order functions.


## A better curriculum
<!-- What a good curriculum for CS101 could look like -->

So, it's clear that to teach people programming we need a better curriculum,
one where simpler concepts are taught first, and complex concepts are taught
much latter. Both [How To Design Programs](http://htdp.org/) and
[Structure and Interpretation of Computer Programs](http://mitpress.mit.edu/sicp/)
provide interesting curricula for introductory courses, 

In any case, 

## Exploring computations
<!-- How tools and immediate feedback can aid learning -->

## Conclusion

## Additional reading
