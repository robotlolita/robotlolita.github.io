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


# An introduction to the problem

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


# It's not about escaping!

Oh, but wait, I'm obviously missing something important here. "**Handlebars and Mustache are for HTML, you dumb!**" But of course, how could I forget this, Handlebars and Mustache have been written with HTML in mind, and SQL/Shell injections are a whole different beast, and totally a solved problem... or is it?



# The problem of SQL Injection
# Clueless templating engines