#! /usr/bin/node

var typ = require("./representation.js");
var parse = require("./parse.js");
var tokenizer = require("./tokenize.js");
var pprint = require("./pprint.js");


//var istr = fs.readFileSync('/dev/stdin').toString();
var istr = "(a + b)";
var ast = parse.parseFull(tokenizer.tokenize(istr));

function apply(func, p, environment) {
  var full_func = evaluate(func, environment);
  return [full_func, evaluate(p, environment)];
}

function evaluateAll(ast, environment) {
  var l = ast.length;
  var evaled = [];
  for (var i = 0; i < l; i++) {
    evaled.push(evaluate(ast[i], environment));
  }
  return evaled;
}

function evaluate(ast, environment) {
  if (ast.exprType == "Application") {
    return apply(ast.func, ast.p, environment);
  }
  else if (ast.exprType === "Unary") { /* Unary function application */
    return apply(ast.op, ast.val, environment);
  }
  else if (ast.exprType === "Name") {
    return ast.ident;
  }
  else {
    return ast.val;
  }
}
console.log("%j", evaluateAll(ast[0], false));

