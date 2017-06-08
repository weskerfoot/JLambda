var parser = require("./parse.js");
var cexps = require("./cexps.js");
var closures = require("./closure_conversion.js");
var desugar = require("./desugar.js");
var environments = require("./environments.js");
var errors = require("./errors.js");
var tokens = require("./tokenize.js");
var tools = require("./tools.js");
var typecheck = require("./typecheck.js");
var representation = require("./representation.js");
var _ = require("underscore");

var qc = require("quickcheck");
var assert = require("assert");


/* my own generators */

function arbChars(n, max, min) {
  return function () {
    return _.invoke(_.times(_.random(1, n),
                   _.partial(arbChar, max, min)),
                    "call");
  };
}

function arbChar(max, min) {
  return function() {
    return String.fromCharCode(_.random(max, min));
  };
}

function arbCharRanges(ranges, max) {
  return function() {
    return _.flatten(
      _.shuffle(
       _.map(ranges,
        function(bound) {
          return _.sample(arbChars(max, bound[0], bound[1])(),
                                   bound[1] - bound[0]);
        }))).join("");
  };
}


var arbName = arbCharRanges([[33, 33],
                             [35, 39],
                             [42,43],
                             [45, 122],
                             [124, 126]],
                             200);

var arbCapital = arbChar(65, 90);

function arbArray(gen) {
  return qc.arbArray(gen);
}

function arbStrings() {
  return qc.arbArray(qc.arbString);
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
  var match = tools.opMatch(strings);
  var result = _.every(_.map(strings,
                     function (str) {
                       if (str.replace(/ /g,'').length < 1) {
                         return true;
                       }
                       var res = match(str);
                       if (res !== false) {
                         console.log(str);
                         return true;
                       }
                       return false;
                     }),
                       _.identity);
  return result;
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

/* Tokenizer tests */


function toolsTests() {
  assert.equal(true, tools.empty([]));
  assert.equal(true, qc.forAll(dictProp, arbArrayofPairs));
  assert.equal(true, qc.forAll(extendProp, arbPairs));
  //assert.equal(true, qc.forAll(opMatchProp, arbStrings));
}

console.log(arbName());
//toolsTests();
