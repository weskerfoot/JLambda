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

function hasOperator(operators) {
  return function (str) {
    if (len(operators) < 1)
      return false;
    return maxBy(len, operators.filter(function (x) { return str.indexOf(x) != -1; }));
  };
}

module.exports = {compose : compose,
				  not	  : not,
				  on	  : on,
          maxBy : maxBy,
          len   : len,
          hasOperator : hasOperator}
