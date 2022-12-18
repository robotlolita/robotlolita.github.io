---
layout: article
title:  "Building a secure key/value store"
---

I'm hacking on Crochet again and this week I'm writing a small key/value store, so it seemed like a good opportunity to talk about some of the design approaches I use.

The key/value store is: global (every piece of code can see/modify it), but securely partitioned (no piece of code can see/modify keys outside of its partition), and has both pluggable storage backends and pluggable serialisation.

A few additional constraints: all of these features should work seamlessly (without users' having to fiddle with configurations) across different runtimes (Crochet targets Node, Electron, and Web Browsers currently), and they must all be trivially testable without users having to care about complex dependency injection configurations. The system should also be debuggable without requiring significant effort from either the package developers or users.

A lot of these would be a significant undertaking in many modern languages. The [initial pull request](https://github.com/qteatime/crochet/pull/84) that implements it in Crochet is about ~800 lines of code, of which more than 50% is documentation (the one in this article is ~130 lines, including comments and whitespace).

So, what exactly goes into fulfilling all of these constraints?

<!--more-->

<h2>In this article</h2>

  * Table of Contents
{:toc}


## From global to partitioned

Before any code is to be written, one must come up with a model (or architecture) for the feature. In our case this follows from the constraints that were set before.

First, we need a global key/value storage. In Crochet this is generally done by defining a singleton type—which fills the role of singleton objects or modules in other languages. Thus:

```
singleton store;
```

Because Crochet uses [multimethods](https://robotlolita.me/diary/2022/12/oop-multimethods/), when we define a type we only care about the data that it will hold, and [singleton types cannot hold any data](https://crochet.qteati.me/docs/reference/system/types/types-and-data.html#data-less-types) anyway.

Now, our `store` type doesn't really do anything because there are no methods in it, but we also need to think carefully about the next step here. Our second constraint is that these storages can be securely partitioned. We also want to keep in mind that both serialisation and backend storage needs to be pluggable, but the way we "plug" them in isn't necessarily going to be the same.

To address all of the security bits of these constraints we'll rely on the [object-capability model](https://en.wikipedia.org/wiki/Object-capability_model) of security. This means that any piece of code is able to do whatever the objects they have access to provide (but nothing more than that). This requires designing object interfaces that have the following two principles:

  - The objects that a piece of code can refer directly determine the highest capabilities (powers) that such code has;

  - Any method that can be invoked must return an object that has either the same capabilities as its arguments, or less capabilities. If a method is allowed to return more capabilities than its arguments have, then a piece of code could trivially escalate its privileges.

Since the `store` object we defined provides access to **all** storages, we at least need one new object (let's call it `partitioned-storage`). This will allow us to go from "all storages" to "a single partition" (restricting the access is okay). So long as methods on `partitioned-storage` only return the same `partitioned-storage` object (or an object with less powers) we're in the clear for our second constraint: this means that if I give a piece of code A one `partitioned-storage`, and a piece of code B a different `partitioned-storage`, neither will be able to see or modify each other's data, even though the *actual* storage will be shared between the two. For example, they could end up in the same file on the disk, or the same table in a database, or the same `localStorage` in the current page's origin.

Tentatively we can define our partitioned storage as follows:

```
type partitioned-storage;
```

No data again, but now we're in a bit of a pinch. We have a `store` which grants access to all storage, and we have `partitioned-storage` which grants access to a specific part of this storage. Somehow we need to be able to go from one to another *securely*. It also must be *stable*, since this is a persistent storage and we want to hand the same partitions when the user closes the application and re-opens it. This is harder than it might seem at first.

For example, let's suppose we decide that each piece of code should come up with a unique secret string that identifies its partition. So our application goes and creates one such partition:

```
define app-storage = lazy (store partition: "super-secret-app-partition");
```

We also have a dependency that has its own persistent storage needs, and it goes to create its own partition:

```
define dep-storage = lazy (store partition: "this-is-the-dependency-store");
```

Since both partition keys are distinct, there's no worry about one of them seeing or modifying the other's data. However, our application is kind of open-source, and the person who maintains the dependency we use went MIA, and in the meantime their package got taken over by someone with less-than-kind intentions. They took a look at our application's code, got a little idea, and published a new version of the dependency we use. Its code now reads:

```
define dep-storage = lazy (store partition: "super-secret-app-partition");
```

Oh no! Suddenly this random dependency has access to all of our application data, even though we went to great lengths to pick a secret unique key for our partition.

You might think that we could avoid this if it was the application handing over access to partitions. And well, in that case the application would ensure that no dependencies could take over its data, but the inverse isn't true: the dependencies would have no control over its data security guarantees. Worse, now we burden *every user* with the task of manually wiring all of these capabilities throughout the code, we also burden *every dependency* with [writing their code backwards](https://en.wikipedia.org/wiki/Inversion_of_control) just so our application can control them instead.

Some capability-secure languages do take this route, by making application modules [parametric](https://gbracha.blogspot.com/2009/06/ban-on-imports.html) and requiring the entry-point of the application to configure them. But this is a non-starter for Crochet because the target audience is non-professional programmers looking for a safe but simple way to make and share silly video-games. Making security guarantees conditional on them having "wired" everything correctly while at the same time being unable to give any tools to assist them on it (because such wiring is generally not amenable to static analysis) is just setting them up for failure.

So we *do* want the exact interface we looked at, where every piece of code has access to `store`, and every piece of code requests its own partitions, but with the additional guarantee that these partitions will never conflict with each other (and they will also be stable, otherwise we could have just generated random UUIDs).

Luckily Crochet does have a built-in solution for this problem.


## Unforgeable stable identifiers

Crochet takes a... well, slightly non-conventional approach to object-capability security. The model says that code will have exactly the capabilities of objects it has access to, though it leaves out how exactly they get this access. Common capability-based languages propagate these accesses by distributing them from the entry-point of the application. Which, in essence, would give us something like:

```
module App (Space) {
  let depA = DepA({store: Space.store.prefixed("depA")});
  let myStore = Space.store.partition("app-data");
}

module DepA (Space) {
  let myStore = Space.store.partition("app-data");
}
```

In this case both `DepA` and `App` would create a partition that they believe is called `app-data`, but `DepA` would get a partition with name `depA:app-data`, and `App` would get a partition with name `app-data`. That's because the only way they have to access `store` is through the `Space` object, and since that's handed to them they're none-the-wiser about how the objects in this space have been configured.

Crochet both lacks parameterised modules (which is required to support the sort of wiring seen above), and also provides every module with something akin to [ambient authority](https://en.wikipedia.org/wiki/Ambient_authority). Every package has access to *every* type, method, entity, etc. from the packages it depends on. So if both our app and depA have the key/value store package as its dependency, they both would have access to the exact same `store` object.

Rather than require the user to do wiring, Crochet takes an approach that's more reminiscent of ACL-based controls. That is, by default all code can see all types, methods, etc. Crochet has no concept of "private", and everything is global, so, likewise, everything can be seen by everything else.

But Crochet restricts what can be *referenced* by each piece of code. It uses packages as boundaries, so the first layer of reference restrictions is the package dependency graph. Code in a package is allowed to reference only entities from packages that it has listed as direct dependencies. So, say `depA` lists our key/value store as a dependency, and `depB` does not, but it has `depA` as a direct dependency. When a user installs these, they'd be aware that both dependencies can see our key/value store entities, but only `depA` would be able to create partitioned storages.

The second layer of reference restrictions is what Crochet calls a [capability group](https://crochet.qteati.me/docs/reference/system/security/groups.html#capability-groups). A capability group is a tag that can be attached to any entity to mark it as "risky", and also describe what exact risks a user is taking by allowing it to be used. Again, each package needs to request access to these capability groups guarding its direct dependencies' powerful objects. So let's say `depA` dutifuly requests access to the `store` capability group, when a user installs or runs something with `depA`, it would be informed of what risks that dependency brings, and if they don't trust the author with those risks, they'd see the exact pieces of code that they'd need to audit.

If we apply this to what we've defined so far, we can already define one such group: "the ability of creating partitioned storages" is a risk that should at least gate access to `store`. We don't need to gate access to `partitioned-storage` itself because only the defining package can construct types directly, so neither `depA` nor our app would be able to will some `partitioned-storage` in existence without going through `store` first.

```
/// Medium risk. Allows code to create and access a partitioned storage.
capability manage-partitioned-storages;
protect type store with manage-partitioned-storages;
protect global store with manage-partitioned-storages;
```

A singleton in Crochet creates both a type and a global instance of that type. We've chosen to restrict access to both, which means that packages without access to it both cannot refer to the global instance (`store`) directly, nor accept it as arguments to their commands in its typed form. That is, while `command escalate-privileges: (X is any)` is okay, `command escalate-privileges: (X is store)` would not be, and the linker would refuse to load the program until that access issue is resolved.

> Alas the sealing and unsealing parts of Crochet's gradual typing are not fully thought out yet, so `command escalate-privileges: (X is any)` does work for "escalating privileges" without it registering in the pieces of code that need to be audited, but I digress.

But, anyway, we want to solve the problem of each package creating its own partitioned storages that cannot in any way conflict with other packages' partitioned storages. In Crochet, package names are unique. You can't load two packages named `some.package` in the same application. So we can use the package names as a stable, unique identifier. And we can avoid the issue of packages fabricating these identifiers out of their knowledge of package names by using the `package` type instead.

Each package in Crochet gets a `package` type automatically defined. This inherits from `any-package` in the core library. This package type provides the package with secure access to all of its resources, without the package author having to worry about where these resources are located. It's, once again, a global singleton, because everything is global in Crochet, but it's protected by the `internal` capability group.

Each package also gets the `internal` capability group automatically defined, and that's how Crochet achieves the equivalent of "private" or "local" in other languages—they're neither private nor local, it's just that the `internal` capability is usually not shared; the effort of defining a more restricted, more well-defined one is almost the same. But, as a package author, you can, of course, give the possibility of access to all of your package's internal types to other packages. Happens to be useful for testing sometimes, we'll get to that later.

If we make our partition key based on the `any-package` type, then we can be sure that they are unforgeable, because `package` types can only be constructed by the runtime. Thus we revise our code so far a bit:

```
type partitioned-storage(location is package);

command store partition: (Location is package) =
  new partitioned-storage(location -> Location);
```

With this both our app and `depA` can have this storage definition somewhere and be assured that our security guarantees of the partitions being independent of each other hold:

```
define storage = lazy (store partition: package);
```

> A small aside: Crochet still has open hierarchies by default. This means that, while the runtime-constructed `package` type cannot be forged, a malicious package could still have a `singleton not-package is any-package` declaration somewhere, provide the `_ name` method, and pretend to be named anything. There's a pending patch to support closed hierarchies to make the guarantees described here truly hold.

This unfortunately allows each package to have only one storage. I thought this was too big of a restriction and defined a location trait that allowed multiple partitions per package too:

```
trait location with
  command package to-key: X -> interpolation;
end

type store-location(package is any-package, key is text);
command #store-location for: (Pkg is any-package) key: (Key is text)
requires
  restricted :: not (Key contains ":")
=
  new store-location(package -> Pkg, key -> Key);

implement location for any-package;
command package to-key: (X is any-package) =
  "pkg:[X name]";

implement location for store-location;
command package to-key: (X is store-location) =
  "loc:[X.package name]:[X.key]";
```

The translation from a stronger object to a piece of text is okay here because we can rely on the guarantee that neither will have `:`, and thus our unique textual key always holds.

We need to revise the `partitioned-storage` type and its construction a bit:

```
type partitioned-storage(location is (any has location));

command store partition: (Location has location) =
  new partitioned-storage(location -> Location);
```


## The storage backend

So now we have partitioned storages that are guaranteed to not conflict. A package can use its own `package` type to request many partitions of some storage backend, but it only has access to the `partitioned-storage` type, so how does that type know how or where to store and retrieve the data?

There are three primary approaches that we can use here:

  1. We put the storage capabilities in the `partitioned-storage` type itself. That way it will know how to store and retrieve data, and also needs to make sure it stays in its partition. More static languages often do this, but we can't choose different backends easily this way, so this isn't really an option for our use case.

  2. We extend the `partitioned-storage` type so it takes in an object that provides a way of storing and retrieving data. That object is also responsible for honouring the partitions our type describes. Languages with object-capability security or dependency injection often do this.

  3. We make a global variable that says `backend`, then set that to whatever backend the whole application will use. `partitioned-storage` uses the global directly, none-the-wiser about how it was selected. Practical engineers often do this, so does Crochet.

Option (1) is alright in its simplicity, but out of question here because we want our backends to be pluggable. We could go with option (2), however, since Crochet doesn't have parametric modules, and `store` is a global type with no configuration, it's unclear how exactly it would go about choosing which backend to pass to the `partitioned-storage` objects it creates. That pretty much leaves us with the global variable option (3), again.

Hey, Crochet loves global variables. Global variables are great, y'all are just mean.

Anyway, though no less global, Crochet actually achieves the same using effect handlers. And if you've read my old stuff, you know that I'm a strong believer that [all programming languages should have effect handlers](https://robotlolita.me/diary/2018/10/why-pls-need-effects/). An effect handler is just a form of global variable, though, but better in that it's a [dynamically scoped global variable](https://en.wikipedia.org/wiki/Scope_(computer_science)#Dynamic_scope).

We support three primary operations in our storage:

  - `lookup(Partition, Key)` retrieves the value of `Key` in the given `Partition`, if such value exists.

  - `Store(Partition, Key, Value)` associates `Key` with `Value` in the given `Partition`. Thence all `Lookup(Partition, Key)` would yield `Value`.

  - `Delete(Partition, Key)` removes the `Key` association from the given `Partition`, if one exists. It succeeds either way because we don't want to leak that knowledge here.

So in Crochet we define an effect that contains these operations:

```
effect storage-backend with
  lookup(partition is text, key is text)
    -> result<text, error>;

  store(partition is text, key is text, value is text)
    -> result<nothing, error>;
  
  delete(partition is text, key is text)
    -> result<nothing, error>;
end
```

An effect is a global variable, so our `partitioned-storage` type can use it at any point without caring about whatever value has been put in that variable. It *knows* that all three operations will be there, and that's really all that matters. Thus we get:

```
command partitioned-storage contains-key: (Key is text) do
  let Partition = package to-key self.location;
  perform storage-backend.lookup(Partition, Key) is ok;
end

command partitioned-storage at: (Key is text) do
  let Partition = package to-key: self.location;
  perform storage-backend.lookup(Partition, Key)
    | value-or-panic: "key not found" data: [key -> Key];
end

command partitioned-storage at: (Key is text) put: (Value is text) do
  let Partition = package to-key: self.location;
  perform storage-backend.store(Partition, Key, Value)
    | value-or-panic: "store failed" data: [key -> Key];
end

command partitioned-storage remove-at: (Key is text) do
  let Partition = package to-key: self.location;
  perform storage-backend.delete(Partition, Key)
    | value-or-panic: "remove failed" data: [key -> Key];
end
```

And a package would be able to use what we have so far like this:

```
let Store = store partition: package;
Store at: "hello" put: "world";
assert (Store at: "hello") =:= "world";
Store remove-at: "hello";
assert not (Store contains-key: "hello");
```

Again, all of the security guarantees we've described so far still hold. Our storage backend is pluggable, too, but it's currently not plugged. There is no actual implementation for the effect we've defined, so as soon as the Crochet VM reaches one of those `perform` instructions, it just halts with a "no implementation found for this effect" error.

Crochet differs a bit here from common languages with algebraic effect handlers in that the "handlers" are not really algebraic, but more of a signal or event handler. Thus, when you define a handler, it doesn't have to refer to a particular algebra, but can handle as many or as few signals as it wants. This turns out to be more useful for Crochet than the algebraic reasoning of the more mathematical formulation, but then again it's based on Crochet's target audience: not professional programmers, but also not mathematicians (if anything, illustrators and writers have been scared of mathematical reasoning because of [the unfortunate state of high school mathematics](https://www.maa.org/external_archive/devlin/LockhartsLament.pdf)).

The current implementation of this package provides two handlers: one for an in-memory mutable storage, and one based on the browser's LocalStorage. They're roughly similar in complexity and code-size, but the LocalStorage one has a small JavaScript companion that it calls through [Crochet's FFI layer](https://robotlolita.me/diary/2022/12/oop-aliens/).

So let's define just the in-memory one here:

```
handler in-memory-storage-backend do
  let Storage = #cell with-value: #map empty;
with
  on storage-backend.lookup(Partition, Key) do
    condition
      when Storage value contains-key: [Partition, Key] =>
        continue with #result ok: (Storage value at: [Partition, Key]);
      
      otherwise =>
        continue with #result error: not-found;
    end
  end

  on storage-backend.store(Partition, Key, Value) do
    Storage <- Storage value at: [Partition, Key] put: Value;
    continue with #result ok: nothing;
  end

  on storage-backend.delete(Partition, Key) do
    Storage <- Storage value remove-at: [Partition, Key];
    continue with #result ok: nothing;
  end
end
```

As you can imagine by now, handlers in Crochet are also global. However, because these will change the behaviour for all partitioned storages, we do not wish to let all code use it without some due consideration. And it's something that's likely going to be only used at the application level anyway. So we introduce yet-another-capability-group:

```
capability manage-storage-backend;
protect handler in-memory-storage-backend with manage-storage-backend;
```

Now at the application level we set up what storage strategy we want to use throughout the application (no other code changes are necessary, users can continue to be none-the-wiser about this; global variables are a blessing):

```
handle
  my-application run;
with
  use in-memory-storage-backend;
end
```

That's pretty much it, any code that's ran from within that `handle` block will see the in-memory backend implementation. So now we have a global key/value store, with shared storage and pluggable backends for this storage, but which is also partitioned with the guarantee that no partition can see or affect another partition's data, and no package can have access to another package's partition.

It's still missing one thing: pluggable serialisation.


## Why custom serialisation?

So far we have a simple key/value store which works entirely on the realm of textual values, much like the [Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API), except we can sandbox and freely partition this storage across different packages. We could have left it at that.

However, a common use case for key/value stores is to persist small pieces of data about a program, like its configuration. In a video-game, we could allow the player to mess up with the options and then have those options persisted for when they open the game again a week later—nobody wants to re-do all of their sound level or brightness balancing, after all.

The thing is that these pieces of configuration look like this:

```
type sound-options(
  bgm-volume is integer,
  sfx-volume is integer,
);
```

Sure we could force users of the package to write code like this:

```
let Store = store partition: package;
let Bgm = #integer parse: (Store at: "bgm-volume" default: "80");
let Sfx = #integer parse: (Store at: "sfx-volume" default: "80");
new sound-options(bgm-volume -> Bgm, sfx-volume -> Sfx);
```

But for such common use case, this introduces a lot of friction, and a lot of ways in which users can get these wrong. We would like to keep the usage of the library simple, and its code likewise simple, but also support these common cases without requiring more effort from our users or making their code more error-prone.

However, we cannot simply allow any value to be serialised and constructed either. Crochet is a capability-secure language, which means that **all** of its security guarantees hinge on preventing people from constructing values that are powerful, if they are not given a capability for it. A reflection-based serialisation plugin would allow us to accept any arbitrary text from a place we do not control (whatever is storing these values), and then proceed to give it powers as if it was handed over by a trusted Crochet runtime. [That's how you get the very bad RCEs](https://logging.apache.org/log4j/2.x/security.html#log4j-2.16.0) we see every other week.

And we also cannot simply use something like "store everything as JSON" because JSON does not support common Crochet types like "integer" (JSON does not even have a specification for how to interpret numbers, which is honestly wild, but also a separate discussion). And we don't want to build a entire new serialisation format just for this library because that goes against our "keeping the code simple" goal—this is also a security issue, the more code you have the harder it is to guarantee that your security properties actually hold.

Luckily, Crochet does ship with an "extended JSON" library, which is a JSON implementation that's extensible and also has more well-defined semantics. If we use this library to serialise and parse the data in our `partitioned-storage` type, we can keep the guarantees we have, avoid pushing this issue into the actual storage backend, and still keep the code additions relatively small.

We did say at the beginning that we want these to be pluggable, however. This is a direct consequence from the previous problem. Because we do not want to support the serialisation plugin to create arbitrary Crochet types outside of the few known safe ones, each `partitioned-storage` must specify how to reify the types it parses. This, in turn, restricts the approaches we can take for passing these around; they must be provided when creating the `partitioned-storage`, and cannot really be global.

In essence this means we need to change the `partitioned-storage` type a bit:

```
type partitioned-storage(
  location is (any has location),
  serialisation is (any has serialisation)
);
```

`serialisation` is a trait because, since we'll have these pluggable, might as well have them be user-definable, if people are going to have more complex use cases for their serialisation strategy, or if they have specific performance characteristics to meet. A [codec](https://en.wikipedia.org/wiki/Codec) comes with the `X = decode(encode(X))` law, which helps us in defining this trait:

```
trait serialisation with
  command Self encode: (X is any) -> text;
  command Self decode: (X is text) -> any;
end
```

And the implementation of this trait for the JSON serialisation is similarly straightforward:

```
open crochet.language.json;

type json-codec(codec is json);

command #json-codec of: (Codec is json) =
  new json-codec(codec -> Codec);

implement serialisation for json-codec;
command json-codec encode: X = self.codec serialise: X;
command json-codec decode: X = self.codec parse: X;
```

Lastly, we need to revise the method for constructing `partitioned-storage` types, since we now have to provide an additional argument to it. We'd like to keep some good defaults for folks that do not need to store custom types, however, so that the code we had so far for creating and using these partitioned storages will continue to work as is:

```
command store partition: (Location has location)
              serialisation: (Serialisation has serialisation)
do
  new partitioned-storage(
    location -> Location,
    serialisation -> Serialisation,
  );
end

command store partition: (Location has location) do
  self partition: Location
       serialisation: (#json-codec of: #extended-json defaults);
end
```

So the code below is what users could write if they have specific needs for serialisation, but they can continue writing just `store partition: package` to get a partitioned storage that handles the most common Crochet types. With these changes, loading the options looks like this:

```
let Store = store partition: package;
new sound-options(
  bgm-volume -> Store at: "bgm-volume" default: 80,
  sfx-volume -> Store at: "sfx-volume" default: 80,
);
```

Simpler on the user and less error prone. However they still need to manually construct this type. Given that this type does not really work as gating specific capabilities, we could allow it to be stored and reified automatically as part of the serialisation. In Crochet, that would look like this:

```
@| derive: "json"
@| derive: "equality"
type sound-options(
  bgm-volume is integer,
  sfx-volume is integer,
);

open crochet.language.json;

define my-json = lazy (
  #extended-json with-serialisation: (
    #json-serialisation defaults
      | tag: "sound-options" brand: #sound-options
  )
);

command package configuration-store =
  store partition: package serialisation: (json-codec of: (force my-json));

command #sound-options load =
  package configuration-store
    | at: "sound-options"
      default: new sound-options(
        bgm-volume -> 80,
        sfx-volume -> 80
      );
```

> Also, yes, if you're wondering, the whole "tag: _ brand: _" mapping is there because, once again, capabilities. We need to make sure that we can parse and serialise values without relying on reflection. And, since Crochet supports hot-patching/live programming, storing closures in that mapping would be very bad—closures do not have stable identifiers, so they cannot be upgraded when code changes are applied. Crochet's standard library sometimes goes to great lengths to avoid using closures for this reason.


## Is that all?

The above really covers all of the functionality part of the key/value store. This article contains almost all of the code in the actual package, with the exception of a few convenience methods on `partitioned-storage` and the LocalStorage backend. Even a simple, seemingly trivial package such as this one becomes a more significant engineering effort once you need to think about security.

But, well, the good thing is that the guarantees the package provides means our *users* don't have to think about security as much as we do. A good trade-off to make in a standard library, I'd say.

Still, there are two missing (and important) points here: how do we (and our users) test it? And how do they configure their application/packages to use it?


## Testing

Let's start with testing, and let's consider the game configuration we've seen above as an example. Crochet supports defining test blocks, much like [Pyret](https://www.pyret.org/index.html) does, to provide example-based tests that are automatically found and executed by the runtime.

Further, since our storage backends use effect handlers, it can be set up for the duration of the test, without affecting any other piece of code outside of it, and without having anyone worry about running tests in parallel. Partitioned storage types are entirely self-contained otherwise, so there's nothing to worry there either.

So a user of our package could add the following test block somewhere:

```
test "Options can be loaded" do
  handle
    // No options previously saved
    assert #sound-options load === new sound-options(
      bgm-volume -> 80,
      sfx-volume -> 80,
    );

    // Options previously saved
    package configuration-store at: "sound-options" put: new sound-options(
      bgm-volume -> 60,
      sfx-volume -> 90,
    );

    assert #sound-options load === new sound-options(
      bgm-volume -> 60,
      sfx-volume -> 90,
    );
  with
    use in-memory-storage-backend;
  end
end
```


## Configuration

To have access to all these types, however, each package needs to request the relevant dependencies and capabilities. Crochet currently uses a JSON format for describing package configurations, and one could manually edit that file as follows:

```json
{
  ...,
  "dependencies": [
    "crochet.storage.key-value"
  ],
  "capabilities": {
    "requires": [
      "crochet.storage.key-value/manage-partitioned-storages",
      "crochet.storage.key-value/manage-storage-backend"
    ]
  }
}
```

We need `manage-partitioned-storages` for constructing partitioned storages, and `manage-storage-backend` to use one of the storage backend handlers in our test. And we, of course, need to declare a direct dependency on `crochet.storage.key-value`, otherwise we wouldn't be able to use its types.

Things get a bit more awkward when we have dependencies using these as well. For example, if our game depended on the `alex.high-score` package, and that package also used the key/value storage, we'd need to set our dependencies like this:

```json
{
  ...,
  "dependencies": [
    "crochet.storage.key-value",
    {
      "name": "alex.high-score",
      "capabilities": [
        "crochet.storage.key-value/manage-partitioned-storages",
        "crochet.storage.key-value/manage-storage-backend"
      ]
    }
  ]
}
```

Note that we, as something that comes earlier in the dependency graph, need to pass down any capabilities that we want to allow `alex.high-score` to use. This sort of wiring is unavoidable in a capability-based system. However, Crochet pushes it as much as possible to the boundaries and provides it in a way that tools can help users do the wiring:

<video controls class="rl-small-frame">
  <source src="/files/2022/12/purr-config.webm" type="video/webm">
</video>


## Linking constraints

We have only two goals left to fulfill, so let's talk about "work seamlessly across different runtimes without users' having to fiddle with configurations". As I mentioned before, Crochet currently targets Node, Electron, and Web Browsers, and it will likely target more runtimes later (e.g.: there's no reason why we wouldn't want to target a game engine, since users of those are the primary target audience).

When having multi-runtime targets from the get-go, it's important that any package provides its own way of supporting multiple runtimes (even interacting with Windows vs. Linux will have significant differences, but Node vs. Browser is even worse, wildly different capabilities). Whatever it uses, it should be assembled without the user of those packages having to do anything, because that would not otherwise scale.

The common approach to this problem is to tag pieces of code with runtime information. For example, one could have a macro-wrapped code like this:

```
#if WINDOWS
// do windows specific things here
#elseif LINUX
// do linux specific things here
#elseif BROWSER
// do browser specific things here
#endif
```

Rust's `cfg` decorator macro is a variant of this approach that just happens to apply to a grammatical entity, rather than arbitrary streams of tokens. Crochet did consider this approach at first, since it's straightforward to implement, but there's a few quite unfortunate things in Crochet's use case.

First, Crochet is designed under more open-world assumptions, and testing in Browsers + Node + Electron *is* a common scenario that should happen with a very short feedback cycle. That way it's a bit unfortunate if we have to recompile three versions of the entire application before the user can test any changes, the added latency is just not acceptable.

But second, and a bit more damning, Crochet sadly needs to deal with the inclusion/exclusion of code in more cases than just what platform it will be running on. For example, code may or may not be included depending on what capabilities you have granted to a package. If a package optionally asks for access to the file system, but you don't grant that capability, then it's not great to load all of the additional code and just have it sit there in memory.

Now, you might wonder what the big deal is, after all, we could just compile a different version of the application every time the user changes the capabilities that have been granted, right? Well, the problem is that, just like in your phone, users can grant new capabilities *while* the application is running. Maybe the application has a "upload a photo" button which, when clicked, requests access to your pictures folder in order to select a photo. At that point, all of the code we thought was unreachable at the time we were compiling the application now becomes reachable again. And we need to make it work without losing the current application's state or imposing any significant pause towards the user—because they are in the loop now, any millisecond we waste here is too precious.

Crochet has a runtime linker, since you need one if you have open-world assumptions anyway (e.g.: if you allow people to edit code in the REPL, you have to re-link your code anyway). But before we link things, we need to load them. Crochet uses files as a compilation unit (not to be confused with a [module](https://people.mpi-sws.org/~rossberg/f-ing/) --- Crochet does call them that, but Crochet has no concept of modules). Each file is a "bag of loosely defined, arbitrary code entities". And these files can be loaded in any order because linking happens *after* loading, not before. And linking has to be re-done after any changes to loaded code anyway.

Each of these files has a small constraint describing when they should be loaded. The loader automatically figures out when to load and when to unload code by solving these constraints every time there's a change to the runtime of the application. For our key/value package we should have the following:

```json
{
  "native": [
    {
      "name": "browser-local-storage.js",
      "target": "browser | electron"
    },
    {
      "name": "node-local-storage.js",
      "target": "node"
    },
    ...
  ],
  "sources": [
    {
      "name": "browser-local-storage.crochet",
      "target": "browser | electron"
    },
    {
      "name": "node-local-storage.js",
      "target": "node"
    },
    ...
  ]
}
```

The `target` is our constraint. The current implementation of the loader only takes a simple constraint based on the platform, but the planned feature is that this constraint will involve capabilities granted, the platform, and arbitrary goal tags (e.g.: users might want to load different code or request different capabilities when running tests in a CI environment versus running the real application on end-user machines).

Users of the key/value package don't need to do any configuration, and they don't need to change any of their code, since the loader will figure out what pieces of the system need to exist to fulfill all of the constraints automatically. That takes care of us not pushing this configuration onto package-users or end-users.


## Debugging

This is the last constraint we have. Our key/value package needs to have a good debugging story, and we'd like for that to not take much effort from us package-developers (that just means we wouldn't do it), or from our users (that just means they'd be left frustrated when they see an error). Debugging is an often overlooked aspect of language and library design, but Crochet cannot afford to leave it up to users to figure things out because its target audience is non-professional programmers, many of which will have never programmed before.

Crochet relies heavily on exploration and observation-based debugging. That is, it tries as much as possible to make all of the system observable, and it tries to make it safe for users to explore things, or figure out how to fix things by just trying random stuff out. Again, non-professional programmers, they're likely not building medical devices, they don't need to work out a full mathematical proof of the system before they write some code.

Out of the box (without any additional effort from us), our package is debuggable in the following ways:


### Exception-based programming

Crochet treats exceptions with great care, though it's a bit too chatty right now. Currently the system halts execution and prints an annotated stack trace, which should be familiar to most programmers (except for the "annotated" part, perhaps), but the end goal is to have [an exception bring up the debugger](https://github.com/pharo-open-documentation/pharo-wiki/blob/master/General/Exceptions.md) where the user can inspect the current state of the system, learn more about what has failed, fix the code right there and continue the execution, without losing any of the current application state.

For example, if the user forgets to install the handler, they'll get this stack trace:

```
Error: no-handler: No handler for <crochet.storage.key-value/effect kv-storage.lookup> was found in this context.

Arising from:
  In (crochet.storage.key-value/kv-storage) try-at: (text)
    from module source/store.crochet in crochet.storage.key-value
       59 |   let Result = perform kv-storage.lookup(Partition, Key);

  In (crochet.storage.key-value/kv-storage) at: (text) default: (any)
    from module source/store.crochet in crochet.storage.key-value
      103 |   self try-at: Key

  In main: (list)
    from module source/main.crochet in key-value-test
        7 |   Store at: "message" default: "hello";
```

Note that there's a "here's a proposed solution" section missing in this already too chatty stack trace, but Crochet's current implementation does not have a common proposed error solution yet (any such feature would need to integrate with custom errors raised from packages, in any case).

On the other hand, if the user tries reading a key that does not exist, the VM will halt with this stack trace:

```
Error: panic: key not found

Additional information:
  [
    reason -> <crochet.core/error>(
      reason -> <crochet.storage.key-value/kve-not-found>
    ),
    user-data -> [
      key -> "message"
    ]
  ]

Arising from:
  In (crochet.core/panic) message: (text) tag: (text) data: (any)
    from module source/errors/panic.crochet in crochet.core
        5 |   foreign etc.panic(Tag, Message, Data);

  (...)

  In (crochet.storage.key-value/kv-storage) at: (text)
    from module source/store.crochet in crochet.storage.key-value
       96 |   self try-at: Key

  In (root)
        8 |     Store at: "message";
```

In this case there was an effort necessary from our package. When we defined `partitioned-storage at: _`, we had to provide that additional `key` data.

```
command partitioned-storage at: (Key is text) do
  let Partition = package to-key: self.location;
  perform storage-backend.lookup(Partition, Key)
    | value-or-panic: "key not found" data: [key -> Key];
end
```

If we had invoked just `_ value-or-panic: "key not found"` we would still get the error message and stack trace, but it would be harder for a user to figure out what key was not found, exactly. And if presented with a debugger at that point, it would be more difficult for them to, for example, pick some value to put there and continue the program execution.


### Replay-based programming

Crochet aims to support a record-and-replay workflow out of the box. To this end the language is already designed to be as pure as possible, such that the recorder doesn't actually *have* to do any work, as all executions of the program from the source code should be deterministic.

Of course our key/value store does not fit that idealised picture, because the storage we're interacting with is not even under Crochet's control. There are inherent effects at play there, but Crochet conveniently pushes library authors to model these as [effect algebras](https://arxiv.org/abs/1807.05923). Even though in essence Crochet's effects and handlers are much closer to old [Common Lisp's conditions](https://wiki.c2.com/?CommonLispConditionSystem) or [Smalltalk's exceptions](https://github.com/pharo-open-documentation/pharo-wiki/blob/master/General/Exceptions.md).

Still, the fact that they *are* at least declared as an algebra, consisting of a set of operations over some object domain and (hopefully!) a handful of equational laws, allows us to trace a very good line between "deterministic computation" and "effectful computation". This way, Crochet's recorder just has to record each "perform" along with its "continue with/return" operation and we have a fully deterministic trace in our hands, ready to participate in a [replay debugging session at any granularity level](https://robotlolita.me/talks/codebeam/).

[Crochet's tracing support](https://robotlolita.me/diary/2022/02/crochet-0.14/#tracing-support-and-time-travelling) is still a work in progress, but once it's released users would be able to, with no changes needed to either user code or our package code, use the following to record their program execution and then replay and inspect it (deterministically) as many times as they wish:

```
let Recording =
  trace record-for-replay: {
    let Store = store partition: package;
    Store at: "message" put: "hello";
    let Message = Store at: "message";
    Store delete-at: "message";
    Message;
  };

Recording replay;
```

A recording is just a list of all non-deterministic events that happened in the VM from that closure activation record's lifecycle, along with the result of that event. Here we would have a recording that would pretty much consist of the list:

```
[
  apply(<closure reference>, <handler-stack>),
  (
    storage-backend.store("pkg:my-package", "message"),
    continue with result.ok(nothing)
  ),
  (
    storage-backend.lookup("pkg:my-package", "message"),
    continue with result.ok("hello")
  ),
  (
    storage-backend.remove-at("pkg:my-package", "message"),
    continue with result.ok(nothing)
  )
]
```

When the VM replays this recording, it restarts the execution of that closure we've provided with the same stack state it initially had. Then, every time it hits a "perform" instruction, it looks at the first item of the list to see if it matches what's being asked to be performed, and if it matches, it continues the execution immediately with the recorded result, rather than trying to invoke the effect handler again. Of course, it has to halt if the next effect recorded doesn't match the currently performed one.

This is great for users to figure out errors in their code that uses the key/value store we're providing, as long as they can assume that the key/value storage works as intended and as promised in the effect's contract and laws. Sadly, this isn't *always* the case, sometimes the package providing access to some weird external system will have bugs—sometimes the external system itself will have bugs. Because this external system is not under Crochet's control, the replay approach is of little use for debugging them directly; though users can manually synchronise both states and step through the actions in Crochet, then manually inspect the external system's state at each point.

One thing that other record-and-replay debuggers, like [rr](https://rr-project.org/), do is to also record a snapshot of external systems. For example, if the application reads or writes a file to the file system, then the recording will include that change to the file system as well. This of course works great if the recorder knows how to snapshot things, but, for example, if we provide a library that allows us to make HTTP requests towards some random web service, how the fuck will the recorder snapshot it? Is the recorder even allowed to snapshot it?

Because Crochet will include a significant amount of interactions with such external systems, it's not really reasonable to expect the recorder to handle them. So it falls on the library author to figure out a way of synchronising the external system's state and expose its synchronised snapshot during replay. This does mean more effort on the package author to make the external system they're wrapping debuggable, but there are no changes to the workflow of the end-user debugging their code that uses the package.


## TL;DR

Even building a seemingly trivial library can be a significant engineering effort once you consider goals such as "debugging", "testing", "security", and "multiple platform support". In this article I tried going into a bit of details on my usual design process for Crochet, using a small library as example.

But the core ideas can be summed up as follows:

### Capability security is not a panacea

Security is tricky, and you're always walking on a blurry line between "security" and "usability". [Usability](https://robotlolita.me/diary/2020/10/capability-security-ux/) is essential for security, but not absolute, it depends on who your users are. You also need to keep in mind what your non-negotiable security guarantees are, because you *will* have to make trade-offs, and you want to make sure you can verify your security guarantees afterwards.

In this work the primary issues where "how do you have a multiple partitions in a shared storage, but ensure that none of them can interfere with each other, even when their 'secrets' are openly readable?", which was solved by Crochet's existing package boundaries and capability-secure package type. The stability requirement really threw me up for a spin for a while, and I'm less sure about how you'd design this in a way that doesn't rely on the runtime system to enforce the access guarantees.

Whereas the "how do you support storing complex types" constraint was solved by having each partition providing its own serialisation strategy to avoid reflection being able to forge any powerful type. Even if you use [mirror-based reflection](https://bracha.org/mirrors.pdf) here, you're essentially allowing anyone to write a string to a random file in the disk and then look at that file and go "oh, how funny, looks like we should construct a `nuke-the-universe` type from this and the package doesn't even have that capability lol".


### Globals are *very useful*

Especially for things like testing, as long as you allow them to be reconfigured. Dynamic scoping works neatly for this reconfiguration, and it has less impact on static reasoning if you pick a more restricted approach (e.g.: [effect handlers](https://www.eff-lang.org/handlers-tutorial.pdf), [co-effects](https://tomasp.net/coeffects/), or [parameterise](https://docs.racket-lang.org/guide/parameterize.html)).

Sometimes I feel languages valued so much static reasoning that they forgot about any sort of dynamic reasoning, and as a result we got things that are very dynamic but also very hard to reason about, like [dependency injection containers](https://en.wikipedia.org/wiki/Dependency_injection).
  
Crochet embraces global variables as much as possible, and my experience is that it's often a lot easier to write simple, secure, and still testable code. Rather than use static regions to restrict usage, Crochet relies more on linking constraints and tools to reason about linking and risks. This goes from how capability security is defined (based on capability groups restricting referencing, construction, etc), to how code is loaded.

In this work that has helped with making the end-user interface simple, so they didn't need to bother with parameterised module configuration, and also helped with making backends configurable through effect handlers.


### Linking constraints are useful

Crochet is probably in a more unique position where any code may become either reachable or unreachable at runtime, depending on users granting more capabilities or changing some goal tag. The design I eventually settled upon is reminiscent of [David Barbour's linking constraints](https://awelonblue.wordpress.com/2011/09/29/modularity-without-a-name/), but I had to divide it between loader and linker, since code needs to be loaded or unloaded every time the variables in the constraints change as well.

This at least had the positive effect that only package authors need to care about the constraints, just like C's `#if` macros or Rust's `#cfg` macro, the system can otherwise assemble a full system without more intervention, so end-users need not bother figuring out how to make things work across different platforms.

In this work, it's the package author that defines the constraints in the package configuration, users of the package just specify that they depend on it. Whenever they load the application the Crochet loader will figure out how to assemble the system in a way that works.


### Effortless debugging can't be overlooked

Debugging in Crochet is very biased towards my idea of debugging as an exploration, where you can fiddle around with things and inspect the inner workings of anything in the program at any time. While designing Crochet I tried supporting this idea of debugging across all packages with minimal effort from package authors.

It mostly works: exceptions-based programming + a debugger gives you a form of exploration similar to that of old Smalltalk environments, and effects naturally divide program operations into domains (classified by their algebras), in a way that the generic recorder can trace and replay, at different granularities, without any additional effort from users or package authors.

Where it breaks down is on the visualisation side. There's only so much you can do with generic visualisation, and at some point package authors need to hook into whatever systems you provide for debugging to give it additional data or perspectives to look into its own parts of the system's internals (or an external system's internals).

Crochet does achieve some of this with error metadata, [configurable representations](https://robotlolita.me/diary/2022/02/crochet-0.14/#multiple-representations-of-data), but there's still work to be done particularly towards supporting debugging of external systems' state in a way that's synchronised with the application's state, and we just cannot do this without increasing the burden on package authors (how much we'll have to increase it, we'll see, there's nothing very defined in this area yet).

In this work the two debugging efforts we had to put in was to create a typed error hierarchy (which is in line with the general approach for designing in Crochet anyway), and also provide some additional context information when we invoke `panic` in the code. We could have done without the last one, but it provides valuable information to the end-user in case the program halts, and takes only a few additional characters typed on that same function call.


## Appendix A: Full code listing

Note that the order of declarations here is arbitrary. Crochet can (and has to be able to) load declarations in any order. Just imagine a big `letrec` around these (which also wraps over different files).

```
% crochet

// -- End-user interface
singleton store;

command store partition: (Location has location)
              serialisation: (Serialisation has serialisation)
do
  new partitioned-storage(
    location -> Location,
    serialisation -> Serialisation,
  );
end

command store partition: (Location has location) do
  self partition: Location
       serialisation: (#json-codec of: #extended-json defaults);
end

/// Medium risk. Allows code to create and access a partitioned storage.
capability manage-partitioned-storages;
protect type store with manage-partitioned-storages;
protect global store with manage-partitioned-storages;


// -- Stable, unique, secure partitions
trait location with
  command package to-key: X -> interpolation;
end

type store-location(package is any-package, key is text);

command #store-location for: (Pkg is any-package) key: (Key is text)
requires
  restricted :: not (Key contains ":")
=
  new store-location(package -> Pkg, key -> Key);

implement location for any-package;
command package to-key: (X is any-package) =
  "pkg:[X name]";

implement location for store-location;
command package to-key: (X is store-location) =
  "loc:[X.package name]:[X.key]";


// -- Partitioned storage
type partitioned-storage(
  location is (any has location),
  serialisation is (any has serialisation)
);

command partitioned-storage contains-key: (Key is text) do
  let Partition = package to-key self.location;
  perform storage-backend.lookup(Partition, Key) is ok;
end

command partitioned-storage at: (Key is text) do
  let Partition = package to-key: self.location;
  perform storage-backend.lookup(Partition, Key)
    | value-or-panic: "key not found" data: [key -> Key];
end

command partitioned-storage at: (Key is text) put: (Value is text) do
  let Partition = package to-key: self.location;
  perform storage-backend.store(Partition, Key, Value)
    | value-or-panic: "store failed" data: [key -> Key];
end

command partitioned-storage remove-at: (Key is text) do
  let Partition = package to-key: self.location;
  perform storage-backend.delete(Partition, Key)
    | value-or-panic: "remove failed" data: [key -> Key];
end


// -- Pluggable storage backends
effect storage-backend with
  lookup(partition is text, key is text) -> result<text, error>;
  store(partition is text, key is text, value is text) -> result<nothing, error>;
  delete(partition is text, key is text) -> result<nothing, error>;
end

handler in-memory-storage-backend do
  let Storage = #cell with-value: #map empty;
with
  on storage-backend.lookup(Partition, Key) do
    condition
      when Storage value contains-key: [Partition, Key] =>
        continue with #result ok: (Storage value at: [Partition, Key]);
      
      otherwise =>
        continue with #result error: not-found;
    end
  end

  on storage-backend.store(Partition, Key, Value) do
    Storage <- Storage value at: [Partition, Key] put: Value;
    continue with #result ok: nothing;
  end

  on storage-backend.delete(Partition, Key) do
    Storage <- Storage value remove-at: [Partition, Key];
    continue with #result ok: nothing;
  end
end

/// High risk. Can change the global storage strategy.
capability manage-storage-backend;
protect handler in-memory-storage-backend with manage-storage-backend;


// -- Pluggable serialisation
trait serialisation with
  command Self encode: (X is any) -> text;
  command Self decode: (X is text) -> any;
end

open crochet.language.json;

type json-codec(codec is json);

command #json-codec of: (Codec is json) =
  new json-codec(codec -> Codec);

implement serialisation for json-codec;
command json-codec encode: X = self.codec serialise: X;
command json-codec decode: X = self.codec parse: X;
```


## Appendix B: Usage examples

Simple usage:

```
let Store = store partition: package;
Store at: "hello" put: "world";
assert (Store at: "hello") =:= "world";
Store remove-at: "hello";
assert not (Store contains-key: "hello");
```

Custom serialisation usage:

```
@| derive: "json"
@| derive: "equality"
type sound-options(
  bgm-volume is integer,
  sfx-volume is integer,
);

open crochet.language.json;

define my-json = lazy (
  #extended-json with-serialisation: (
    #json-serialisation defaults
      | tag: "sound-options" brand: #sound-options
  )
);

command package configuration-store =
  store partition: package serialisation: (json-codec of: (force my-json));

command #sound-options load =
  package configuration-store
    | at: "sound-options"
      default: new sound-options(
        bgm-volume -> 80,
        sfx-volume -> 80
      );
```

Backend configuration, likely at the `main: _` command entry-point:

```
handle
  // code that uses the key/value store called from here
with
  use in-memory-storage-backend;
end
```