var _ = require("underscore");

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

function max(a, b) {
  if (a > b) {
    return 1;
  }
  else if (a < b) {
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
                   return op.length > 0;
                 });
  ops.sort(min);
  var rstring = ops.reduce(
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
