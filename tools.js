function identity(a) {
  return a;
}

function compose(f, g) {
	return function(x) {
		return f(g(x));
	};
}

function not(x) {
	return !x;
}

function on(g, f) {
	return function(x,y) {
		return g(f(x), f(y));
	};
}

function maxf(f, a, b) {
  if (f(a) >= f(b))
    return a;
  return b;
}

function max(a, b) {
  if (a > b)
    return 1;
  else if (a < b)
    return -1;
  else
    return 0;
}

function min(a, b) {
  if (a < b)
    return 1;
  else if (a > b)
    return -1;
  else
    return 0;
}

function maxBy(f, xs) {
  if (xs.length < 1)
    return false;
  return xs.reduce(function(maxval, a) { return maxf(f, maxval, a); });
}

function sortBy(f, xs) {
  return xs.sort(f);
}

function len(xs) {
  return xs.length;
}

function takeWhile(f, xs) {
  var result = [];
  for (var i = 0; i < xs.length; i++) {
    if (f(xs[i]))
      result.push(xs[i]);
    else
      break;
  }
  return result;
}

function dropWhile(f, xs) {
  for (i = 0; i < xs.length; i++) {
    if (!f(xs[i]))
      break;
  }
  return xs.slice(i);
}

function span(f, xs) {
  return [takeWhile(f, xs), dropWhile(f, xs)];
}

function eq(a) {
  return function(b) {
    return a[0] === b[0];
  };
}

function equal(a) {
  return function(b) {
    return a === b;
  };
}

function groupBy(eq, xs) {
  var groups = [];
  var spanned;
  while (xs.length > 0) {
    spanned = span(eq(xs[0]), xs.slice(1));
    groups.push([xs[0]].concat(spanned[0]));
    xs = spanned[1];
  }
  return groups;
}

function groupOps(ops) {
  return groupBy(eq, ops.sort());
}

function unique(ops) {
  return groupOps(ops).map(function(x) { return x[0]; });
}

function find(f, haystack) {
  for(var i = 0; i < haystack.length; i++) {
    if (f(haystack[i]))
      return i;
  }
  return false;
}

function dict(pairs) {
  var o = new Object();
  pairs.map(function(p) {
    o[p[0]] = p[1];
  });
  return o;
}


/*
 * Problem:
 *  >> > >>^ <- longest one must be matched
 *  regex?
 */

RegExp.escape= function(s) {
      return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

function operatorMatch(ops) {
  var rstring = ops.sort(min).reduce(
  function(acc, x) {
    return acc + "(" + RegExp.escape(x) + ")|";
  }, "");
  var reg = new RegExp(rstring);
  return function(x) {
    var matched = reg.exec(x);
    if (matched[0])
      return matched[0];
    else
      return false;
  };
}
/*
var print = console.log;

var testOps = [">>", ">>&", ">", "aaaaa:", ">="];

var matcher = operatorMatch(testOps);
print(matcher(">="));
*/

module.exports = {compose : compose,
				  not	  : not,
				  on	  : on,
          maxBy : maxBy,
          len   : len,
          groupOps : groupOps,
          opMatch : operatorMatch,
          dict: dict,
          unique : unique};
