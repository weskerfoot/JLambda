/* Takes an AST and converts all of the functions into closures.
 * A closure is a triple of:
 *  the bound variables in a function or let
 *  the free variables in a function or let
 *  a function body or let body and bound values
 * The closure has the property that all of the free variables of the function or let
 * are in the environment, or an exception is raised because the variable is not bound
 * in the current environment.
 * A free variable is simply those that are not in the list of formal parameters or bound variables if it is a let
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
var _ = require("underscore");

var notEmpty = _.compose($.not, _.partial(_.equal, []));

function fvs(stx) {
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
      return _.flatten([stx.op.ident, fvs(stx.val)]);
    case "Definition":
      return _.flatten(fvs(stx.val));
    case "Application":
      var vs = _.flatten(fvs(stx.p));
      var f_fvs = _.flatten(fvs(stx.func));
      return _.flatten([vs, f_fvs]);
    case "If":
      if (stx.elseexp) {
        var cond_fvs = fvs(stx.condition);
        var then_fvs = fvs(stx.thenexp);
        var else_fvs = fvs(stx.elseexp);
        return _.flatten([cond_fvs, then_fvs, else_fvs]);
      }
      else {
        return _.flatten([fvs(stx.condition), fvs(stx.thenexp)]);
      }
      break;
    case "Name":
      return [stx.ident];
  }
}

function closure_convert(stx) {
  /* Takes a stx object that is either
   * a lambda
   * a let
   * and returns a closure wrapped around that stx object
   */
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
  var variables, free_variables, bound_vars, stx_type;

  switch (stx.exprType) {
    case "Let":
      bound_vars = stx.pairs.map(
         function (stx) {
           return stx.ident.ident;
         });
      var let_fvs = stx.pairs.map(fvs);
      var body_fvs = fvs(stx.body);
      variables = _.flatten(let_fvs);
      $.extend(variables, _.flatten(body_fvs));
      break;
    case "Function":
      bound_vars = [stx.p.ident,];
      variables = fvs(stx.body);
      break;
  }
  free_variables = _.difference(_.uniq(variables), bound_vars);
  return new rep.Closure(bound_vars, free_variables, stx, []);
}

function closure_convert_all(stx) {
  var closure;
  switch (stx.exprType) {
    case "Let":
      closure = closure_convert(stx);
      closure.body.pairs = closure.body.pairs.map(closure_convert_all);
      closure.body = closure_convert_all(closure.body.body);
      return closure;
    case "Function":
      closure = closure_convert(stx);
      closure.body.body = closure_convert_all(closure.body.body);
      return closure;
    case "Unary":
      stx.val = closure_convert_all(stx.val);
      return stx;
    case "Application":
      stx.func = closure_convert_all(stx.func);
      stx.p = closure_convert_all(stx.p);
      return stx;
    case "If":
      if (stx.elseexp) {
        stx.condition = closure_convert_all(stx.condition);
        stx.thenexp = closure_convert_all(stx.thenexp);
        stx.elseexp = closure_convert_all(stx.elseexp);
        return stx;
      }
      else {
        stx.condition = closure_convert_all(stx.condition);
        stx.thenexp = closure_convert_all(stx.thenexp);
        return stx;
      }
    case "Definition":
      stx.val = closure_convert_all(stx.val);
      return stx;
    default:
      return stx;
  }
}


function test(src) {
  var ast = parser.parse(src)[0];
  console.log(JSON.stringify(closure_convert_all(ast), null, 4));
}

module.export = {
  test : test,
  closureConvert : closure_convert_all
};
