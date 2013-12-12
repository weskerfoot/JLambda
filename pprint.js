function pprintName(ident) {
  return pprint(ident.val);
}

function pprintFunc(func) {
  if (func.p.exprType === "Name")
    return "(\\ " + pprint(func.p) + " -> " + pprint(func.body) + ")";
  else
    return "(\\ " + func.p.map(pprint).join(" ") + " -> " + pprint(func.body) + ")";

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
  if (ifexp.elseexp)
    return "(if " + pprint(ifexp.condition) + " then " + pprint(ifexp.thenexp) + " else " + pprint(ifexp.elseexp) + ")";
  else
    return "(if " + pprint(ifexp.condition) + " then " + pprint(ifexp.thenexp) + ")";
}

function pprint(expr) {
  if (expr.exprType === "Name")
    return expr.val;
  else if (expr.exprType === "Bool")
    if (expr.val)
      return "True";
    else
      return "False";
  else if (expr.exprType === "Integer")
    return "("+expr.val+")";
  else if (expr.exprType === "Float")
    return "("+expr.val+")";
  else if (expr.exprType === "String")
    return '"'+expr.val+'"';
  else if (expr.exprType === "Name")
    return expr.val;
  else if (expr.exprType === "Application")
    return pprintApp(expr);
  else if (expr.exprType === "Definition")
    return pprintDef(expr);
  else if (expr.exprType === "If")
    return pprintIf(expr);
  else if (expr.exprType === "Function")
    return pprintFunc(expr);
  else if (expr.exprType === "Nil")
    return "[]";
  else if (expr.exprType === "Unary")
    return "("+expr.op.ident+" "+pprint(expr.val)+")";
}

module.exports = {pprint : pprint};
