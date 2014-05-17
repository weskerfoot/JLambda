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
    },
  linenum : 0,
  charnum : 0
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

function isTypeExpr(x) {
  return x.isTypeExpr !== undefined;
}

function isIrregularTypeOp(x) {
  return (x === "->");
}

function flattenTypeApp(stx) {
  if (isTypeExpr(stx)) {
    return true;
  }
  if (stx.exprType === "Application") {
    /* it might be a type application so recursively check it */
    if (stx.p !== undefined) {
      return  _.flatten([flattenTypeApp(stx.p), flattenTypeApp(stx.func)]);
    }
    else {
      return _.flatten([flattenTypeApp(stx.func)]);
    }
  }
  if (stx.exprType === "Name") {
    /*
     * Either it is a type operator
     * or we assume it is a type variable
     * since it was not capitalized
     */
    return true;
  }
  return {
    failed : true,
    stx : stx
  };
}


function isTypeExprRec(stx) {
  var flattened = flattenTypeApp(stx);
  for(var i = 0; i < flattened.length; i++) {
    if (flattened[i].failed !== undefined &&
        flattened[i].failed) {
          return flattened[i];
        }
  }
  return true;
}

function App(func, p) {
  this.func = func;
  this.exprType = "Application";
  if (p)
    this.p = p;
  return this;
}

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
    throw errors.JInternalError(
      "let can only be used to bind things to names or functions"
      );
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

ListT.prototype = Expression;

function Nil() {
  this.exprType = "Nil";
  return this;
}

Nil.prototype = Expression;


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

App.prototype = Expression;

// Names are not types
function Name(identifier) {
  this.ident = identifier;
  this.val = this.ident;
  this.exprType = "Name";
  return this;
}

Name.prototype = Expression;

function Def(ident, exp) {
  this.ident = ident;
  this.val = exp;
  this.exprType = "Definition";
  return this;
}

Def.prototype = Expression;

function DefFunc(ident, params, body) {
  this.ident = ident;
  this.val = this.ident;
  this.params = params;
  this.body = body;
  this.exprType = "FunctionDefinition";
  return this;
}

DefFunc.prototype = Expression;

function If(condition, thenexp, elseexp) {
  this.condition = condition;
  this.thenexp = thenexp;
  this.elseexp = elseexp;
  this.exprType = "If";
  return this;
}

If.prototype = Expression;

function TypeVar(name) {
  this.exprtype = "TypeVar";
  this.name = name;
  this.exprType = "TypeVar";
  return this;
}

TypeVar.prototype = TypeExpression;

function TypeOp(name) {
  this.name = name;
  this.val = name;
  this.exprType = "TypeOperator";
  return this;
}

TypeOp.prototype = TypeExpression;

function isTypeExpr(expr) {
  if (!expr.exprType) {
    throw errors.JInternalError(expr);
  }
  return ((expr.exprType === "TypeOperator") ||
          (expr.exprType === "TypeVar") ||
          (expr.exprType === "TypeApplication"));
}

function TypeApp(expression, type) {
  if (isTypeExprRec(expression) &&
      expression.exprType !== "Name") {
    throw errors.JInternalError(
      "Left-hand-side of type application must not be in the type language"
      );
  }
  if (!isTypeExprRec(type)) {
    throw errors.JInternalError(
      "Right-hand-side of type application must be a type expression"
      );
  }
  this.expression = expression;
  this.type = type;
  this.exprType = "TypeApplication";
  return this;
}

TypeApp.prototype = TypeExpression;

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

//console.log(isTypeExpr(new Name("T")));

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
          "," : [1, "Left"],
          "->" : [1, "Right"]};

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
     TypeApp: TypeApp,
     Closure : Closure,
     isTypeExpr : isTypeExprRec
   };
