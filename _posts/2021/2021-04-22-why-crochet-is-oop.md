---
layout: article
title: Why Is Crochet Object Oriented?
---

I'm often in circles of functional programmers, and one very consistent
topic is "how object-oriented programming is the root of all evil, and
functional programming is nothing like it". Not necessarily with those
words, but to that effect in any case.

And things tend to take an awkward direction whenever I mention that
I like object-oriented programming. "Why?". It gets worse when
I say I'm building one. "No, really, why?". And then it gets confusing
when I throw terms like *pure* and *algebraic effects*. "No... wait, WHAT?"

I mean, aren't "purity" and "algebraic effects" concepts from functional
programming anyway? What kind of bullshit am *I* on? Well, let's put aside
the question and the fact that 
[programming paradigms aren't even that useful of a concept](https://cs.brown.edu/~sk/Publications/Papers/Published/kf-prog-paradigms-and-beyond/),
and let's look into Crochet for a moment.

What's Crochet? But, more importantly, **why** is Crochet? And **how** is Crochet?

<!--more-->

## How does one make programming safe?

Imagine the following scenario:

You want to do *stuff* with computers. In particular,
you want to build games, and interactive stories, and interactive music,
and interactive art. Well, art in general. This might not be you, but this
is Crochet's target audience---artists and writers who might want to use
computers as a *creative medium*.

Now, because you want to do stuff. And you want to do some fairly complex
stuff---art is a lot of work---you're not going to do it *all on your own*.
Rather, you're going to rely on other people's work. You're going to use---
gasp---libraries.

Sometimes these libraries are going to be written by the maintainers of
Crochet. Crochet *does* have a standard library (it needs to, but let's
talk about that later). But it's unrealistic to think that a standard
library could provide everything an end-user needs---for starters, I
know nothing about music, how am I supposed to design a language for
interactive music?

So we need to face the harsh truth that if Crochet gets users, *all* of
them will get things done by downloading random pieces of arbitrary code
from obscure places in the internet **and** running all of them in their
machines. The same machines they will later on use for internet banking,
online shopping, etc.

I believe that, as tech people, we have some sort of obligation to ensure
that the things we produce do their best to protect our users' security
and privacy. Crochet is a powerful programming language that encourages
non-professional programmers to download arbitrary programs from obscure places
on the internet **and** run those programs in their machines. (Literally.
One of the core tenets of Crochet is enabling a culture of remixing
digital, interactive art).

Which means that something needs to be done so users of Crochet can safely
run these programs in their computer, even though Crochet is a powerful
programming language.

"Wait, Crochet is **powerful**?"


## Fine, NOBODY gets any power

Luckily I did not need to invent anything here. 

Sure, Crochet is a powerful
programming language. By which I mean that programs in Crochet are able to
read files that possibly contain personal data, upload this personal data
to random servers on the internet, encrypt files in users' personal directories
and ask for ransoms, watch all keyboard signals and applications being used,
and so on, and so forth.

Just like most other programming languages out there.

So the first step is to remove all of that power. Make Crochet a powerless
language. Nobody gets to do *anything* in it. I mean, sure, they can do
pure computations, as a treat. But output things on the screen? READ FILES?
At best they can spin the fans until the computer gets hot---they can't
observe it.

But a powerless programming language is also useless. So Crochet programs
*need* some power. And some programs may need more power than others.

Now, there are two basic theories of granting power to programs:

  - **Access Control Lists**: If I run this program as myself, then the
    program shall be able to do anything I can, on my behalf.

  - **Capability Security**: If I run this program as myself, then the
    program shall not be able to do anything... *unless* I delegate some of
    my powers to it.

So capability security, an old concept that has hardly found any use outside
of mobile operating systems---sadly---is the way to go. Using capability
security allows us to give the user the power to control how much they
trust a program. If they never give a program any file system writing
capabilities they don't need to worry about their files being encrypted
by malicious actors.

Well, they still have to worry about their personal
data being uploaded to the internet if given read access to all files plus
unrestricted network access. But a start is a start.


## Programs are not libraries...

Of course, the bigger problem here is that we're not *just* encouraging users
to run arbitrary programs in their machines. We're also encouraging them to
take arbitrary programs from the internet and put that straight into
*their own programs*.

Should Alice grant file-writing powers to a program she wrote? HECK YES.

...except Alice is using this one component written by Bob in her program, you see. And Bob is kinda shady, idk. Wouldn't trust them.

So the problem is that, even with capability security, we're still thinking
about security in terms of *whole programs*. As if the entire program should
be held to the same standards of scrutinity and enjoy the same powers.

[This turns out to be a pretty bad idea](https://blog.npmjs.org/post/180565383195/details-about-the-event-stream-incident).

Luckily, again, I didn't have to invent anything to solve this, because
the Object Oriented community had already solved it... in 1966. Sure pretty
much nobody adopted it. And no mainstream language has it. But Java only added
lambdas, a concept from 1935, a handful of years ago. So I'm sure that, given
another couple of centuries or so, we might...

In all seriousness, though. Object-Capability Security is a very neat idea.
It's also fundamentally incompatible with all mainstream programming languages.
And it *is* fundamentally incompatible with FP as generally
implemented and described.

What makes Object-Capability Security (OCS) secure---and also incompatible with all
of this---is that the approach it takes to things is, again, to just strip
programs of all their power. But we must be able to provide powers to things,
and OCS does so by the following mechanisms:

  1. An object is a capability: it is an unforgeable token that grants people
     power to something.

  2. The object's methods **are** the powers it grants. There's no need to
     separate the definitions and figure out how to map the token to the
     powers. And how to get the powers in the hands of the right people. Or
     how to combine different powers to grant them at once. It's already there.

  3. Power can be granted by passing references around. The initial object
     (e.g.: the object with the "main" method) gets all of the powers granted
     to the program. Every other object gets **no power**. The initial object
     decides who gets some of the power, why they get it, and how they get it.

  4. Power can be **revoked** by passing ephemeral references---that is,
     references that will at a later point cease to exist. Maybe because it
     has been used off. Maybe because it was only valid in a certain time window.

In order for all of this to work, you first need to make your language powerless.
That is, **by default** any code in the system is required to not be able to
do anything---except for pure computation. Most mainstream programming languages
use a global namespace. Most mainstream programming *idioms* rely on this
omnipresent power. There's no way to apply OCS to them without a huge shift
in both how they are designed and how people program in them. Bummer.

But that doesn't necessarily preclude a functional language to be designed for
this form of security mechanism... right?

Well, not *necessarily* so. However,
point (1) is often absent in most functional languages. Functional languages
will generally push you towards the idea that every object has some sort of
structural equivalence---because they're just values. Observing differences
in values is generally frowned upon because it breaks some fundamental ideas
about optimisation and composition.

Functional programming also tends to be *huge* on reflection. And, of course,
not [Mirror-based reflection](https://bracha.org/mirrors.pdf). Almost every
mainstream functional language will have pattern matching and *then* go on
to deconstruct any possible kind of object that could ever exist in the
language---and also construct them. As it turns out, if you
need to harden your code against internal attacks by malicious code *in* your
application, this is not the greatest thing to do. Typed functional languages
at least mitigate some of this if they manage to not make all types global.

Still, first-class functions are unforgeable references. They are (if allowed
to be compared at all) compared by reference, not by their [extensional equivalence](https://en.wikipedia.org/wiki/Extensionality).
Well, maybe in some obscure theorem prover functions are compared by their
extensional equivalence---I don't know of any, but I'm not huge on provers.

In a sense, [first-class functions are actually objects](https://wcook.blogspot.com/2012/07/proposal-for-simplified-modern.html).
Not that this is an agreed-upon definition or anything. But they can be
*seen* that way. And seeing them that way can be useful in some particular
cases---this is one of them. We could think of first-class functions as
capabilities.

But then comes (2). Powers. We have a capability, sure, but how are we going
to go about granting powers? Will we make functions available to every
piece of code and then add a "please provide your capabilities (functions) as an
argument here" to **every** function call? That's possible in theory, sure, but it is
a **terrible** interface for secure programming, and it makes points (3) and (4)
impractical.

Incidentally, interfaces are extremely important for the "secure" part of
"secure programming". Because programming is often done by humans, which will
take unsafe shortcuts (or just not use something) if it gets too cumbersome.

[Implicit calculus](https://homepages.inf.ed.ac.uk/wadler/papers/implicits/implicits.pdf)
could help, but functions are not a great way of grouping functions.
We could, maybe, use modules? You know, little bags of functions. We promote
them, pass them around with all of the functions. Maybe allow them to be
constructed dynamically. Sounds great? Well, [generative first-class modules](https://people.mpi-sws.org/~rossberg/f-ing/)
are objects, so now we're back to object-oriented programming anyway.


## What if we were object-oriented... without objects?

So if Crochet wants to adopt Object-Capability Security---and it does, because
I'm not knowledgeable enough about security to invent a new security theory and
spend the next four decades proving that it *is* actually sound---it has to
also adopt object orientation. That's just the way these things are.

The thing about OCS, however, is that it *precludes* most of the things people
associate with object-oriented programming:

  - Mutating objects? You can't do that. Mutation is a *power* because it can
    be observed by attackers. **nobody** gets to mutate anything. All functions
    (methods) have to be pure.

  - Inheritance? Well, sure, but you can't actually do any of the wacky
    reflection stuff. At best you get to know that you can treat `x` as
    `Iterable`. But what is that buying you? Nothing, really.

  - Dynamic dispatch? Oh, okay, you need this one.

But dynamic dispatch is a good idea anyway, and no, you cannot change my mind
on this one.

*\*Ahem\**.

So Crochet gets to be an object-oriented language that *has* to be pure,
which means that a lot of the idioms that are common in functional languages will apply
here as well: you need tail-calls, you work with recursive algorithms primarily,
you mostly do data transformations that are operational, but not
[place-oriented](https://www.youtube.com/watch?v=-6BsiVyC1kM).

But then Crochet goes on and says: "Let there be no objects."

Well, not exactly. "Let there be no *objects*." In the mainstream sense of "object".
Remember: Crochet needs objects because they're capabilities. It
needs objects to group powers into these little bags that can be conveniently
passed around.

The problem, really, is how most Object-Oriented Languages *do* objects. It
doesn't fit Crochet's design vision. It doesn't fit Crochet's target audience.
It doesn't even fit Crochet's *tools*.

Incidentally, but unsurpsisingly, **tools** are a huge part of Crochet's design.
But we'll talk about that another time.

Anyway, the problem with objects in most Object-Oriented programming languages
is that they are closed. Generally. And they are also dispatching on only one
of the arguments. Now, I say "problem", but I really mean "problem (for Crochet)".
In an ideal world, it may make sense to give people control over what others
can and can't tack onto objects.

Sadly, the idea of fostering a remixing culture hinges on the idea of allowing
people to modify and extend *anything*. 
[Closed objects make this impossible](https://homepages.inf.ed.ac.uk/wadler/papers/expression/expression.txt),
and open objects with single dispatch make this painful (and impossible)---just look at Ruby's open classes.
And expecting people to modify the actual source code of the definition is a
security nightmare, as now there's no way to update components, and boundaries
are much less clear-cut for defining where capabilities should go.

By the way, [earlier iterations of Crochet](https://github.com/robotlolita/siren/blob/master/documentation/overview.md#safe-extensions-and-contexts)
toyed a lot with the idea of [contextual programming](https://dl.acm.org/doi/10.1145/2661136.2661147),
where dynamically scoped "contexts" are used to define and control
object extension. But it turns out that the lack of global coherence that is
inherent to it leads to many confusing situations that I did not want to deal
with. A similar issue applies to implicit calculus and parameterised modules.

And so Crochet goes with types (not in the sense Haskell uses types) along
with [multi-methods](https://www.youtube.com/watch?v=kc9HwsxE1OY).
This is very similar to what [Julia](https://julialang.org/) does, in fact.


## Sometimes we need to adapt things

Let's look at another simple scenario.

You're trying to write an interactive fiction. That is, a computer game
where you read fiction, and at certain points of it you can interact with
the fiction---and the narrative may change as a result of your interaction.

You might write some of the following code in Crochet:

```
action player take: (Item is item) do
  fact Item on: player;

  say: "You reach out for [Item name] and place
        [Item it] in your pocket. [inventory alongside-list: Item]";
end
```

In Crochet, [actions and facts](https://github.com/qteatime/crochet/blob/main/docs/technical-overview.md#simulations)
are part of the model simulation system used to define rules for games written
in the language (among other things). Here, we have an action that allows the
player of this game to interact with it by taking some kind of item from the
scenario and placing it on the player's inventory.

When the player does so, there's a text displayed saying that the item is
now with them, alongside other items they may have taken previously. For example,
if the player has taken the car keys, they could see on the screen:

> You reach out for the car keys and place them in your pocket.

Now, note that we've evaluated `Item name` to `car keys`, `Item it` to `them`,
and `inventory alongside-list: Item` to nothing. `_ name`, `_ it`, and `_ alongside-list: _`
are all functions (or rather, multi-methods).

Later on the player may choose to pick another item, and they'll see:

> You reach out for the phone and place it in your pocket. It sits comfortably
> alongside your car keys.

Incidentally, the person who's writing this interactive fiction did *not* write
the `_ alongside-list: _` function. They're just using it from another
writer who coded these little things for their own fiction and decided to share
it with their peers. The current writer gets that functionality "for free".

Sadly, the person who's writing *this* interactive fiction wants it to be read
in both English and Portuguese. Now, the original author of `_ alongside-list: _`
did not know Portuguese at all---nor ever intended for this function to be used
for anything but English. Heck, they did never intend for it to be *reused*. It 
was never *designed*---it just so happened that they found it useful when it
happened in their art, and they thought others may also find it useful.

Note that the fact that Crochet expects most reuse to be *completely accidental*
rather than having any kind of intention---remember, the target audience of
Crochet is **not** professional programmers; it's rather artists, writers,
and other creative people who want to use computers as a creative medium.
Having accidental reuse be the primary way of reusing code means that most
"good reuse techniques" fall flat. Crochet can't add Traits, it can't add
Type Classes, it can't add Interfaces. **All** of these concepts require
designers to be intentional about reuse, to think about all of the use cases
and edge cases, to design carefully an interface for their components.

None of those tasks are beyond non-professional programmers. They could
certainly achieve it with enough information if they put effort into it.
But that's not their goal. That's not why they're writing software. These
patterns of reuse will *never* arise automatically, and quite frankly people
will just revert to copy-pasting code, which makes security impossible.

So Crochet takes the "You can write anything. Share anything. Modify anything." route.
And it tries to make **that** secure. In this case, this writer has a few options.
One of them is to create a new `inventory` type for portuguese inventories that
inherits from the original `inventory`. This way they only need to redefine the
functions that include English prose.

Here's what this code would look like:

```
singleton inventory-pt is inventory;

command inventory-pt alongside-list: (Item is item) do
  let Items = self items;
  condition
    when Items is-empty =>
      "";
    when Items count < 3 =>
      "[Item it-pt]  [Items join-and-pt].";
    when Items count >= 3 =>
      "It's crammed with your [Items join-and-pt].";
  end
end
```

They also have to define `join-and-pt`, of course.

```
command tuple join-and-pt do
  Items join-separator: ", " final-separator: ", e ";
end
```

Now when they use `inventory-pt alongside-list`, they would see the text:

> Você pega o telefone e o coloca no bolso. Ele faz companhia para suas chaves
> do carro.

### Adaptation by overwriting things

Note that there's no information actually stored in either the `inventory-pt`
or `inventory` types. Rather, most information (and certainly all changing
information) comes from the global facts database. In this case, the fiction
likely has a logical relation declared as follows:

```
relation item* on: inventory;
```

Which is to say that there's a way in which many items can be "on" some 
inventory, but each item can only be at one inventory at any given time.
Relations are path-sensitive, and the `*` notation means that a particular
segment of that path can hold multiple values. The path branches as a tree
as you go further down its segments.

So a more natural way of solving this conundrum here is to rather rely on
this global fact database as a provider of the idea of "what language are
we using?", and then just replace the inventory functions to be language-aware.

In this case, there would be some global fact like:

```
enum language = english, portuguese;
relation language: language;
```

Which, again, is to say that for this fiction there will be one language
active at any given time, and it can be either "english" or "portuguese".

> <strong class="heading">Tangent</strong>
> One could also define an [effect handler](https://robotlolita.me/diary/2018/10/why-pls-need-effects/) for it.
> But facts are just easier to use and have more tools available for working with
> them and debugging them---it also involves zero computations and no idea of
> continuations.

Then the writer may go on to replace the `_ it` and `inventory alongside-list: _`
functions:

```
open the.other.writer exposing
  item it as _ it-en, 
  inventory alongside-list: item as _ alongside-list-en: _;

override command item it =
  match one
    when language: english => self it-en;
    when language: portuguese => item it-pt;
  end;

override command inventory alongside-list: (Item is item) =
  match one
    when language: english =>
      self alongside-list-en: Item;
    when language: portuguese =>
      self alongside-list-pt: Item;
  end;
```

Of course, it could be argued that making the function dispatched over
the `language` type, such as creating a new function
`inventory alongside-list: item for: language` would make it easier to extend,
but the point here is that writers *have* the tools to adapt these little
pieces to get their work done, and can then go back to focusing on whatever
artistic content they intend to produce.

Their end goal is not to design software libraries.

> <strong class="heading">Tangent</strong>
> Overrides in Crochet are still a work-in-progress capability, but the core
> idea is that they work as a *controlled* adaption mechanism, where you can
> replace parts of the system by other parts as needed without touching the
> any of the defining source code.
> 
> But libraries you include don't get this
> power handed out to them **by default** (you have to go and say that, yes,
> Bob's library is allowed to override this specific function), which prevents
> the all-too-common "prototype pollution" vulnerabilities in open-extension
> models such as Ruby's, Python's, and JavaScript's, which in turn means that
> it's harder for attackers to subvert the system for remote code execution---at
> least from this feature, without the user's knowledge, anyway.


## In conclusion

There are many other aspects to Crochet's security and how it uses
ideas from OCS and other concepts that I plan to cover in other articles.
But I hope that this short(?) write-up dispels some of the confusion around
why Crochet **needs** to be "object-oriented" in order to be secure.

It all boils down to Crochet's target audience (non-professional programmers wanting
to use computers as a creative medium), and the intended workflows, domains,
and modes-of-use that I've seen happen (emergent, but not purposefully designed,
abstractions, with copy-pasting for reusability and adaptation).

A lot of
programming languages and tools are not designed for these users. They're designed
for professional programmers who can take the time to worry about systems and
design and proper data-structures and type consistency and---the list goes on.
Which is not *wrong*, we do need those, too, but they're simply not designed
for non-professional programmers, whose "programming" aspect is... completely
incidental.

(It also has some of "Quil just wants to annoy functional programming people
who go about saying that OOP is terrible" tongue-in-cheek use of the term
as a taxonomy, but then that's pretty much my whole internet presence I guess...)


## Further reading

[Programming Paradigms and Beyond](https://cs.brown.edu/~sk/Publications/Papers/Published/kf-prog-paradigms-and-beyond/)
: *Shriram Krishnamurthi, Kathi Fisler* ---
  Argues for the use of notional machines rather than programming paradigms
  for understanding and talking about language behaviour. You should read
  it, and also get
  [The Cambridge Book of Computing Education Research](https://www.cambridge.org/core/books/cambridge-handbook-of-computing-education-research/F8CFAF7B81A8F6BF5C663412BA0A943D)
  if you can. It was one of my favourite recent reads.

[npm blog about the event-stream incident](https://blog.npmjs.org/post/180565383195/details-about-the-event-stream-incident)
: *npm* ---
  Honestly, I think the npm ecosystem has given us enough *mainstream*
  examples of how bad things can be when thirdy-party modules are added
  to an application---apparently this is now called a
  [supply-chain attack](https://en.wikipedia.org/wiki/Supply_chain_attack).
  Vetting every line of code you use is humanly impossible,
  so we need a different approach that does not require that.

[Mirror-based Reflection](https://bracha.org/mirrors.pdf)
: *Gilad Bracha, David Ungar* ---
  Reflection breaks pretty much every security property a programming language
  could hope to provide. Mirror-based reflection allows one to use reflection
  as a distinct capability, and finally reconcile reflection and security.
  Sadly not adopted by... almost every programming language out there---[Dart](https://api.dart.dev/stable/2.12.4/dart-mirrors/dart-mirrors-library.html)
  is possibly the only mainstream one (it has Bracha in the design team),
  even though [JavaScript tried to get them as well](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect)...
  but without removing the non-mirror based part.

[A Proposal for Simplified, Modern Definition of "Object Oriented"](https://wcook.blogspot.com/2012/07/proposal-for-simplified-modern.html)
: *William Cook* ---
  The term "Object Oriented" isn't very well-defined. And although Cook's
  definition here isn't widely accepted, I think it's an useful writing of
  what concepts *enable* other particular ideas often associated with OOP.

[The Implicit Calculus: A New Foundation for Generic Programming](https://homepages.inf.ed.ac.uk/wadler/papers/implicits/implicits.pdf)
: *Bruno C. D. S. Oliveira, Tom Schrijvers, Wontae Choi, Wonchan Lee, Kwangkeun Yi, Philip Wadler* ---
  The idea of the implicit calculus (which you can see in Scala's implicits)
  is interesting for thinking about dependency injection in a more
  principled way, and could be used as a basis for describing powers in
  a capability-secure system. But without a good way of grouping these
  powers it doesn't feel like you could make it practical, at least not
  without tying it to an IDE, as otherwise the overhead of maintaining
  annotations would get too cumbersome.

[F-ing Modules](https://people.mpi-sws.org/~rossberg/f-ing/)
: *Andreas Rossberg, Claudio Russo, Derek Dreyer* ---
  The ML languages have often had good module systems with parameterisation
  support (which is needed for both object-capability security and
  dependency injection), so it seems like you could rely on them for this,
  if you restrict how they can be instantiated. But, again, generative
  first-class modules *are* pretty much objects in the OOP sense.

[The Expression Problem](https://homepages.inf.ed.ac.uk/wadler/papers/expression/expression.txt)
: *Philip Wadler* ---
  Though Wadler's description of the tension between object-based and
  pattern-matching and ADT-based languages and extension by non-writers of
  that code still ring true for a lot of languages, I think most features
  combining ideas from FP and OOP have addressed some of it. The problem
  is the other trade-offs you need to make (e.g.: Type Classes require
  intentional and up-front design for extension).

[Korz: Simple, Symmetric, Subjective, Context-Oriented Programming](https://dl.acm.org/doi/10.1145/2661136.2661147)
: *David Ungar, Harold Ossher, Doug Kimelman* ---
  Korz (and other context-oriented languages) address the extension problem
  by letting users do contextual extensions. This avoids the problem with
  things like open-classes, if you can control the contexts. 
  [My previous attempt to do this](https://github.com/robotlolita/siren/blob/master/documentation/overview.md#safe-extensions-and-contexts)
  did get reasonable results until I started running into impossible-to-debug
  issues with the lack of global coherence. It turns out that having to pass
  contexts around is too much trouble for it to be worth. And having them be
  dynamically scoped makes it unpredictable.

[The Unreasonable Effectiveness of Multiple Dispatch](https://www.youtube.com/watch?v=kc9HwsxE1OY)
: *Stefan Karpinski* ---
  This is a youtube presentation rather than an article, but the idea of
  multimethods that Crochet uses is very close to the one Julia uses---with
  different syntax. Crochet has a few peculiarities in the dispatch and in
  how the entire soup of commands + overrides end up being presented (and
  manipulated) by the programmer, though.
