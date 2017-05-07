/*
 * An environment is just an object that maps identifiers to JLambda expressions
 * with a few built-in (a standard Prelude environment)
 */

var errors = require("./errors.js");
var rep = require("./representation.js");

// creates a new environment initialized with the pairs in values
function makeEnv(name, values) {
  var env = {};
  env.name = name;
  env.bindings = {};
  for (var i = 0; i < values.length; i++) {
    name = values[i][0];
    var val = values[i][1];
    env.bindings[name] = val;
  }
  return env;
}

function lookup(name, env) {
  var value = env.bindings[name];
  if (!value) {
    throw errors.JUnboundError(name, env.name);
  }
  return value;
}

module.exports = {
  lookup : lookup,
  makeEnv : makeEnv
};
