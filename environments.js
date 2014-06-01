/*
 * An environment is just an object that maps identifiers to JLambda expressions
 * with a few built-in (a standard Prelude environment)
 */

var errors = require("./errors.js");
var rep = require("./representation.js");


/*
 * returns the new environment after mutating it
 * values = [(identifier, JLambda expression)]
 */
function extend(env, values) {
  var new_env = {};
  var env_keys = Object.keys(env);
  for (var i = 0; i < env_keys.length; i++) {
    new_env[env_keys[i]] = env[env_keys[i]];
  }
  for (i = 0; i < values.length; i++) {
    new_env[values[i][0].val] = values[i][1];
  }
  return new_env;
}

// creates a new environment initialized with the pairs in values
function makeEnv(name, values) {
  var env = {};
  env.name = name;
  for (var i = 0; i < values.length; i++) {
    name = values[i][0].val;
    var val = values[i][1];
    env[name] = val;
  }
  return env;
}

function lookup(name, env) {
  var value = env[name];
  if (!value) {
    throw errors.UnboundError(name, env.name);
  }
  return value;
}

module.exports = {
  lookup : lookup,
  extend : extend
};
