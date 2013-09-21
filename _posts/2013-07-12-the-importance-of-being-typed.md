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




# The problem of SQL Injection
# Clueless templating engines