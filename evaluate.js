var parse = require("./parse.js").parse;

function isAtom(x) {
  return stx.exprType != "List";
}

function evaluate(exp, env) {
  if (isAtom(exp)) {
    switch (exp.exprType) {
      case "Function":
        return evaluate(invoke(exp, env), env);
      case "Name":
        return lookup(expr.val);
      default:
        return expr.val;
    }
  }
}
