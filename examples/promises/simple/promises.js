// # module: promises
//
// A simple implementation of promises for JavaScript.

// -- Types ------------------------------------------------------------

// ### type: Promise(α, β)
//
// @type::
//   data Promise(α, β) = {
//     value: α | β | null,
//     state: "pending" | "fulfilled" | "rejected",
//     dependencies: [{
//       fulfilled: α -> Promise(α', β),
//       rejected:  β -> Promise(α, β')
//     }]
//   }


// -- Primitives -------------------------------------------------------

// ### function: createPromise()
//
// Constructs a new promise object to be resolved later.
//
// @type: () -> Promise(α, β)
function createPromise() {
  return {
    value: null,
    state: 'pending',
    dependencies: []
  };
}


// ### function: depend(promise, onSuccess, onFailure)
//
// Creates a dependency between the value of the promise and two
// expressions. `onSuccess` is evaluated if the promise succeeds, and
// `onFailure` is evaluated if the promise fails. Both expressions are
// expected to evaluate to a new promise.
//
// @type: (Promise(α, β), α -> Promise(ψ, δ), β -> Promise(ψ, δ)) -> Promise(ψ, δ)
function depend(promise, onSuccess, onFailure) {
  var result = createPromise();

  if (promise.state === "pending") {
    promise.dependencies.push({
      fulfilled: value => depend(onSuccess(value), succeed, fail),
      rejected: error => depend(onFailure(error), succeed, fail)
    });
  } else if (promise.state === "fulfilled") {
    depend(onSuccess(promise.value), succeed, fail);
  } else if (promise.state === "rejected") {
    depend(onFailure(promise.value), succeed, fail);
  }

  return result;

  // #### function: succeed(newValue)
  // @type: ψ -> Promise(ε, φ)
  function succeed(newValue) {
    fulfil(result, newValue);
    return createPromise();
  }

  // #### function: fail(newError)
  // @type: δ -> Promise(ε, φ)
  function fail(newError) {
    reject(result, newError);
    return createPromise();
  }
}

// ### function: reject(promise, error)
//
// Rejects the promise with an error value.
//
// @type: (Promise(α, β), β) -> void
function reject(promise, error) {
  if (promise.state !== "pending") {
    throw new Error("Can't reject a non-pending promise.");
  } else {
    promise.state = "rejected";
    promise.value = error;
    var dependencies = promise.dependencies;
    promise.dependencies = [];
    dependencies.forEach(pattern => pattern.rejected(error));
  }
}

// ### function: fulfil(promise, value)
//
// Fulfills a promise with a value.
//
// @type: (Promise(α, β), α) -> void
function fulfil(promise, value) {
  if (promise.state !== "pending") {
    throw new Error("Can't fulfil a non-pending promise.");
  } else {
    promise.state = "fulfilled";
    promise.value = value;
    var dependencies = promise.dependencies;
    promise.dependencies = [];
    dependencies.forEach(pattern => pattern.fulfilled(pattern));
  }
}


// -- Convenience functions --------------------------------------------

// ### function: chain(promise, onSuccess)
//
// Creates a dependency on the successful value of a promise. Propagates
// failures.
//
// @type: (Promise(α, β), α -> Promise(α', β)) -> Promise(α', β)
function chain(promise, onSuccess) {
  return depend(promise,
                onSuccess,
                error => {
                  var result = createPromise();
                  reject(result, error);
                  return result;
                });
}

// ### function: recover(promise, onFailure)
//
// Creates a dependency on the failure value of a promise. Propagates
// successes.
//
// @type: (Promise(α, β), β -> Promise(α, β')) -> Promise(α, β')
function recover(promise, onFailure) {
  return depend(promise,
                value => {
                  var result = createPromise();
                  fulfil(result, value);
                  return result;
                },
                onFailure);
}


// -- Combining multiple promises --------------------------------------

// ### function: waitAll(promises)
//
// Constructs a promise from all the values of the source promises
// concurrently.
//
// @type: Array(Promise(α, β)) -> Promise(Array(α), β)
function waitAll(promises) {
  var values = new Array(promises.length);
  var pending = values.length;
  var resolved = false;
  var result = createPromise();

  promises.forEach((promise, index) =>
    depend(promise, value => {
      if (!resolved) {
        values[index] = value;
        pending = pending - 1;

        if (pending === 0) {
          resolved = true;
          fulfil(result, values);
        }
      }
      return createPromise();
    },
    error => {
      if (!resolved) {
        resolved = true;
        reject(result, error);
      }
      return createPromise();
    }
  ));

  return result;
}

// ### function: race(left, right)
//
// Combines two promises non-deterministically, such that the first one
// to resolve is selected as the result of the operation.
//
// @private
// @type: (Promise(α, β), Promise(α, β)) -> Promise(α, β)
function race(left, right) {
  var result = createPromise();

  depend(left, doFulfil, doReject);
  depend(right, doFulfil, doReject);

  return result;

  // #### function: doFulfil(value)
  // @type: α -> void
  function doFulfil(value) {
    if (result.state === "pending") {
      fulfil(result, value);
    }
  }

  // #### function: doReject(value)
  // @type: β -> void
  function doReject(value) {
    if (result.state === "pending") {
      reject(result, value);
    }
  }
}

// ### function: raceAll(promises)
//
// Combines multiple promises non-deterministically, such that the first
// one to resolve is selected as the result.
//
// @type: Array(Promise(α, β)) -> Promise(α, β)
function raceAll(promises) {
  return promises.reduce(race, createPromise());
}

// ### function: attempt(left, right)
//
// Combines multiple promises non-deterministically, such that the first
// successful one to resolve is selected as the result.
//
// @private
// @type: (Promise(α, β), Promise(α, β)) -> Promise(α, [β, β])
function attempt(left, right) {
  var result = createPromise();
  var errors = {};

  depend(left, doFulfil, doReject("left"));
  depend(right, doFulfil, doReject("right"));

  return result;

  function doFulfil(value) {
    if (result.state === "pending") {
      fulfil(result, value);
    }
  }

  function doReject(field) {
    return value => {
      if (result.state === "pending") {
        errors[field] = value;

        if ("left" in errors && "right" in errors) {
          reject(result, [errors.left, errors.right]);
        }
      }
    };
  }
}

// ### function: attemptAll(promises)
//
// Combines multiple promises non-deterministically, such that the first
// successful one to resolve is selected as the result.
//
// @type: Array(Promise(α, β)) -> Promise(α, Array(β))
function attemptAll(promises) {
  var initial = createPromise();
  reject(initial, []);

  return promises.reduce((result, promise) =>
    recover(attempt(result, promise), errors => errors[0].concat([errors[1]])),
    createPromise()
  );
}

// -- Exports ----------------------------------------------------------
module.exports = {
  createPromise, depend, fulfil, reject,
  chain, recover,
  waitAll, raceAll, attemptAll
};


// Local Variables:
// fill-column: 72
// End:
