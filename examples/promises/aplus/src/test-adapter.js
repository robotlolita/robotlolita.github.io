var Promise = require('./promises');

module.exports = {
  resolved: Promise.resolve,
  rejected: Promise.rejected,
  deferred: function() {
    var resolve, reject;
    var promise = new Promise((f, g) => { resolve = f; reject = g });
    return { promise, resolve, reject }
  }
}
