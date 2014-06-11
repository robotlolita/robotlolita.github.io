---
layout: post
title:  Effective Validations
snip:   Scrap your boilerplate with Applicative Functors.
---


## Table of Contents
  *  TOC
{:toc}


Quite often programs need to validate and normalise data structures in
order to guarantee correctness and reduce the complexity of some
components that will make use of that data. Sadly, most languages don't
provide good tools, or at least some guidance on how to solve this
problem.

In this blog post we'll see where mainstream solutions for this problem
fall short, why it's important for languages to provide features to
design data structures, how this allows one to enforce properties of
correct-by-construction of one's programs, and how to derive and
generalise operations on these data structures using concepts from
category theory, allowing great flexibility, modularity and
maintainability of the resulting solution.


## 1. Introduction

Real-world programs usually consume pieces of data that originate from
outside of the program (e.g.: user input, or grabbing data from a remote
resource, such as a database or website). A program needs to ensure that
such piece of data is correct, according to the assumptions taken by the
rest of the program, before continuing.

In fact, programming is *almost all about data*. As Sussman and Abelson
put it in [Structure and Interpretation of Computer Programs][SICP],
programs are just rules of how (computational) processes should
manipulate some data. Given this, it's kind of surprising that most
programming languages have little to no support for designing and
processing data, and this has direct implications on how people express
programs and think about them.

This is possibly due to the fact that computers are really good at
processes, but *really bad* at data. Most mainstream languages, such as
Java, JavaScript, C#, Ruby, Python, etc. provide a model of computation
that's close to how the computer does things, which incidentally mean
that they're *also bad at data*.

One interesting quote from Dijkstra hints exactly at that:

> “Lisp has jokingly been called ‘the most intelligent way to misuse a
> computer’. I think that description is a great compliment because it
> transmits the full flavor of liberation: it has assisted a number of
> our most gifted fellow humans in thinking previously impossible
> thoughts.”
>
> — Edsger Dijkstra, CACM, 15:10 

Since processes manipulate data, and we care about correctness and
modularity, we need to make sure that the data we're feeding these
little processes is the right data. And for this, we need to both
validate pieces of data, so we can notify the user and reject things
that are malformed, and normalise pieces of data, so we can have simpler
and more direct processes.

Most common solutions are derived from the (misguided) assumption that
programs are all about processes, which is what these languages lead you
to do. However, those solutions are not quite scalable, nor modular, and
it's also hard to reason about their correctness.

For the next sections we describe a use case, review the common
solutions to that problem and outline where they fall short, then derive
a principled solution and describe how they allow one to reason about
the correctness of its implementation, and generalise the solution in a
modular and reusable way.


## 2. Ensuring that some input is valid

The program receives as input a record containing the following
information:

{% highlight ocaml %}
type Page { title     : String
          , content   : String
          , publishOn : Date
          , expireOn  : Date
          }
{% endhighlight %}

And we have the following constraints on this data:

  * `title` must not be empty;
  * `content` must not be empty;
  * `publishOn` must be a valid `Date`;
  * `expireOn` must be a valid `Date`;
  * `publishOn` can't be earlier than the current time;
  * `expireOn` should be greater or equal to `publishOn`;

The simplest (and most common) use case is to verify that some input
data is valid before continuing with some computation. This arises
whenever the computation involves a sub-process that has a constraint
on the kind of data that it accepts. Checking if some index is within
the bounds of a vector structure before reading from it, ensuring that
the e-mail and password for a user are correct before logging in, and
similar tasks.

In essence, this task involves checking if some piece of data conforms
to a particular constraint, then executing different processes depending
on the answer. Unsurprisingly, the most common solution for this problem
is to just encode this reasoning directly.

### 2.1. Naïve Branching

The most direct way of solving this problem is through branching, where
different operations get selected depending on a certain logical
condition.

<ul class="tabs">
  <li><a href="#javascript" class="active">JavaScript</a></li>
  <li><a href="#java">Java</a></li>
  <li><a href="#python">Python</a></li>
  <li><a href="#scala">Scala</a></li>
  <li><a href="#clojure">Clojure</a></li>
  <li><a href="#haskell">Haskell</a></li>
</ul>
<div class="tab-contents">
  <div data-language="javascript" class="active">
{% highlight js %}
function save(page) {
  if (title.trim() !== '') {
    if (content.trim() !== '') {
      if (publishOn >= new Date()) {
        if (expireOn >= publishOn) {
          storeInDatabase(page)
        } else {
          print("The expiration date should be greater than the publish date.")
        }
      } else {
        print("The publish date should be at least today.")
      }
    } else {
      print("The content of the page can't be empty.")
    }
  } else {
    print("The title of the page can't be empty.")
  }
}
{% endhighlight %}
  </div>
  <div data-language="java">
{% highlight java %}
public void save(Page page) {
  if (title.trim().equals("")) {
    if (content.trim().equals("")) {
      if (publishOn.after(new Date()) || publishOn.equals(new Date())) {
        if (expireOn.after(publishOn) || expireOn.equals(publishOn)) {
          storeInDatabase(page)
        } else {
          print("The expiration date should be greater than the publish date.")
        }
      } else {
        print("The publish date should be at least today.")
      }
    } else {
      print("The content of the page can't be empty.")
    }
  } else {
    print("The title of the page can't be empty.")
  }
}
{% endhighlight %}
  </div>
  <div data-language="python">
{% highlight python %}
from datetime import date

def save(page):
  if title.strip() != '':
    if content.strip() !== '':
      if publishOn >= date.today():
        if expireOn >= publishOn:
          storeInDatabase(page)
        else:
          print("The expiration date should be greater than the publish date.")
      else:
        print("The publish date should be at least today.")
    else:
      print("The content of the page can't be empty.")
  else:
    print("The title of the page can't be empty.")
{% endhighlight %}
  </div>
  <div data-language="scala">
{% highlight scala %}
{% endhighlight %}
  </div>
  <div data-language="clojure">
{% highlight clojure %}
{% endhighlight %}
  </div>
  <div data-language="haskell">
{% highlight haskell %}
{% endhighlight %}
  </div>
</div>

There are a couple of problems with this approach. The first one is that
it's incredibly difficult to *read* this code. You need to keep matching
the branching structures to know which action is related to which
condition, and that makes it really easy for bugs to creep in. Say you
forget to close a brace, or you provide use the content error message
for the publish date validation.

The second problem is that it's impossible to test this code, since it's
tightly coupled to both the standard output (through the `print`
function), and the database (through the `storeInDatabase` function). It
would be possible to decouple this code if the programming language
supports higher-order functions, or subtyping/structural polymorphism,
allowing one to provide different implementations for `print` and
`storeInDatabase` for that scope (say, by creating a class).

None the less, while that would make testing less difficult, the code is
still difficult to reason about and not at all modular. And if one had
to add a new condition, or output all the validation errors, it would
require large changes to the code.


### 2.2. A constraint engine




### 2.X. A principled solution

## 3. Normalising some input

> The program receives as input a record containing the following
> information:

{% highlight ocaml %}
type ItemType = Content | Image | Link

type Item { type      : ItemType
          , permalink : String
          , title     : String | Null     (* for Content and Image *) 
          , body      : String | Null     (* for Content and Link  *)
          , url       : String | Null     (* for Link and Image    *)
          }
{% endhighlight %}

> We have the following constraints on this data:
>
>   * `Content` should always have `title` and `body`;
>   * `Image` should always have `title` and `url`;
>   * `Link` should always have `body` and `url`;
>   * `URL` should be a valid URL;
>   * `Permalink` should not be empty;
>   * `Permalink` should not contain any character besides lower-cased
>     letters and dashes.
>
> So we normalise it to the following:

{% highlight ocaml %}
type Permalink
type URL

type Item = Content { title: String, body: String }
          | Image   { title: String, url: URL }
          | Link    { description: String, url: URL }
{% endhighlight %}

This is another fairly common situation, where inputs provided to some
process are not fine grained enough, which make manipulating and
reasoning about the properties of that information difficult. In this
case, the data we've got is an union of three very different things,
which might or might not be present, and different things which are
always required, at different points in time.

Likewise, the type `String` allows much more information than what both
the `permalink` and `url` fields accept, therefore allowing these fields
to keep the `String` type is a potential security issue waiting to
happen when constraints get violated.

If we let the data flow through the program as-is, we'd have to deal
with this complex relationship **throughout all the program**, which
makes it less modular, more difficult to test, and much less robust and
safe.


## 4. Conclusion


[SICP]: http://mitpress.mit.edu/sicp/full-text/book/book-Z-H-9.html#%_chap_1

<script>
void function() {
  var toArray = Function.call.bind([].slice)

  $('.tabs a').forEach(function(a) {
    a.onclick = function(ev) {
      ev.preventDefault()
      var lang = a.getAttribute('href').slice(1)
      deactivate($('.tabs a').concat($('.tab-contents > div[data-language]')))
      activate([a])
      activate($('.tab-contents > div[data-language]').filter(match(lang)))
    }
  })

  function $(s, c) {
    return toArray((c || document).querySelectorAll(s)) }

  function match(l) { return function(e) {
    return e.getAttribute('data-language') === l }}

  function deactivate(xs) {
    xs.forEach(function(x) {
      x.className = x.className.replace(/\bactive\b/, '').trim() })}

  function activate(xs) {
    xs.forEach(function(x) {
      x.className += ' active' })}
}()
</script>
