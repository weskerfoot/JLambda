/*
 * This module takes a parse tree in a surface format
 * and transforms it into the "core" language which is
 * much simpler and easier to type-check, optimize, and evaluate
 */

var typ = require("./representation.js");
var _ = require("underscore");

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
  return new typ.Def(def.ident,
                     curryFunc(def.params,
                               def.body));
}

function curryFunc(ps, body) {
  if (_.isEmpty(ps)) {
    return desugar(body);
  }
  else {
    return new typ.FuncT(desugar(_.first(ps)),
                         curryFunc(_.rest(ps), body));
  }
}


function desugarLet(stx) {
  var values = stx.pairs.map(desugar);
  return new typ.LetExp(values, desugar(stx.body));
}

function sugarTypeApp(stx) {
  var type;
  var expression;
  type = stx.p;
  expression = desugar(stx.func.p);
  return new typ.TypeApp(expression, type);
}


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
      if ((stx.func.func != undefined ) &&
          (stx.func.func.ident === "::")) {
            /* It's a type application probably (will be verified later)
             * In this case we actually *add* syntax here to differentiate type applications
             * from normal applications
             */
            return sugarTypeApp(stx);
          }

      if ((stx.func.ident === "-" ||
          stx.func.ident === "+") &&
          stx.p) {
            return new typ.UnaryOp(desugar(stx.func), desugar(stx.p));
          }
      if (stx.p)
        return new typ.App(desugar(stx.func), desugar(stx.p));
      return new typ.App(stx.func);
    case "Function":
      return curryFunc(stx.p, stx.body);
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
    case "Let":
      return desugarLet(stx);
    default:
      return stx;
  }
}

module.exports = { desugar : desugar };
//var test = typ.ListT([1,2,3]);

//console.log(desugarList(test));


