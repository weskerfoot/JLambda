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

function max(f, a, b) {
  if (f(a) >= f(b))
    return a;
  return b;
}

function maxBy(f, xs) {
  if (xs.length < 1)
    return false;
  return xs.reduce(function(maxval, a) { return max(f, maxval, a); });
}

function len(xs) {
  return xs.length;
}

function takeWhile(f, xs) {
  var result = [];
  for (i = 0; i < xs.length; i++) {
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
function buildTrie(prefix, operators) {
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
}

function matchStr(n, str, trie) {
  if (trie[0][0].length > 1 && str.length <= 1)
    return false;
  else if (trie[0].every(function(x){return x[0][0] !== str[0];})) {
    return false;
  }
  else if (trie[0].length === 1) {
    if (trie[0][0] !== str.slice(n, trie[0][0].length))
      return false;
    return trie[0][0].length + n;
  }
  else {
    return matchStr(n+1, str.slice(1), trie[0][1])
  }
}

console.log(matchStr(0, "**^*$4545", buildTrie("", ["**", "**^"])[1]));

module.exports = {compose : compose,
				  not	  : not,
				  on	  : on,
          maxBy : maxBy,
          len   : len,
          groupOps : groupOps,
          buildTrie : buildTrie}
