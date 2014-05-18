function pprintName(ident) {
  return pprint(ident.val);
}

function pprintFunc(func) {
  if (func.p.exprType === "Name")
    return "(lambda " + pprint(func.p) + " -> " + pprint(func.body) + ")";
  else
    return "(lambda " + func.p.map(pprint).join(" ") + " -> " + pprint(func.body) + ")";

}

function pprintApp(app) {
  if (!app.p || app.p === undefined)
    return pprint(app.func);
  return "((" + pprint(app.func) + ") " + pprint(app.p) + ")";
}

function pprintDef(def) {
  return pprint(def.ident) + " = " + pprint(def.val);
}

function pprintIf(ifexp) {
  return ("(if " + pprint(ifexp.condition) +
         " then " + pprint(ifexp.thenexp) +
         " else " + pprint(ifexp.elseexp) + ")");
}

function pprintDefType(stx) {
  return pprint(stx.lhs) + " = " + pprint(stx.rhs);
}

function pprintTypeFunc(stx) {
  return "(" + stx.name.name + " " + stx.params.map(pprint).join(" ") + ") = " + pprint(stx.type);
}

function pprint(expr) {
  if (expr.exprType === "Name") {
    return expr.val;
  }
  else if (expr.exprType === "Bool") {
    if (expr.val) {
      return "True";
    }
    else {
      return "False";
    }
  }
  else if (expr.exprType === "Integer") {
    return "("+expr.val+")";
  }
  else if (expr.exprType === "Float") {
    return "("+expr.val+")";
  }
  else if (expr.exprType === "String") {
    return '"'+expr.val+'"';
  }
  else if (expr.exprType === "Name") {
    return expr.val;
  }
  else if (expr.exprType === "Application") {
    return pprintApp(expr);
  }
  else if (expr.exprType === "Definition") {
    return pprintDef(expr);
  }
  else if (expr.exprType === "TypeDefinition") {
    return pprintDefType(expr);
  }
  else if (expr.exprType === "TypeFuncDefinition") {
    return pprintTypeFunc(expr);
  }
  else if (expr.exprType === "If") {
    return pprintIf(expr);
  }
  else if (expr.exprType === "Function") {
    return pprintFunc(expr);
  }
  else if (expr.exprType === "Nil") {
    return "[]";
  }
  else if (expr.exprType === "Unary") {
    return "("+expr.op.ident+" "+pprint(expr.val)+")";
  }
  else if (expr.exprType === "Let") {
    return "let {" + expr.pairs.map(
          function (v) {
            return pprint(v);
          }).join(" ; ") + "} in " + pprint(expr.body);
  }
  else if (expr.exprType === "TypeOperator") {
    return "("+expr.val+")";
  }
  else if (expr.exprType === "TypeVar") {
    return "("+expr.name+")";
  }
  else if (expr.exprType === "TypeApplication") {
    return "( " + pprint(expr.expression) + " :: " + pprint(expr.type) + " )";
  }
}

module.exports = {pprint : pprint};
