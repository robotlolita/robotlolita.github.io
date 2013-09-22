---
published: false
layout: post
snip: "Or “Handlebars and Mustache are just naïve String concatenation!”"
---

> My girlfriend told me to get a life,  
> She said "Boy, you lazy"  
> 
> But I don't mind  
> As long as there's a bed beneath the stars that shine  
> I'll be fine  
>  
> — Oasis, The Importance of Being Idle

Logic-less HTML templating engines are quite the buzz these days, for they allow the programmer to specify their HTML declaratively, forces them to separate logic from presentation, and saves them from all the problems that could happen when naïvely concatenating Strings for The Great Good™... or do they?

There are a myriad of problems with the approach that popular templating engines, such as [Handlebars][] or [Mustache][], take when it comes down to handling structured formats like HTML. They're directly related to SQL Injection, XSS attacks and even [a recent security issue with Express.js][express-bug].

These problems arise exactly from the use of: naïvely concatenating Strings — exactly what we'd like to avoid! Sounds insane?! Smells like bullshit?! Well, stick with me!

TL;DR:

  - **DO NOT** be lazy (as far as parsing & generating structured data goes);
  - **DO NOT** use regular expressions to parse structured data;
  - **DO NOT** use naïve String concatenation (or *Clueless* templating engines) to generate structured data;
  - **DO** use templating engines that aid you with composition and early errors by acknowledging the kind of data you're working with and its rules (e.g.: [Enlive][], [Hiccup][], [JSONML][], [Hamlet][], [React][], ...);
  - ES6's quasi-literals can make things easier, as long as we don't use them for String interpolation!

[Handlebars]: http://handlebarsjs.com/
[Mustache]: http://mustache.github.io/
[express-bug]: https://github.com/senchalabs/connect/issues/831
[Hiccup]: https://github.com/weavejester/hiccup
[JSONML]: https://github.com/Raynos/jsonml-stringify
[Hamlet]: http://hackage.haskell.org/package/hamlet-1.1.7
[React]: http://facebook.github.io/react/
[Enlive]: https://github.com/cgrand/enlive

## An introduction to the problem

This problem is not new, it dates back from the early days of Computer Science, for as long as String types existed, and possibly intensified and made wide-spread due to PERL and the lovely [Unix philosophy][unix]. In essence, we can trace back the culprits to these two maxims:

[unix]: http://en.wikipedia.org/wiki/Unix_philosophy#Mike_Gancarz:_The_UNIX_Philosophy

 1.  Store data in flat text files.
 2.  Make every program a filter (receive a Stream of text as input, output a Stream of text).

Since people have been encouraged to store data in flat text files, which disregard any structure that the data might have had, people are forced to continuously try to make sense of rich, structured data by hacking buggy parsers with Regular Expressions, and then naïvely concatenate everything back up so that the next buggy parser can take a swing at it.

But hey, it's best when data can be read by humans, right? Unfortunately, when you need to communicate between two processes in a computer, *"data that can be read by humans"* is not the best way to do this. Enter the **structured format gang** (XML, JSON & friends). These are simple formats with a few rules that describe how the data is encoded and how the computer can get that information — in other words, it avoids buggy parsers, because now we can write just one nice and robust parser and use whenever we need to parse that format!

People did start to store things in structured formats, indeed. The cult of XML, chanting *"THOU MUST XML ALL THE THINGS!"* at the top of their lungs (repeat for JSON) surely had some impact on how we now write programs that need to communicate between themselves. Creepiness aside, turns out this works fairly well.

Okay, but what does this all have to do with templating engines?

Well, me dears, while we most certainly realised we needed to use robust parsers to extract data from structured formats, most people still haven't realised that they *must* also use serialisers that can write data in a structured format. This led to things like these:

    db.query("SELECT * FROM users WHERE name=\"" + user.name + "\".");
    
Or its close cousin:

	shell_execute("sudo adduser '" + user.name + "' 'webuser'")
    
But oh, silly me. Of course this is *wrong*, I just forgot to escape **user.name**, how could I **ever** do something as horrible as this?! I should just escape the data and, really, I need to stop coding so late in the morning... right y'all?


## It's not about escaping!

Oh, but wait, I'm obviously missing something important here. "**Handlebars and Mustache are for HTML, you dumb! They'll escape stuff automatically for you!**" But of course, how could I forget this, Handlebars and Mustache have been written with HTML in mind, and SQL/Shell injections are a whole different beast, and totally a solved problem... or is it?

There **is** a more fundamental issue that we're kind of missing here: we're just repeating the same mistakes of the past by writing buggy String concatenation, and buggy Regular Expression-based parsers. Of course we can make this all work, people did back in the days. That we can make it work **is not the problem**, the problem is that **no one will tell us when it doesn't work**. Or, in other words, it's just too easy to forget to escape a little piece of data and have [Little Bob Tables throw the work of your whole life into the void][bob-tables] — and that's when you'll learn that something "didn't work".

But Handlebars and Mustache will escape things automatically, so that solves all of our problems, right? No one will ever get a XSS injection, because Handlebars will automatically replace all of your `<` characters by `&lt;`. This is **amazing**, right? Well, it is, until you have to actually deal with HTML and other structured formats, as your *input* for the template.

So, let's suppose you have a piece of HTML that was generated from another process, that you know to be safe (it plays correctly by the rules of HTML), and you want to embed in another template:

	<div>{{ yourHTML }}</div> :)
    
The previous template is no good, because now all of the `<` characters will be replaced by `&lt;` and the final thing will mean something else entirely. But Handlebars allows one to include any HTML verbatim in another template by using the "triple-stashes":

	<div>{{{ yourHTML }}}</div> :)
    
Oh, now your HTML works beautifully, and the meaning is preserved... or is it? Imagine you have the following templates:

	yourHTML:
    <noscript>This website requires JavaScript
    
    main:
    <div>{{{ yourHTML }}}</div> :)
    
You might question the validity of the first snippet, but it's a perfectly valid HTML snippet on its own right, since the HTML format is supposed to be forgiving — in fact, code like this is in some production sites out there on the wild internets.

The problem here is that, while both snippets are valid on their own right, the result of composing both is not the straight-forward thing that you would expect:

	<div><noscript>This website requires JavaScript</noscript></div> :)
    
But rather something monstruous:

	<div><noscript>This website requires JavaScript</div> :)
    
Which is interpreted by the HTML parser as the following, effectively changing the meaning that we intended!

    <div><noscript>This website requires JavaScript&lt;/div&gt; :)</noscript></div>

[bob-tables]: http://xkcd.com/327/


## Types to the rescue

As I said, the problem is not that one of the snippets doesn't have a matching close tag — they're both **perfectly valid** according to HTML rules. The problem is that Handlebars, plain and simply, can't handle HTML. Instead, Handlebars will just stitch several Strings together and escape Strings that are supposed to be used as text, nothing else. Nothing wrong with that approach, of course, but it only works well for things that are plain text, and hell breaks loose as soon as you try to use it for structured things and arbitrarily compose these different structures.

But why would you want to compose templates? Composition is a good way to manage complexity and scale things in a way you can still understand and easily change. It's the whole reason we don't write every one of the possible pages of a website with duplicated HTML everywhere, so why should our templating engines enforce this? Doesn't it sound counter-intuitive?

The problem is even worse when you need to work with data that comes from entirely different structures, and play by entirely different rules. For example, I might have a piece of data in a structure that requires it to be encoded as base64, I can't just take that base64 value pass it over to Handlebars and have it magically display as the original text for the user. But again, the problem here is that nothing in Handlebars will tell me that I forgot to convert the base64 value to the original text, just as nothing will tell me that my composed HTML breaks the rules of HTML.

But hey... what if we had types?

Some people, when confronted with the word **"type"** will shy away and say that they have tests, which are just as good. I'll steal [Domenic's][] words here and say that those people are *Missing The Point Of Types®*. It's not really about proofs[¹](#fn1), it's a composition tool! And since JavaScript is a dynamic language, we can instead enforce the composition rules at the *Value* level. In other words, we should use rich objects to represent the structure, rather than plain strings.

[Domenic's]: http://domenic.me/2012/10/14/youre-missing-the-point-of-promises/


## From clueless to smart templates

So, templating engines like Handlebars, Mustache, etc. are clueless, in that they don't acknowledge the rules and structure of the data they're working with — it's just plain text. This makes them a bad choice for generating data such as HTML, XML or JSON. A smart templating engine will acknowledge these things, and not only help you with escaping data, but warn you (loudly) when any kind of error happens!

Most of the problem here lies on how people perceive Strings to be an "easy" solution for anything, and they just take the path of least resistance — which is working within a structured world without any of the structure. This is possibly PERL and C-family languages' fault, given that the LISP family has been working with structured data using, well, structured data since the beginning of times.

The thing is: we should start writing tools that makes people *feel* that working with structured data using proper structures is just as easy (or easier). And better yet, it's much safer. Unfortunately, JavaScript is not the best language to encode DSELs (domain specific embedded languages), as Lisp or Haskell, and the tools to do this aren't *quite* there yet, as are the tools for working with Strings. This is a fault of the language, but one that we can kind of easily circumvent, and we should strive for[²](#fn2).

For instance, let's suppose one wants to generate an SQL query. Instead of the naïve String-based approach, they could encode commands and parameters as objects or functions, and compose them from there. The [Korma][] library in Clojure takes a similar approach. The following is an oversimplification in JavaScript:

[Korma]: http://sqlkorma.com/

	//+ SELECT :: ([Name], Name) → [SQL]
	function SELECT(fields, table) {
    	return [ SQLCommand("SELECT")
        	   , fields.map(FieldName)
               , SQLCommand("FROM")
               , Name(table) ]
    }
    
    //+ SQLCommand :: String → Command
    //+ FieldName :: String → Field
    //+ Name :: String → Name

	var fields = ["id", "user"]
    var table = "Robert'; DROP TABLE --"
    runSql(SELECT(fields, table)).forEach(displayUser)
    
Contrasting with the usage for the naïve approach, the usage of a safe approach that acknowledges the structure of SQL, and enforces *context-sensitive* proper composition (therefore eliminating any errors resulting from the need of escaping data) is just as easy as:

	runSql("SELECT {fields} FROM {table}").forEach(displayUser)

With the added advantages of never needing to sanitise inputs, or being able to write an improper SQL query. A similar claim could be made for an HTML templating engine that supports structured templates:

	Html(
    	Head(
        	Title(page.title),
            Meta({ charset: "utf-8" })
        ), Body(
        	Section({ classes: ["main"] }, page.content),
            parseHtml(page.arbitraryHTML),
        )
    )
  
Where, `page.title`, `page.content` and `page.arbitraryHTML` will be properly handled to fit **in the context that they appear**, avoiding any composition errors, or throwing an early error if any of these components violate the rules of HTML and breaks the original intent of the code.
        

## The future (in JavaScript)

ECMAScript 6 defines a proposal for "quasi-literals," which is more akin to Lisp quasi-quotation than naïve String interpolation in languages like Ruby, CoffeeScript or PHP. And this is a *real good thing*, because in the future we'll be able to embed all sorts of amazing DSLs in JavaScript, maintaining all of the composition referred to above. This means that your HTML templating would look like this:

	html`<html>
    	   <head><title>${page.title}</title>
                 <meta charset="utf-8"></head>
           <body>
             <section class="main">${page.content}</section>
             ${parseHtml(page.arbitraryHTML)}
           </body>
         </html>`
         
Now, this *does* look easy, and it does look like your usual String interpolation in Ruby or PHP, doesn't it? So, what's the trick? How will this not be just one more naïve String concatenation approach that I've argued against since the beginning of the article?

The sad news: **ECMAScript 6's quasi-literals make no guarantee of such.** This means that, surely, that code snippet could easily do plain String concatenation. The good news is that it doesn't **need** to be clueless. The reason is that, unlike Lisp's quasi-quotation, ECMAScript 6's quasi-literals are intended to be generic and as such they make no assumptions about the underlying format of the contents of the literals — your function is supposed to provide that.

The above snippet could be thought of as (and this is a simplified view deviating a little from the spec):

	html([ "<html><head><title>", 0
         , "</title><meta charset=\"utf-8\"><body><section class=\"main\">", 1,
         , "</section>", 2,
         , "</body></html>"
         ], "Title", "Content", parseHtml("..."))
         
It's now the job of the `html` function to parse the literal parts and substitute the varying parts appropriately, maintaining the composition rules of the underlying language — which means verifying the arbitraryHTML to see if it's valid, and entity encoding the other values. So, as a start, **it's a freaking awesome thing!**


## Parsing is still hard (ouch!)

I won't get into the [gory details of parsing theory, techniques and other stuff][parsing], since [people did that already][parsing]. However there is a problem when most people aren't exposed to a primer on parsing and interpretation techniques that they can actually use when they have to deal with different formats of data, or programming languages. Those two topics become even more essential when you work on top of a platform that needs to bring together so many different languages at the same time, like The Web.

This lack of basic knowledge in programming languages, the mindset that "Strings are okay" for structured formats, the perception people have that parsing and interpretation are *"so hard only geniuses can do it"*, and the fact that ECMAScript 6's quasis are too generic to put the burden of parsing on the library authors (something you don't have in Lisps) are all things that contribute to the possible misuses of quasi-literals.

Of course, [TC39 definitely acknowledges the problem and is trying to fix them for the common cases][quasi-ti], but we could still see some terrible misuses of quasi-literals for cases that deviate a little from that, like HTTP headers, or building shell commands, for example.

Having no standard and simple way of writing parsers in the language also contributes for this. Specially since you can't easily bend JavaScript to make it more suitable for some of the rich DSELs that could make expressing parsers easy, as you have in Haskell or Lisps — quasis might fix that, however. Parser combinators currently suffer considerably in expressiveness in the language, and PEGs often either use a String to encode the parser (which is often awkward, specially in the presence of semantic predicates) or provide a full compiler for a super-set of the JavaScript language.

For example, this would be a simplified HTML parser in [OMeta/JS][], a super-set of JavaScript:

	ometa HTML <: Parser {
        tagChar = char:c ?(/a-zA-Z/.test(c)) -> c,
        tagName = tagChar*:cs -> [ 'id', cs.join('') ],
    	tag     = '<' tagName:name '>' node*:ns '<' '/' tagName:n '>' ?(n === name) -> [ 'tag', name, ns ],
        entity  = char:c ?(c != '<') -> c,
        text    = entity*:cs -> [ 'text', cs.join('') ],
        node    = tag | text
        html    = node*
    }
    
Parsing some text like: `<b><i>Some text</i></b>` would yield the following AST (abstract syntax tree):

	[['tag', ['id', 'b'],
      ['tag', ['id', 'i'],
       ['text', 'Some text']]]]
       
While parsing an incorrect HTML like: `<b><i>Some text</x>` would give you a parsing error. 

[parsing]: http://blog.reverberate.org/2013/07/ll-and-lr-parsing-demystified.html
[quasi-ti]: http://js-quasis-libraries-and-repl.googlecode.com/svn/trunk/safetemplate.html      
[OMeta/JS]: http://www.tinlizzie.org/ometa/

## Conclusion

We need to start using smart templating engines, which take into account the language they're working with, since this is the only sane and safe way to work with this data. However, the programmer mindset is a major issue, in all of the problems outlined in this post. We've been taught how to work with Strings, we've been given tools to work with Strings, but we're working with data that just don't fit what the String type is supposed to hold.

Lisps are far better in this aspect because the internal structures, values and composition operators are all defined on top of S-expressions, so composition between things is easier. There's no reason we shouldn't learn from the Lisp crowd and start working with structured data in a structured format, however.

There's lots of things to be invented for the future of ECMAScript, specially in light of things like quasi-literals. We need simpler, standard ways to work with, and compose ASTs if we want to change how people perceive the difficulty of working with structured data and DSELs. 

But until then, we can keep demanding better of our tools, libraries, frameworks, and programming languages!


## Recommended Libraries

<dl>
  <dt><a href="https://github.com/weavejester/hiccup">Hiccup</a></dt>
  <dd>A widely-used library for generating HTML from Vector data structures in Clojure.</dd>
  
  <dt><a href="https://github.com/Raynos/jsonml-stringify">JSONML</a></dt>
  <dd>Rayno's take on using Array data structures to encode structured formats in JavaScript. Has extensible formats for serialisation.</dd>
  
  <dt><a href="https://github.com/killdream/dominatrix">Dominatrix</a></dt>
  <dd>My take on HTML templating on the Browser side. Uses the DOM for creating elements and lets the Browser deal with all the quirks. It's being used in production right now, although some attribute handling could be done better.</dd>
  
  <dt><a href="http://hackage.haskell.org/package/hamlet-1.1.7">Hamlet</a></dt>
  <dd>A member of Haskell's (and the Yesod web framework) Shakesperean Templates. Hamlet is a EDSL for writing HTML, which quite reminds the approach shown above in ECMAScript 6's quasi-literals, but with type guarantees. Other libraries include Cassius (CSS EDSL) and Julius (JavaScript EDSL).</dd>
  
  <dt><a href="http://facebook.github.io/react/">React</a></dt>
  <dd>A reactive library that uses a structured object model instead of the DOM. With this, templates can be shared between the server and the client, and effective interface updates can be performed automatically when necessary.</dd>
  
  <dt><a href="https://github.com/cgrand/enlive">Enlive</a></dt>
  <dd>A templating library for HTML/XML and other tree-structured languages that takes a different approach than anything else. Templates are parsed by the library, and a sequence of transformations are applied to parts of the tree by using "CSS-selectors" to filter the nodes.</dd>
</dl>


## References and additional reading

<dl>
  <dt><a href="http://haskell.cs.yale.edu/?post_type=publication&p=126">Domain Specific Languages</a></dt>
  <dd>Paul Hudak's paper on Domain Specific Embedded Languages, and their benefits.</dd>
  
  <dt><a href="http://wiki.ecmascript.org/doku.php?id=harmony:quasis">ECMAScript 6's quasi proposal</a></dt>
  <dd>The quasi-literals proposal for JavaScript.</dd>
  
  <dt><a href="http://js-quasis-libraries-and-repl.googlecode.com/svn/trunk/safetemplate.html">Using type inference to make web templates robust against XSS</a></dt>
  <dd>Mike Samuel and Prateek Saxena's paper on how type inferencing can be used with quasi-literals in ECMAScript 6 to provide context-sensitive automatic handling of pieces from different languages being composed.</dd>
  
  <dt><a href="http://www.yesodweb.com/book/shakespearean-templates">The Shakesperean Templates</a></dt>
  <dd>A description of the problems that the type-safe embedded DSLs Julius (JS), Cassius (CSS), and Hamlet (HTML) solve in Haskell and the Yesod web framework.</dd>
  
  <dt><a href="http://www.vpri.org/pdf/tr2008003_experimenting.pdf">OMeta: Experimenting With Programming Languages</a></dt>
  <dd>Alessandro Warth's dissertation on OMeta, a parsing expression generator that aims to make it easier to prototype and write parsers for programming languages. A similar approach could be used in JavaScript to make the perceived difficult of dealing with structured data (both acquiring and transforming) easier.</dd>
  
  <dt><a href="http://www.cs.utexas.edu/~wcook/Drafts/2008/gel.pdf">GEL: A Generic Extensible Language</a></dt>
  <dd>William R. Cook and Jose Falcon's paper on GEL. A language devised to create composable domain specific languages. An implementation of GEL could provide a standard way of writing new Domain Specific Languages on top of the quasi-literals in ECMAScript 6, making it simple to encode languages with rich syntax without complicated parsers.</dd>
</dl>


## Footnotes

<a name="fn1"></a>
¹: type system and types are primarily about formal proofs. But the notion of types (as a set of things) also serve as a great design and composition tool, because it allows one to define constraints on how things should fit together. Think about Lego, it wasn't just by chance that each piece had a particular "interface" for being combined with another piece.

<a name="fn2"></a>
²: [Quasi-literals][] in Harmony are supposed to fix this, but it remains to be seen if they'll be used correctly due to the current mindset with regards to working with structured data.

[Quasi-literals]: http://wiki.ecmascript.org/doku.php?id=harmony:quasis