---
published: false
layout: post
snip: "With great powers, comes great responsibilities."
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

There are a myriad of problems with the approach that popular templating engines, such as [Handlebars][] or [Mustache][] take when it comes down to handling structured formats like HTML. They're directly related to SQL Injection, XSS attacks and even [a recent security issue with Express.js][express-bug].

These problems arise exactly from the use of: naïvely concatenating Strings — exactly what we'd like to avoid! Sounds insane?! Smells like bullshit?! Well, stick with me!

[Handlebars]: http://handlebarsjs.com/
[Mustache]: http://mustache.github.io/
[express-bug]: https://github.com/senchalabs/connect/issues/831


## An introduction to the problem

This problem is not new, it dates back from all the way in Computer Science, for as long as String types existed — and possibly intensified and made wide-spread due to PERL and the lovely Unix philosophy. In essence, we can trace back the culprites to these two maximums:

 1.  Store data in flat text files.
 2.  Make every program a filter (receive a Stream of text as input, output a Stream of text).

Since people have been encouraged to store data in flat text files which disregard any structure that the data might have had, people are forced to continuously try to make sense of structured formats and hack buggy parsers with Regular Expressions, and then naïvely concatenate everything back up so that the next buggy parser can take a swing at it.

But hey, it's best when data can be read by humans, right? Unfortunately, when you need to communicate between two processes in a computer, "data that can be read by humans" is not the best way to do this. Enter the **structured formats**. These are simple formats with a few rules that describe how the data is encoded and how the computer can get at it — in other words, it avoids buggy parsers, because now we can write just one nice and robust parser and use whenever we need to parse that format!

People did start to store things in structured formats, indeed. The cult of XML, alongside its chant of *"THOU MUST XML ALL THE THINGS!"* (repeat for JSON), and its impact on how we now write programs that need to communicate between themselves is proof that this works fairly well.

Okay, but what does this all have to do with templating engines?

Well, me dears, while we most certainly realised we needed to use parsers to extract data from structured formats, most people still haven't realised that they *must* also use serialisers that can write data in a structured format. This led to things like these:

    db.query("SELECT * FROM users WHERE name=\"" + user.name + "\".");
    
Or its close cousin:

	shell_execute("sudo adduser '" + user.name + "' 'webuser'")
    
But oh, silly me. Of course this is *wrong*, I just forgot to escape **user.name**, how could I **ever** do something as horrible as this?! I should just escape the data and, really, I need to stop coding so late in the morning... right y'all?


## It's not about escaping!

Oh, but wait, I'm obviously missing something important here. "**Handlebars and Mustache are for HTML, you dumb! They'll escape stuff automatically for you!**" But of course, how could I forget this, Handlebars and Mustache have been written with HTML in mind, and SQL/Shell injections are a whole different beast, and totally a solved problem... or is it?

There **is** a more fundamental problem that we're kind of missing here: we're just repeating the same mistakes of the past by writing buggy String concatenation, and buggy Regular Expression-based parsers. Of course we can make this all work, people did back in the days. That we can make it work **is not the problem**, the problem is that **no one will tell us when it doesn't work**. Or, in other words, it's just too easy to forget to escape a little piece of data and have [Little Bob Tables throw the work of your whole life into the void][bob-tables] — and that's when you'll learn things "don't work".

But Handlebars and Mustache will escape things automatically, so that solves all of our problems, right? No one will ever get a XSS injection, because Handlebars will automatically replace all of your `<` characters by `&lt;`. This is **amazing**, right? Well, it is, until you have to actually deal with HTML and other structured formats, as your *input* for the template.

So, let's suppose you have a piece of HTML that was generated from another process, that you know it's safe (it plays correctly by the rules of HTML), and you want to embed in another template:

	<div>{{ yourHTML }}</div> :)
    
Is no good, because now all of the `<` characters will be replaced by `&lt;` and the final thing will mean something else entirely. But Handlebars allows one to include any HTML verbatim in another template by using the "triple-staches":

	<div>{{{ yourHTML }}}</div> :)
    
Oh, now your HTML works beautifully, and the meaning is preserved... or is it? Imagine you have the following templates:

	yourHTML:
    <noscript>This website requires JavaScript
    
    main:
    <div>{{{ yourHTML }}}</div> :)
    
You might question the validity of the first snippet, but it's a perfectly valid HTML snippet on its own right, since the HTML format is supposed to be forgiving — in fact, code like this is in some production sites out there on the wild internets.

The problem here is that, while both snippets are valid on their own right, the result of composing both is not what you expect:

	<div><noscript>This website requires JavaScript</noscript></div> :)
    
But rather something monstruous:

	<div><noscript>This website requires JavaScript</div> :)
    
Which is interpreted by the HTML parser as the following, effectively changing the meaning that we intended!

    <div><noscript>This website requires JavaScript&lt;/div&gt; :)</noscript></div>

[bob-tables]: http://xkcd.com/327/

## Types to the rescue

As I said, the problem is not that one of the snippets doesn't have a matching close tag — they're both **perfectly valid** acording to HTML rules. The problem is that Handlebars, plain and simply, can't handle HTML. Instead, Handlebars will just stitch several strings together and escape strings that are supposed to be used as text, nothing else. Nothing wrong with that approach, of course, but it only works well for things that are plain text, and hell breaks loose as soon as you try to use it for structured things and arbitrarily compose these different structures.

But why would you want to compose templates? Composition is a good way to manage complexity and scale things in a way you can still understand and easily change. It's the whole reason we don't write every one of the possible pages of a website with duplicated HTML everywhere, so why should our templating engines enforce this? Doesn't it sound counter-intuitive?

The problem is even worse when you need to work with data that comes from entirely different structures, and play by entirely different rules. For example, I might have a piece of data in a structure that requires it to be encoded as base64, I can't just take that base64 value pass it over to Handlebars and have it magically display as the original text for the user. But again, the problem here is that nothing in Handlebars will tell me that I forgot to convert the base64 value to the original text, just as nothing will tell me that my composed HTML breaks the rules of HTML.

But hey... what if we had types?

Some people, when confronted with the word "type" will shy away and say that they have tests, which are just as good. I'll steal [Domenic's][] words here and just say that those people are Missing The Point Of Types®. It's not really about proofs[¹](#fn1), it's a composition tool! And since JavaScript is a dynamic language, we can instead enforce the composition rules at the "Value" level. In other words, we should use rich objects to represent the structure, rather than plain strings.

[Domenic's]: http://domenic.me/2012/10/14/youre-missing-the-point-of-promises/

- - - 


<a name="fn1"></a>
¹: type system and types are primarily about formal proofs. But the notion of types (as a set of things) also serve as a great design and composition tool, because it allows one to define constraints on how things should fit together. Think about Lego, it wasn't just by chance that each piece had a particular "interface" for being combined with another piece.

# The problem of SQL Injection
# Clueless templating engines