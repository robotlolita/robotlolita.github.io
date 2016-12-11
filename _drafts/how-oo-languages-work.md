---
layout: post
title:  "How do Object-Oriented Languages Work?"
snip: >
  Object-Oriented programming is a widely used paradigm, but its concepts appear in different ways in different languages. Understanding how each of these work should help you understanding subtle (but important!) differences between languages like Java and JavaScript.
---

<h2>Table of Contents</h2>

  * TOC
{:toc}


## 1. Introduction

While the concept of object-orientation is pretty simple, the amount of concepts
that exist in the field, and how they appear in programming languages tends to
be fairly overwhelming. A solid understanding of the basics can help you
navigate through these concepts and not only understand when or how each one is
used, but the subtle differences between each of these languages that might make
your debugging life more difficult.

This blog post will cover concepts of modelling and constructing objects (both
class-based approaches and prototype-based approaches), selecting which
operation to run (forms of dispatch, method vs. message-based languages, etc.),
inheritance (single vs. multiple, concatenative vs. delegative, etc.), and a few
other relevant concepts.

Make yourself comfortable, this is going to be a pretty long post~ (but there'll
be cute drawings along the way to ease the pain :3).

> <strong class="heading">Note</strong>
> This article assumes the reader has at least had a bit of contact with
> object-oriented programming, although it provides a refresher if you're not
> confident enough on the concept. All in all, you'll be able to get more out of
> this article if you have at least basic knowledge of programming (just variables
> and functions in procedural or functional programming, really).
{: .note .warning }


## 2. A Re-Introduction to Object-Orientation

Before we start, we need to know what we're going to be talking about. The
question of "What even is object-orientation?" is a tricky one, because a lot of
people mean different things by that. Before we can talk about
object-orientation, we have to discuss what objects are though.


> Objects are values that determine which operations they support.
{: .highlight-paragraph .pull-in }


### 2.1. Dynamic Behaviour

In a sense,
[objects are values that determine which operations they support][cook-oo] [^1]. That
is, if I have the number `1`, in order for that number to be considered an
object the ways in which I can operate on it have to be determined by the number
itself.

![A hand with its thumb tapping the screen of a smartphone](/files/2016/12/oo-01.png)
{: .pull-left }

For example, consider a person tapping the active screen of a smartphone. What
happens when they do that? Well, it depends on *what* they're tapping, right?
Tapping the icon of an application in the home screen might bring
that application's window up, so the user can use it. On the other hand, tapping
one of the characters in the virtual keyboard while having a text field focused
would add that character to the text field.

Note that while the way one interacts with these many things in a smartphone is
the same: they press some area of the screen; the outcome of all of these
actions depends on what one is interacting with. I, as an user, can't really
make it so that when I tap the *send* button in the Mail application it deletes
the current email — it's the Mail application itself that defines what happens
when you tap its buttons. But nothing prevents another application from having a
button with the same name, located in the same place, to do a completely
different thing.
{: .clear }

![The number '1', in a box. Attached to the box four round buttons labelled '+', '-', '*', and '/'](/files/2016/12/oo-02.png)
{: .pull-right }

Objects behave similarly. If my numbers are objects, then the only thing I can do
is “press buttons on them” and wait for the outcome of that. A number might have
buttons labelled `+`, `-`, `×`, etc. and each number determines what
happens when you press such a button. Not all object-oriented languages allow
you to literally press buttons on the screen to interact with objects, but the
idea of “calling a method on an object” or “sending a message to an object”
fulfills a similar purpose.
{: .clear }


### 2.2. First-class Values

Another important part of the concept of an object is that they are a
*first-class entity*. That is, there isn't a single, fixed way that you must use
in order to refer to that object. You can alias it (for example, by putting it
in a variable), you can pass it to a function as an argument, you can return it
as results from functions, and possibly more.

To see why this property is important, let's go back to the numbers example. If
numbers were not first-class in a programming language, then `1` and `2` would
be valid uses of it, `1 + 2` would also be a valid use of it, but `1 + two`
wouldn't. That's because the word `two` is not the same as the word `2`, and
entities that are not first-class have to show up with the exact name that was
assigned to them by the language, and no other name. With this restriction it
would be pretty difficult to make programs do anything.


### 2.2. Objects and Object-Orientation

So now that we've seen what objects are, what does it mean to be
"object-oriented"? We can say that an object-oriented *program* is one where its
computations are done through sending messages to (or calling methods
on/pressing buttons on) objects. Given that, an object-oriented language is any
language that supports writing programs in such way.

Not that in order to not exclude some of the languages we'll talk about, and you
might know, we don't require a language to have good support or encourage
programs to be written in this manner, just that there is the possibility of
doing so. Java, for example, does not have a good support for writing programs
in this way (numbers aren't objects, `+` is not a button in a number that you
can press, among other things), so programs written in that language tend to
have some computations that are expressed as method calls, and some that use
concepts from procedural programming. In this article we're more concerned about
the concepts themselves and how they appear in different languages, than with a
philosophy of how programs should be written, so it would not make much sense to
exclude these languages just because it's harder to write object-orientd
programs in them.


## 3. Constructing objects

We know what objects are, but how are objects *made*? Well, once again there are
many answers to that question — you'll get used to this phrase in no time!
\*Ahem\*, where were we…? Oh, right, making objects! Because there are too many
ways in which this happen we'll just cover the two major models: class-based
objects, and prototype-based objects. Most object-oriented languages go for one
or the other, and even though there are many differences between languages that
use the same model, we can talk about those differences as separate concepts
later.


### 3.1. The Class-based School

Possibly the most widely used model for objects is the *class-based* object
model. In this model one first defines how objects of a particular kind look
like (these definitions are called “class”), then they may use that definition
to construct actual objects of that kind.

To put it in more concrete terms, imagine I write a song, but in music notation.
It doesn't matter how much I wave the sheet music around, that piece of paper
just *describes* how to play the song, it's not the song itself — you can't
listen to it by looking at it, although you might be able to imagine how it will
sound if you can read music notation. Given that sheet music, however, someone
can play that song, record it, and then other people can enjoy the song to their
heart's contents.

![On the left, a sheet music, labelled 'class'. On the right, a young woman plays the music notated in the sheet in a piano. The sounds coming out of it are labelled 'object', the woman is labelled 'interpreter'](/files/2016/12/oo-03.png)
{: .centred-image .full-image }

A class is like the example sheet music: it describes how objects look like, and
you can even see how they'll behave when you look at the descriptions, but you
can't *use* the those descriptions directly, you must interpret the descriptions
first to generate an object, which you can then use. In most languages this is
done by a syntax similar to `new TheClass()`, and the process is commonly
referred to as *instantiating*.

The actual syntax for this varies quite a bit in class-based languages, so here
are how one would create an object representing the number `1` in some major
languages supporting this form:

<ul class="tabs">
  <li><a href="#javascript" class="active">JavaScript</a></li>
  <li><a href="#java">Java</a></li>
  <li><a href="#python">Python</a></li>
  <li><a href="#smalltalk">Smalltalk</a></li>
  <li><a href="#ruby">Ruby</a></li>
  <li><a href="#cpp">C++</a></li>
</ul>
<div class="tab-contents">
  <div data-language="javascript" class="active">
{% highlight js %}
// Tells the language how 1 objects look like
function One() {
  /* Called when this class is instantiated */
}

One.prototype.describe = function() {
  return '1';
};

One.prototype.isGreaterThanZero = function() {
  return true;
};

One.prototype.isGreaterThanTwo = function() {
  return false;
};

// Or more concisely, from the 2015 version onwards, as:
class One {
  constructor() {
    /* Called when this class is instantiated */
  }
  
  describe() {
    return '1';
  }
  
  isGreaterThanZero() {
    return true;
  }
  
  isGreaterThanTwo() {
    return false;
  }
}

// Interprets the previous definitions to construct a 1 object
const one = new One();
{% endhighlight %}
  </div>
  
  <div data-language="java">
{% highlight java %}
public class Main {
  // Tells the language how 1 objects look like
  class One {
    public One() {
      /* Called when this class is instantiated */
    }
    
    public String describe() {
      return "1";
    }
    
    public boolean isGreaterThanZero() {
      return true;
    }
    
    public boolean isGreaterThanTwo() {
      return false;
    }
  }
  
  public void main([]String args) {
    // Interprets the previous definitions to construct a 1 object
    One one = new One();
  }
}
{% endhighlight %}
  </div>
  
  <div data-language="python">
{% highlight python %}
# Tells the language how 1 objects look like
class One(object):
  def __init__(self):
    # Called when this class is instantiated
    
  def describe(self):
    return "1"
    
  def is_greater_than_zero(self):
    return True
    
  def is_greater_than_two(self):
    return False
    
# Interprets the previous definitions to construct a 1 object
one = One()
{% endhighlight %}
  </div>
  
  <div data-language="smalltalk">
Because Smalltalk languages tend to define programs in a visual, live
environment, there tends to be no syntax to do so from a REPL or such. The
syntax shown above is the convention for Pharo Smalltalk, but is not the <em>text</em>
you type in your program — you instead click buttons in the interface to do
things.
  
{% highlight smalltalk %}
"Tells the language how 1 objects look like"
Object subclass: #One
  instanceVariableNames: ''
  classVariableNames: ''
  package: ''.
  
One>>initialize
  "Called when this class is instantiated".
  
One>>describe
  ^ '1'.
  
One>>isGreaterThanZero
  ^ true.
  
One>>isGreaterThanTwo
  ^ false.
  
"Interprets the previous definitions to construct a 1 object"
| one |

one := One.new
{% endhighlight %}

Here's how the interface for editing Pharo classes looks like, with the
definitions above:

<p class="centred-image full-image">
  <img src="/files/2016/12/oo-04.png" alt="The Pharo Smalltalk class browser
  shows the method 'isGreaterThanZero' for class 'One'">
</p>
  </div>
  
  <div data-language="ruby">
{% highlight ruby %}
# Tells the language how 1 objects look like
class One
  def initialize
    # Called when this class is instantiated
  end
  
  def describe
    '1'
  end
  
  def isGreaterThanZero
    true
  end
  
  def isGreaterThanTwo
    false
  end
end

# Interprets the previous definitions to construct a 1 object
one = One.new
{% endhighlight %}
  </div>
  
  <div data-language="cpp">
{% highlight cpp %}
class One {
  public:
    One();
    string describe();
    bool isGreaterThanZero();
    bool isGreaterThanTwo();
}

One::One() {
  // called when this class is instantiated
}

One::describe() {
  return "1";
}

One::isGreaterThanZero() {
  return true;
}

One::isGreaterThanTwo() {
  return false;
}

int main() {
  // Interprets the previous definitions to construct a 1 object
  One one;
  return 0;
}
{% endhighlight %}
  </div>
</div>

Even without looking at languages that diverge more from the syntax above, like
[CLOS][], [Eiffel][], [Beta][], [Dylan][], [Factor][], among several others, we
can see already that even within relatively popular object-oriented languages
the syntax for how you provide class definitions and instantiate them can vary
quite a bit. But the *process* is still the same: you first tell the system how
to construct a particular kind of object, then you ask the system to run those
definitions to construct an object for you.

With classes there's no way of getting an object directly, one must always go
through a class first. JavaScript (which was mentione above) is a bit of a
special case here, and we'll discuss it in more depth in the next sections.


### 3.2. The Prototype-based School

Another relatively popular model is the *prototype-based* object model, with
JavaScript being one of the most well known languages supporting such. In this
model one constructs objects directly, and objects may be based on existing
objects.

To put it in more concrete terms, imagine I'm trying to create a new dish —
because I love potatoes, and I want to draw food. I have some ideas for possibly
interesting tastes in my head, but obviously I don't know the exact steps to get
to that taste yet, so I'm just going to “learn by doing” — try everything and
see what tastes good!



<ul class="tabs">
  <li><a href="#javascript" class="active">JavaScript</a></li>
  <li><a href="#java">Java</a></li>
  <li><a href="#python">Python</a></li>
  <li><a href="#smalltalk">Smalltalk</a></li>
  <li><a href="#ruby">Ruby</a></li>
  <li><a href="#cpp">C++</a></li>
</ul>
<div class="tab-contents">
  <div data-language="javascript" class="active">

  </div>
  <div data-language="javascript">

  </div>
</div>








<div class="contact-footer">
    Quil is in ur computer, replacing everything with tiny objects that look
    like fluffy cats. Do not mess
    with this person, they're clearly evil! You can contact them on <a href="https://twitter.com/robotlolita">Twitter</a> or <a href="mailto:queen@robotlolita.me">Email</a>.
</div>

- - - 


<h4 class="normalcase borderless">Footnotes</h4>

[^1]:
    [William Cook describes the idea of objects as values that determine which operations they support in more details in his blog post][cook-oo].
    His literal definition, “objects are first-class, dynamically dispatched
    behaviours” can be more difficult to understand for people who are not
    familiar with PL terminology, and his clarifications of that statement also
    assume a fair bit of knowledge of such terminology, as well as different
    object-oriented languages.



[cook-oo]: http://wcook.blogspot.com.br/2012/07/proposal-for-simplified-modern.html
[CLOS]: https://en.wikipedia.org/wiki/Common_Lisp_Object_System
[Beta]: http://daimi.au.dk/~beta/
[Dylan]: http://opendylan.org/
[Factor]: http://factorcode.org/
[Eiffel]: https://en.wikipedia.org/wiki/Eiffel_(programming_language)
