import typ from "./representation.js";
import parse from "./parse.js";
import tokenizer from "./tokenize.js";
import pprint from "./pprint.js";
import env from "./environments.js";

function cons(x) {
  return function(xs) {
    if (xs.exprType == "Nil") {
      return [x];
    }
    xs.unshift(x);
    return xs;
  };
}

var testenv = env.makeEnv("toplevel",
                      [
                       ["len", function(xs) { return xs.length; }],
                       ["+", function(a) { return function(b) { return a + b; } }],
                       ["*", function(a) { return function(b) { return a * b; } }],
                       ["-", function(a) { return function(b) { return a - b; } }],
                       ["/", function(a) { return function(b) { return a / b; } }],
                       [":", cons],
                       ["a", 2],
                       ["b", 3]]);

function lookup(ident, env) {
  console.log(`trying to look up ${ident}`);
  var value = env.bindings[ident];
  console.log(value);
  if (value.exprType !== undefined) {
    console.log("evaluting further");
    return evaluate(value, env);
  }
  console.log("returning it without evaluting");
  return value;
}

function evaluateString(input) {
  var ast = parse.parseFull(tokenizer.tokenize(input));
  console.log(ast.ast[ast.ast.length-1]);
  return evaluateAll(ast.ast, testenv);
}

function apply(func, p) {
  return func(p);
}

function evaluateAll(ast, environment) {
  var l = ast.length;
  var evaled = [];
  for (var i = 0; i < l; i++) {
    // should look for closures?
    evaled.push(evaluate(ast[i], environment));
  }
  return evaled[evaled.length-1];
}

function evaluateClosure(ast) {
  var bound_vars = ast.bound_vars;
  var found = ast.env
}

function extend(def, env) {
  env.bindings[def.ident.val] = evaluate(def.val, env);
  return;
}

function evaluate(ast, environment) {
  console.log("here");
  console.log(JSON.stringify(ast));
  if (ast.exprType == "Application") {
    var func = evaluate(ast.func, environment);
    return apply(
              func,
              evaluate(ast.p, environment));
  }
  else if (ast.exprType === "Unary") {
    /* Unary function application */
    var func = evaluate(ast.op, environment);
    return apply(
              func,
              evaluate(ast.val, environment));
  }
  else if (ast.exprType === "Name") {
    return lookup(ast.ident, environment);
  }
  else if (ast.exprType === "If") {
    if (evaluate(ast.condition, environment)) {
      return evaluate(ast.thenexp, environment);
    }
    else {
      return evaluate(ast.elseexp, environment);
    }
  }
  else if (ast.exprType === "Definition") {
    extend(ast, environment);
    return ast;
  }
  else if (ast.exprType === "Integer" || ast.exprType === "Float" || ast.exprType === "String") {
    return ast.val;
  }
  else if (ast.exprType === "Closure") {
    /* return evaluateClosure(ast); */
    return ast;
  }
  else {
    return ast;
  }
}

export default {
  evaluateString : evaluateString
};
