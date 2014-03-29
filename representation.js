var errors = require("./errors.js");
var _ = require("underscore");

var Expression = {
	display :
		function() {
			return this.exprType + " " + this.val;
		},
	type :
		function () {
			return this.exprType;
		}
};

var TypeExpression = {
  unify :
		function (t) {
			if (this.expr === t.expr) {
				return t.expr;
			}
			else {
				console.log("Could not unify " + this.expr + " with " + t.expr);
			}
		},
  isTypeExpr : true
};

var isTypeExpr = _.property("isTypeExpr");

function Closure(bound_vars, free_vars, body, env) {
  this.bound_vars = bound_vars;
  this.free_vars = free_vars;
  this.body = body;
  this.env = env;
  this.exprType = "Closure";
  return this;
}

function LetExp(pairs, body) {
  if (!pairs.every(function(x) {
    return (x.exprType === "Definition" ||
            x.exprType === "FunctionDefinition");
  })) {
    throw "let can only be used to bind things to names or functions";
  }
  this.exprType = "Let";
  this.val = [pairs, body];
  this.pairs = pairs;
  this.body = body;
  return this;
}
LetExp.prototype = Expression;

function UnaryOp(op, v) {
  this.exprType = "Unary";
  this.val = v;
  this.op = op;
  return this;
}
UnaryOp.prototype = Expression;

function IntT(v) {
	this.exprType = "Integer";
	this.val = parseInt(v, 10);
	return this;
}
IntT.prototype = Expression;

function FloatT(v) {
	this.exprType = "Float";
	this.val = parseFloat(v, 10);
	return this;
}

FloatT.prototype = Expression;

function StrT(v) {
	this.exprType = "String";
	this.val = v;
	return this;
}

StrT.prototype = Expression;

function BoolT(b) {
	if (b === "true") {
		this.val = true;
	}
	else {
		this.val = false;
	}
	this.exprType = "Bool";
	return this;
}

BoolT.prototype = Expression;

function ListT(xs) {
	this.xs = xs;
	this.val = xs;
	this.exprType = "List";
	return this;
}

function Nil() {
  this.exprType = "Nil";
  return this;
}
Nil.prototype = Expression;

ListT.prototype = Expression;

function FuncT(p, body) {
	this.p = p;
	this.body = body;
	this.val = [p, body];
	this.exprType = "Function";
	return this;
}

FuncT.prototype = Expression;

//Wrapper for function objects
function OpT(operator) {
	this.op = operator;
	this.val = this.op;
	this.exprType = "Function";
	return this;
}

OpT.prototype = Expression;

// Applications separate from other types
function App(func, p) {
	this.func = func;
	this.exprType = "Application";
	if (p)
		this.p = p;
	return this;
}

// Names are not types
function Name(identifier) {
	this.ident = identifier;
	this.val = this.ident;
	this.exprType = "Name";
	return this;
}

function Def(ident, exp) {
	this.ident = ident;
	this.val = exp;
	this.exprType = "Definition";
	return this;
}

function DefFunc(ident, params, body) {
  this.ident = ident;
  this.val = this.ident;
  this.params = params;
  this.body = body;
  this.exprType = "FunctionDefinition";
  return this;
}

function If(condition, thenexp, elseexp) {
	this.condition = condition;
	this.thenexp = thenexp;
	this.elseexp = elseexp;
	this.exprType = "If";
	return this;
}

function TypeVar(name) {
  this.exprtype = "TypeVar";
  this.name = name;
  return this;
}

TypeVar.prototype = TypeExpression;

function TypeOp(name, params, body) {
  if (!_.every(params, _.compose(
                          _.partial(_.isEqual, "TypeVar"),
                          _.property("exprtype")))) {
    throw errors.JInternalError(
        "Parameters to a type operator must be type variables"
    );
  }
  this.name = name;
  this.params = params;
  this.body = body;
  return this;
}

TypeOp.prototype = TypeExpression;

function TypeBinding(expression, type) {
  this.expr = expression;
  this.type = type;
  return this;
}

TypeBinding.prototype = TypeExpression;

//Applies the function ``name'' to the list of parameters
function makeApp(name, parameters) {
	if (parameters) {
		return parameters.slice(1).reduce(function(f, ident) {
			return new App(f, ident);
		}, new App(name, parameters[0]));
	}
	else {
		return new App(name);
	}
}

function makeGensym() {
  var n = 0;
  return function() {
    var x = "G"+n;
    n = n + 1;
    return x;
  };
}

var gensym = makeGensym();

OPInfo = {"+" : [3, "Left"],
         "-" :  [3, "Left"],
         "*" :  [4, "Left"],
         "/" :  [4, "Left"],
         "^" :  [5, "Right"],
          "++" : [3, "Left"],
          "==" : [2, "Left"],
          ">" :  [2, "Left"],
          ">=" : [2, "Left"],
          "<" :  [2, "Left"],
          "<=" : [2, "Left"],
          "&&" : [2, "Left"],
          "||" : [2, "Left"],
          "::" : [2, "Left"],
          ":" : [1, "Left"],
          "$" : [1, "Left"],
          ">>" : [1, "Left"],
          ">>=" : [1, "Left"],
          "<$>" : [1, "Left"],
          "." : [1, "Left"],
          "," : [1, "Left"]};

module.exports =
   {
     IntT   : IntT,
     FloatT : FloatT,
     StrT   : StrT,
     BoolT  : BoolT,
     ListT  : ListT,
     FuncT  : FuncT,
     App    : App,
     Name   : Name,
     Def    : Def,
     OpT   : OpT,
     OPInfo : OPInfo,
     makeApp : makeApp,
     If : If,
     DefFunc : DefFunc,
     UnaryOp : UnaryOp,
     Nil : Nil,
     LetExp : LetExp,
     gensym : gensym,
     TypeVar : TypeVar,
     TypeOp : TypeOp,
     TypeBinding : TypeBinding,
     Closure : Closure
   };
