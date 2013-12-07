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

// See: https://en.wikipedia.org/wiki/Trie
/*function buildTrie(prefix, operators) {
  var grps = groupOps(operators);
  return [prefix, grps.map(
    function(ops) {
      if (ops.length === 1)
        return ops;
      return buildTrie(ops[0][0],
        ops.map(
          function(op) {
            return op.slice(1);
          }).filter(function (x){ return x;}));
    })];
}*/

function find(f, haystack) {
  for(var i = 0; i < haystack.length; i++) {
    if (f(haystack[i]))
      return i;
  }
  return false;
}

/*function matchNext(c, trie) {
  var next = find(function(path) {
    if (path.length === 1) {
      return path[0][0] === c;
    }
    return path[0] === c;
  }, trie);
  if (next !== false)
    return trie[next];
  return false;
}

function trieMatch(n, str, trie) {
  if (trie.length === 1 && ((typeof trie[0]) === "string")) {
    if (trie[0].slice(1) === str.slice(0, trie[0].length-1))
      return trie[0].length + n;
    return false;
  }
  var matched = matchNext(str[0], trie);
  if (matched && matched.length > 1)
    return trieMatch(n+1, str.slice(1), matched[1]);
  else if (matched)
    return trieMatch(n, str.slice(1), matched)
  else
    return n;
}

function trieMatch(matches, iterated, n, str, trie) {
  console.log(str, trie);
  iterated = iterated + str[0];
  if (matchable(iterated)) {
    matches.push(n);
  }

  var matched = matchNext(str[0], trie);
  if (matched) {
    return trieMatch(matches, iterated, n+1, str.slice(1), matched);
  }
  else
    return matches;
}

var ops = ["**","**%a&&","**%*^", "$$", "&s"];
function matchable(x) {
  return find(equal(x), ops) !== false;
}

var trie = buildTrie("", ["**","**%a&&","**%*^", "$$", "&s"])[1];
//console.log(find(function(x) { return x === "a";}, "tybabb"));
//console.log(matchNext('*', matchNext('*',trie)[1]));
//function matchStr(n, str, trie) {
//}
//
var str = "**%a&&345454";
var matched = trieMatch([], "", 0, str, trie);
console.log(matched);
//console.log(matchStr(0, "**^*$4545", buildTrie("", ["**", "**^"])[1]));
*/


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
          opMatch : operatorMatch}
