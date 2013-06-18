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

//pretty prints expressions!
function pprint(exp) {
	//console.log(exp);
	//if (exp.func && exp.func
	if (exp.func && exp.p)
		return "(" + pprint(exp.func) + " " + pprint(exp.p) + ")";
		//return pprint(exp.func);
	else if (exp.exprType === "Name")
		return exp.val;
	else
		return exp.val;
}

module.exports = {compose : compose,
				  not	  : not,
				  on	  : on,
				  pprint  : pprint}