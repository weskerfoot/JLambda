/* Takes an AST and converts all of the functions into closures.
 * A closure is a triple of:
 *  a mapping from names to expressions
 *  a mapping from names to type expressions
 *  a function (which includes the formal parameters and the body)
 * The closure has the property that all of the free variables of the function
 * are in the environment, or an exception is raised because the variable is not bound
 * in the current environment.
 * A free variable is simply those that are not in the list of formal parameters.
 * We start with the global environment and traverse the AST. Every time a new function is entered
 * the current environment gets extended with the formal parameters of the function.
 * When a let is encountered the current environment also gets extended.
 * The algorithm continues for any further function definitions in that branch
 * otherwise it just stops for that particular branch and continues with the rest of the AST
 *
 * Therefore in order to call a closure one must first extract the actual function and then
 * call the function with the environment associated with it.
 * For the purposes of type checking it does not matter how the function gets called, the environment
 * is only used for looking up the types of names. Formal parameters are given type variables.
 */

var rep = require("./representation.js");
var env = require("./environments.js");
var errors = require("./errors.js");
var parser = require("./parse.js");
var pprint = require("./pprint.js");
var tool = require("./tools.js");

/*function convert(stx, cur_types, cur_exprs) {
  switch (stx.exprType) {
    case "If":
    case "Definition":
    case "Name":
    case "Application":
    case "Function":
    case "Let":
    default:
      return stx;
  }
}*/

function fvs(stx) {
  /*if (stx.exprType !== "Function" &&
      stx.exprType !== "Let") {
    throw errors.JInternalError(
           ["Tried to calculate the free variables of",
           "something that was not a function or let.\n",
           "That something was a: " + stx.exprType +"\n"].reduce(
                function (a,b) {
                  return a+" "+b
                }, ""));
  }*/

  switch (stx.exprType) {
    case "Integer":
      return [];
    case "Float":
      return [];
    case "String":
      return [];
    case "Function":
      return [];
    case "Nil":
      return [];
    case "List":
      return [];
    case "Bool":
      return [];
    case "FunctionDefinition":
      return [];
    case "Let":
      return stx.pairs.map(fvs);
    case "Unary":
      return fvs(stx.val);
    case "Definition":
      return [fvs(stx.val)];
    case "Application":
      var vs = fvs(stx.p);
      var f_fvs = fvs(stx.func);
      return [].concat.apply([], [vs, f_fvs]);
    case "If":
      if (stx.elseexp) {
        var cond_fvs = fvs(stx.condition);
        var then_fvs = fvs(stx.thenexp);
        var else_fvs = fvs(stx.elseexp);
        return [cond_fvs, then_fvs, else_fvs];
      }
      else {
        return [fvs(stx.condition)] + [fvs(stx.thenexp)];
      }
    case "Name":
      return stx.ident;
  }
}

var ast = parser.parse("(^ wat (a+(ar*b*c^twerp+\"sdfdsfsdfsdfsdf\")*rt))")[0];
console.log(pprint.pprint(ast));
console.log(tool.unique(fvs(ast)));
//console.log(ast);
