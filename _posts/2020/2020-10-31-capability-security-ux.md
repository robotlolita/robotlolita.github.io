---
layout: article
title: "Capability Security does not exist in a vacuum"
card_type: summary_large_image
card_image: /files/2020/10/ios14-card.png
---

With the iOS 14 update, Apple has introduced more fine-grained capabilities in its operating system. When I tried sharing an image on Twitter after the update, I got a system message saying that I could now choose to only share *some* specific photos with the application, rather than having to give Twitter control over my entire photo library.

For once I was actually enthusiastic about a phone OS update. "Fine-grained capabilities? On my phone? Why, yes, that's the thing I've been waiting for all this time!"

![An illustration of a woman holding several keys, representing the idea of capabilities. There's an iOS menu with three options: "Forfeit all possessions to Twitter", "Let Twitter have one photo", and "Cry and suffer"](/files/2020/10/ios14-card.png)
*Apple: "We have capability-security at home!"*
{: .centred-image -full-image }

Of course I tried the more restricted sharing option at once. First it asked me to select the photos from my library. I picked the one photo I wanted and clicked done. That opened another photo selection screen with only the photo I had already selected. "Weird UX. Did they even test this feature?" I picked the photo again and this time it got attached to my tweet. Great! Now Twitter shouldn't have any powers of snooping around my things!

With my tweeting done, I moved to happily performing other things, living in the blissful future where we actually get to control our privacy, trust, and security (a person can dream) in computer systems.

After much time had passed, I was back on Twitter to share a different image. So I clicked the button to attach a photo, and... it showed me a grid containing only the photo I had previously selected. "Weird. Maybe it remembers your previous selections? Who would **want** that?" Recovering from my brief state of confusion I looked around for any button that would allow me to go to my photo library and select one (1) new photo to share. No luck.

"Wait? That's it? How do I grant more capabilities??? Did... did they think this through?????"

So I went to the OS settings to check what's happening with Twitter's photo capabilities... and found out that **there** is the only place you can grant or revoke photo capabilities. The capabilities you grant are granted indefinitely. And there's no way of changing this at the actual *usage context*. Disappointed, I changed the setting back to forfeiting all my mortal (photo) possessions to the Twitter gods.

Now. This seemed like a good example of the issues one can have with capability-based security when thinking *only* about the technology part of things. Security is primarily about humans, and you have to think about people **first**. So let's have a look at where things went wrong, and how things could have been made better.

<!--more-->

## What is capability-based security?

**What can an application do?**

When we ask this question about computers, there are often two major schools of how-to-answer-it. The first school says that whatever *you* can do, so can the application. This is the **ACL** (access-control list) school. The second school, rather, says that whatever you *delegate* to the application, explicitly, the application can do. Of course, in order to delegate something, you yourself must be able to do it. This second school is the **capability-security** school.

In a capability-based setting an application doesn't magically inherit all of your powers. In fact, in a capability-based setting an application starts being unable to do anything! In order to make an application useful, you as the user, need to grant it powers. We call these powers "capabilities".

For example, let's say that you install Twitter. In order for Twitter to work at all, it needs to be able to fetch content from the internet, and it needs to be able to present things on the screen. In some contexts Twitter needs some additional powers. For example, if you want to play a video, then Twitter will need to be able to play some sound. If you want to share a photo on Twitter, it'll need access to (at least) that photo on your photo storage. Twitter may also save photos you edit through its interface, so it might need to be able to write to this photo storage.

We can model all of these things as a different "capability". For Twitter, these capabilities could be: "presenting on screen", "network", "sound", "read and write on photo library". We can be as fine-grained or coarse-grained as we want to be. You can think of capabilities as physical keys. If everything different thing you can do was locked behind a different door (with a different lock), and you walked around with a key-chain with keys for all of them, then an application would need to request a key from you in order to do anything. In the ACL model, instead, all applications would get unconditional copies of all of your keys---you would never know what they're doing!


## Fine-grained or coarse-grained?

Fine-grained capabilities give users more control over how much they trust an application with their devices and data, however it comes at a higher cost of managing that trust. Coarse-grained capabilities give users less control, but are easier to reason about and manage.

Phone operating systems tend to have very coarse-grained capabilities, and some capabilities are considered universal. For example, all applications have unconditional access to the network, being able to fetch or send data anywhere. They all have unconditional access to presenting things on the screen and playing sounds.

In most cases this is a reasonable compromise. But if you're going to be installing applications that you don't trust entirely---and most users will---, it helps to be able to say "this application will not have network access". If you grant read-access to all of your photo library, and an application has no network access, it has no way of leaking that data anywhere. It gets rid of one major privacy concern while going about your every-day life at almost no cost.


## But how do we manage it?

Capabilities are almost universally always better than ACLs. It gives users more control, and it gives users more tools to reason about their own privacy and security. The second part is particularly important, since you *have* to reason about privacy and security all the time, and thinking about it in terms of "user categories" is prone to many attacks that rely on confusing the users and exploiting the complexity of computers.

However, capabilities still need to be **managed**. If the effort of managing capabilities is going to be greater than the threshold an user has, they might choose to grant more capabilities than necessary just so they can proceed on with their lives. In this sense, it's not really that they *accept* the risk, but rather that they feel the risk isn't worth all of the trouble. They put themselves in an insecure position because we, as software engineers, have failed to think about the effort actual users have to put into using our software.

Thus, the user experience of a capability-based software is one of the most important aspects of its security. A capability-based system with crappy user experience can as bad for security as a system using ACLs. Sometimes it can even be worse to privacy and security. For example, a system of capabilities that shows confirmation popups for every single action will just train users to always click "yes, I forfeit all my mortal possessions to the computering gods" without reading any of it, and without making any risk assessment! In that sense, an ACL system with a simple division between "regular user" and "administrator" at least gives users a slightly improved experience of security and privacy.

This tension is pretty clear in Apple's implementation of finer-grained photo capabilities. Yes, for most applications we would rather give access to only some specific photos, not all of them. However, this has to be implemented in a way where we can *reason* about what exactly we're letting the application access.

Here's a sketch of a better user interaction with finer-grained capabilities:

---

The user is made aware that they can now use finer-grained photo capabilities. That is, for any application, they may choose if they want the application to have no access to the photo library, they can share some photos from the library, or they can share the entire library. Storing photos in this library is a separate capability.

The user opens Twitter, and is enthusiastic about not having to give Twitter access to everything. Twitter doesn't *need* that, and it shouldn't have that. Now, the only time when we care about Twitter having access to our photos is when we want to attach one to a tweet, or save one photo from a tweet. But these are separate capabilities. Let us focus on attaching photos.

When the user clicks the button to attach a photo, the native photo picker of iOS is opened. This dialog is not controlled by Twitter, and Twitter is not able to do anything within this screen. The user can see that this is a native screen because it has a *distinctive* frame around it. The frame indicates that we're on safe land. It also indicates that Twitter will have access to whatever the user *picks* from this dialog, but nothing else.

The user proceeds to select a few photos, and then clicks the "Use these photos" button. Access to these photos is granted to Twitter, and the photos are attached to the tweet the user is composing. Once the user finishes writing the tweet and clicks "send", the photos are shared to the timeline.

Happy with the tweet, the user proceeds to doing their own mundane things elsewhere. Later, when the user comes back to Twitter, they want to share more photos. The user clicks the button to attach photos again, which opens the distinctive native dialog for picking photos. This time the dialog presents a tabbed interface that allows users to switch between showing "All photos" or "Previously shared". Because the user wants to share a new photo this time, they want "All photos"---that's the default here, anyway. The user picks the photos, just as before, clicks the "Use these photos" button, and proceeds to send the tweet.

---

There are a few important things to notice here in this interaction:

  - **Grants are contextual**: when the user grants a capability to access a photo, it's contextual. Sharing a photo to an application quite obviously shows that the user has the intent of granting the capability of reading it to the application. There's no need for confirmation dialogs, no need to present copious amounts of text users won't read. Just let people *show* the system what they want to do, and infer capabilities from the interaction.

  - **Trusted context are visible**: the trusted photo dialog is clearly marked as such. Think of this like the HTTPS mark in an address bar of a browser; the mark exists to tell users that they're in some kind of "trusted context", and they can assume certain guarantees. In this particular case, they can assume that this is not an attacker impersonating a native system dialog. And although there's less of an issue with photos, it's still important for these marks to be somewhat consistent.

  - **No additional effort**: the usage of this system requires no more effort than the current (insecure) usage of Twitter where Twitter is granted unconditional access to all photos in the photo library. The steps to attaching a photo to a Tweet are the same, with a slight overhead for attaching a recent photo, as Twitter shows those inline, requiring two less selections. However, for most users the overhead is minimal enough that it wouldn't be reasonable to decrease security to get rid of the overhead.

  - **Visualising capabilities**: the "previously shared" tab gives users some insights on what things have been previously shared with the application. From there users would be able to remember what they have previously granted and revoke access to it if needed. Of course, something shared in an application that pushes photos to the internet is not going to go away entirely by just revoking the local access. But being able to see which capabilities have been granted, when, and to whom can be important for people who have a stricter threat model, and can let them know what further actions they may need to take in the real world.


## Some closing words

Capability security is exciting, and as someone who has been working with adding it to programming languages for a few years (particularly to deal with the issue of mixed untrusted code---e.g.: in plugin systems), I welcome a lot of the more recent addition of them in mainstream things. But often, in both real systems and the capability security literature, there's a lot of focus on the technology itself. We talk a lot about security and privacy problems as if they're these abstract concepts that only affect fictional Alices and Bobs. So much "This system is mathematically proven to solve the non-interference problem so it can't leak data!" or "Capabilities solve the confused deputy problem! much security! very privacy! wow!", but not enough focus on the *people* who will be using this system. There are *actual people* out there!

Of course, all of this literature and system iterations are still *valuable*. I'm just a bit disappointed by the current state of affairs here :)

Hopefully this trend will shift, and we'll see more systems and reports that include usability studies on how and when this technology improves users lives for realsies, by giving them a reasonable way of taking control of their security and privacy.
