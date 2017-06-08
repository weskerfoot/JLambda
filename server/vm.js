var typ = require("./representation.js");
var parse = require("./parse.js");
var tokenizer = require("./tokenize.js");
var pprint = require("./pprint.js");
var env = require("./environments.js");

var testenv = env.makeEnv("toplevel",
                      [
                       ["+", function(a) { return function(b) { return a + b; } }],
                       ["*", function(a) { return function(b) { return a * b; } }],
                       ["-", function(a) { return function(b) { return a - b; } }],
                       ["/", function(a) { return function(b) { return a / b; } }],
                       ["a", 2],
                       ["b", 3]]);

function lookup(ident, env) {
  var func = evaluate(env.bindings[ident], env);
  return func;
}

function evaluateString(input) {
  var ast = parse.parseFull(tokenizer.tokenize(input));
  return evaluate(ast.ast[ast.ast.length-1], testenv);
}

function apply(func, p) {
  return func(evaluate(p));
}

function evaluateAll(ast, environment) {
  var l = ast.length;
  var evaled = [];
  for (var i = 0; i < l; i++) {
    // should look for closures?
    evaled.push(evaluate(ast[i], environment));
  }
  return evaled;
}

function evaluate(ast, environment) {
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
    return; /* XXX */
  }
  else if (ast.exprType === "Integer" || ast.exprType == "Float") {
    return ast.val;
  }
  else {
    return ast;
  }
}

module.exports = {
  evaluate : evaluateString
};
