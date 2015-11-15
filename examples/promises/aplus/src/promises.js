// # module: promises
//
// An ECMAScript 2015 Promises implementation.

// -- Helpers ----------------------------------------------------------

// ### function: isCallable(a)
//
// Tests if a value is callable.
//
// @private
function isCallable(a) {
  return typeof a === "function";
}

// ### function: isObject(a)
//
// Tests if a value is an Object.
//
// @private
function isObject(a) {
  return Object(a) === a;
}

// ### function: triggerPromiseReactions(argument, reactions)
//
// Runs a list of dependent computations for a promise.
//
// @private
function triggerPromiseReactions(argument, reactions) {
  reactions.forEach(f => enqueueJob(() => f(argument)));
}

// ### function: enqueueJob(job)
//
// Runs a computation asynchronously.
//
// @private
function enqueueJob(job) {
  setImmediate(job);
}

// ### function: attempt(reaction, fail, transformation)
//
// Tries to transform the value before running the reaction,
// fails if the transformation fails.
//
// @private
function attempt(reaction, fail, transformation) {
  return value => {
    try {
      reaction(transformation(value));
    } catch (e) {
      fail(e);
    }
  };
}

// ### function: fulfil(promise, resolution)
//
// Resolves a promise with a value.
//
// @private
function fulfil(promise, resolution) {
  if (promise.state === "pending") {
    if (resolution === promise) {
      reject(promise, new TypeError("Can't resolve a promise with itself."));
    } else {
      if (!isObject(resolution)) {
        doFulfil(promise, resolution);
      } else {
        try {
          if (!isCallable(resolution.then)) {
            doFulfil(promise, resolution);
          } else {
            enqueueJob(() => resolution.then(x => fulfil(promise, x), x => reject(promise, x)));
          }
        } catch(e) {
          reject(promise, e);
        }
      }
    }
  }
}

// ### function: doFulfil(promise, resolution)
//
// Puts a value in a promise.
//
// @private
function doFulfil(promise, resolution) {
  if (promise.state === "pending") {
    promise.state = "fulfilled";
    promise.value = resolution;
    var reactions = promise.fulfilReactions;
    promise.rejectReactions = [];
    promise.fulfilReactions = [];
    triggerPromiseReactions(resolution, reactions);
  }
}

// ### function: reject(promise, reason)
//
// Rejects a promise with a value.
//
// @private
function reject(promise, reason) {
  if (promise.state === "pending") {
    promise.state = "rejected";
    promise.value = reason;
    var reactions = promise.rejectReactions;
    promise.rejectReactions = [];
    promise.fulfilReactions = [];
    triggerPromiseReactions(reason, reactions);
  }
}


// -- Implementation ---------------------------------------------------

// ### class: Promise(α, β)
//
// The Promise constructor.
function Promise(executor) {
  if (!isCallable(executor)) {
    throw new TypeError("executor must be a function.");
  }

  this.value = null;
  this.state = "pending";
  this.fulfilReactions = [];
  this.rejectReactions = [];

  try {
    executor(x => fulfil(this, x), x => reject(this, x));
  } catch(e) {
    reject(this, e);
  }
}

// #### method: resolve(x)
//
// Creates a promise containing a successful value.
Promise.resolve = function(x) {
  return new Promise((resolve, reject) => resolve(x));
};

// #### method: reject(x)
//
// Creates a promise containing a failure value.
Promise.reject = function(x) {
  return new Promise((resolve, reject) => reject(x));
};

// #### method: then(onSuccess, onFailure)
//
// Transforms the value inside the promise.
Promise.prototype.then = function(onSuccess, onFailure) {
  return new Promise((resolve, fail) => {
    if (!isCallable(onSuccess)) {
      onSuccess = () => resolve(this.value);
    }

    if (!isCallable(onFailure)) {
      onFailure = () => fail(this.value);
    }

    if (this.state === "pending") {
      this.fulfilReactions.push(attempt(resolve, fail, onSuccess));
      this.rejectReactions.push(attempt(fail, fail, onFailure));
    } else if (this.state === "fulfilled") {
      enqueueJob(() => attempt(resolve, fail, onSuccess)(this.value));
    } else if (this.state === "rejected") {
      enqueueJob(() => attempt(fail, fail, onFailure)(this.value));
    }
  });
};

// #### method: catch(onFailure)
//
// Transforms the failure value inside a promise.
Promise.prototype.catch = function(onFailure) {
  return this.then(undefined, onFailure);
};

// #### method: all(iterable)
//
// Combines all promises in the iterable concurrently. Fails if one fails.
Promise.prototype.all = function(iterable) {
  var promises = [...iterable];
  var values = new Array(promises.length);
  var pending = values.length;
  var resolved = false;

  return new Promise((resolve, reject) => {
    promises.forEach((promise, index) => {
      promise.then(
        value => {
          if (!resolved) {
            values[index] = value;
            pending = pending - 1;

            if (pending === 0) {
              resolved = true;
              resolve(values);
            }
          }
        },
        error => {
          if (!resolved) {
            resolved = true;
            reject(error);
          }
        }
      );
    });
  });
};

// ### method: race(iterable)
//
// Combines promises non-deterministically such that the first one
// to resolve becomes the result.
Promise.prototype.race = function(iterable) {
  var resolved = false;

  return new Promise((resolve, reject) => {
    for (let promise of iterable) {
      promise.then(
        value => {
          if (!resolved) {
            resolved = true;
            resolve(value);
          }
        },
        error => {
          if (!resolved) {
            resolved = true;
            reject(error);
          }
        }
      );
    }
  });
};


// -- Exports ----------------------------------------------------------
module.exports = Promise;
