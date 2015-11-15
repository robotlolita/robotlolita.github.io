// # module: promises
//
// An implementation of pure promises.

// -- Symbols ----------------------------------------------------------
//
// Used for storing the computation associated with the promise.
var expression = Symbol('computation');

// -- Implementation ---------------------------------------------------

// ### class: Promise(computation)
//
// Constructs a new promise for a particular expression.
function Promise(computation) {
  this[expression] = computation;
}

// ### function: resolve(x)
//
// Constructs a new promise with the successful value `x`.
Promise.resolve = function(x) {
  return new Promise((resolve, reject) => resolve(x));
};

// ### function: reject(x)
//
// Constructs a new promise with the failure value `x`.
Promise.reject = function(x) {
  return new Promise((resolve, reject) => reject(x));
};

// ### function: run(promise, onSuccess, onFailure)
//
// Runs a promise and all of its dependencies.
Promise.run = function(promise, onSuccess, onFailure) {
  promise[expression](onSuccess, onFailure);
};

// ### method: then(onSuccess, onFailure)
//
// Transforms the value of a promise.
Promise.prototype.then = function(onSuccess, onFailure) {
  return new Promise((resolve, reject) => this.then(
    value => Promise.run(onSuccess(value), resolve, reject),
    error => Promise.run(onFailure(error), resolve, reject)
  ));
};

// ### method: catch(onFailure)
//
// Transforms the failure value of a promise.
Promise.prototype.catch = function(onFailure) {
  return this.then(
    value => Promise.resolve(value),
    onFailure
  );
};

// -- Exports ----------------------------------------------------------
module.exports = Promise;
