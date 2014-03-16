var _ = require("underscore");
var example = require("./failing.js");

function empty(xs) {
  return _.size(xs) < 1;
}

function not(x) {
	return !x;
}

function min(a, b) {
  if (a < b) {
    return 1;
  }
  else if (a > b) {
    return -1;
  }
  else {
    return 0;
  }
}

function groupOps(ops) {
  return _.groupBy(ops.sort(), _.isEqual);
}

function find(f, haystack) {
  for(var i = 0; i < haystack.length; i++) {
    if (f(haystack[i])) {
      return i;
    }
  }
  return false;
}

function dict(pairs) {
  var o = {};
  pairs.map(function(p) {
    o[p[0]] = p[1];
  });
  return o;
}

function extend(xs, ys) {
  var result = _.clone(xs);
  result.push.apply(result, ys);
  return result;
}

RegExp.escape= function(s) {
      return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

function operatorMatch(ops) {
  ops = _.filter(ops,
                 function (op) {
                   return op.replace(/ /g,'').length > 1;
                 });
  var rstring = ops.sort(min).reduce(
  function(acc, x) {
    if (!x || x.length < 1) {
      return "";
    }
    return acc + "(" + RegExp.escape(x) + ")|";
  }, "");
  var reg = new RegExp(rstring);
  return function(x) {
    var matched = reg.exec(x);
    if ((!(_.isNull(matched))) && matched[0]) {
      return matched[0];
    }
    else {
      return false;
    }
  };
}

module.exports = {
  not  : not,
  groupOps : groupOps,
  opMatch : operatorMatch,
  dict: dict,
  extend : extend,
  empty : empty,
};
