/*
 * This module takes a parse tree in a surface format
 * and transforms it into the "core" language which is
 * much simpler and easier to type-check, optimize, and evaluate
 */

var typ = require("./representation.js");

// Lists get desugared to nested function calls
// i.e. (cons (cons (cons ...)))
function desugarList(lst) {
  if (lst.xs.length <= 0) {
    return new typ.Nil();
  }
  else {
    var x = desugar(lst.xs[0]);
    var rest = lst.xs.slice(1);
    return new typ.App(new typ.App(new typ.Name("(:)"), x), desugarList(new typ.ListT(rest)));
  }
}

function desugarDefFunc(def) {
  return new typ.Def(def.ident, new typ.FuncT(desugar(def.params), desugar(def.body)));
}

//function desugarString(str) {


function desugar(stx) {
  switch (stx.exprType) {
    case "If":
      if (stx.elseexp)
        return new typ.If(desugar(stx.condition), desugar(stx.thenexp), desugar(stx.elseexp));
      return new typ.If(desugar(stx.condition), desugar(stx.thenexp));
    case "FunctionDefinition":
      return desugarDefFunc(stx);
    case "Definition":
      return new typ.Def(stx.ident, desugar(stx.val));
    case "Name":
      return stx;
    case "Application":
      if ((stx.func.ident === "-" ||
          stx.func.ident === "+") &&
          stx.p) {
            return new typ.UnaryOp(desugar(stx.func), desugar(stx.p));
          }
      if (stx.p)
        return new typ.App(desugar(stx.func), desugar(stx.p));
      return new typ.App(stx.func);
    case "Function":
      return new typ.FuncT(stx.p, desugar(stx.body));
    case "List":
      return desugarList(stx);
    case "Bool":
      return stx;
    case "String":
      return stx;
    case "Float":
      return stx;
    case "Integer":
      return stx;
    default:
      return stx;
  }
}

module.exports = { desugar : desugar };
//var test = typ.ListT([1,2,3]);

//console.log(desugarList(test));


