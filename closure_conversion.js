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
 * the current environment gets $.extended with the formal parameters of the function.
 * When a let is encountered the current environment also gets $.extended.
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
var $ = require("./tools.js");

var notEmpty = $.compose($.not, $.eq([]));

function fvs_helper(stx) {
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
    case "Bool":
      return [];
    case "Let":
      return [];
    case "Unary":
      return $.flatten([stx.op.ident, fvs_helper(stx.val)]);
    case "Definition":
      return $.flatten(fvs_helper(stx.val));
    case "Application":
      var vs = $.flatten(fvs_helper(stx.p));
      var f_fvs = $.flatten(fvs_helper(stx.func));
      return $.flatten([vs, f_fvs]);
    case "If":
      if (stx.elseexp) {
        var cond_fvs = fvs_helper(stx.condition);
        var then_fvs = fvs_helper(stx.thenexp);
        var else_fvs = fvs_helper(stx.elseexp);
        return $.flatten([cond_fvs, then_fvs, else_fvs]);
      }
      else {
        return $.flatten([fvs_helper(stx.condition), fvs_helper(stx.thenexp)]);
      }
      break;
    case "Name":
      return stx.ident;
  }
}

function fvs(stx) {
  if (stx.exprType !== "Function" &&
      stx.exprType !== "Let") {
    throw errors.JInternalError(
           ["Tried to calculate the free variables of",
           "something that was not a function or let.\n",
           "That something was a: " + stx.exprType +"\n"].reduce(
                function (a,b) {
                  return a+" "+b;
                }, ""));
  }
  var variables, free_variables;

  switch (stx.exprType) {
    case "Let":
      var bound_vars = stx.pairs.map(
         function (stx) {
           return stx.ident.ident;
         });
      var let_fvs = stx.pairs.map(fvs_helper);
      var body_fvs = fvs_helper(stx.body);
      variables = $.flatten(let_fvs);
      $.extend(variables, $.flatten(body_fvs));
      free_variables = $.difference($.unique($.flatten(variables)), bound_vars);
      break;
    case "Function":


  }
}

//var ast = parser.parse("let { c = trtr a = let {tttt = (rtertret^yyyy) } let { dfsdf = let { asdsd = 3434 } gdfgdfg } (45+(asdddy*uyuy))  q = ((lambda x y -> (x+y)) 4 ui) } (^ wat (a+(ar*b*c^twerp+\"sdfdsfsdfsdfsdf\")*rt))")[0];
//var ast = parser.parse("let { a = let { b = let {dsdfgf = sddd } fdgfg } gggggg } t")[0];
//console.log(pprint.pprint(ast));
//var ast = parser.parse("let { a = 12 b = (a + t) } (a + b * d)")[0];
//console.log(fvs(ast));
//var ast = parser.parse("((lambda a b c -> (+ a b c)) 2 3.0 4)");
var ast = parser.parse("def (f a b c) 12")[0];
//console.log(JSON.stringify(ast, null, 4));
console.log(pprint.pprint(ast));
