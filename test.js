#!  /usr/bin/node

var parser = require("./parse.js");
var cexps = require("./cexps.js");
var closures = require("./closure_conversion.js");
var desugar = require("./desugar.js");
var environments = require("./environments.js");
var errors = require("./errors.js");
var tokens = require("./tokenize.js");
var tools = require("./tools.js");
var typecheck = require("./typecheck.js");
var _ = require("underscore");

var qc = require("quickcheck");
var assert = require("assert");


/* my own generators */
function arbArray(gen) {
  return qc.arbArray(gen);
}

function arbArrays(gen) {
  return function() {
    return qc.arbArray(
    function () {
      return qc.arbArray(gen);
    })
  };
}


function arbPair(gen) {
  return function() {
    return [gen(), gen()];
  };
}

function arbArrayofPairs() {
  return arbArray(function() {
    return arbArray(arbPair(qc.arbString));
  });
}

function arbPairs() {
  return arbArray(arbPair(qc.arbString));
}


/* Tests for misc tools */
function emptyProp(xs) {
  return (tools.empty(xs) === tools.empty(xs) &&
          ((tools.empty(xs) === true) ||
           (tools.empty(xs) === false)));
}


function dictProp(pairs) {
  var dict = tools.dict(pairs);
  var result = _.map(pairs,
         function(pair) {
           if  ((_.size(pair) < 2) ||
               (_.size(pair[0]) < 1) ||
               (_.size(pair[1]) < 1)) {
                 return true;
               }
           return dict[pair[0]] === pair[1];
         });
  if (_.every(result, _.identity)) {
    return true;
  }
  return false;
}

function opMatchProp(strings) {
  console.log(typeof strings);
  if (strings.length < 1) {
    return true;
  }
  var match = tools.opMatch(strings);
  return _.map(strings,
         function(str) {
           return match(str);
         });
}

function extendProp(pair) {
  if (pair.length < 2) {
    // empty lists or lists with one item are undefined
    // so just return true because extend can't handle them
    return true;
  }
  var x = _.first(pair);
  var y = _.first(_.rest(pair));
  var extended = tools.extend(x,y);
  return x.length + y.length === extended.length;
}

function toolsTests() {
  assert.equal(true, tools.empty([]));
  assert.equal(true, qc.forAll(dictProp, arbArrayofPairs));
  assert.equal(true, qc.forAll(extendProp, arbPairs));
  assert.equal(true, qc.forAll(opMatchProp, arbArrays(qc.arbString)));
}


toolsTests();
