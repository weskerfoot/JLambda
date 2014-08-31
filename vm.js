#! /usr/bin/node

var typ = require("./representation.js");
var parse = require("./parse.js");
var tokenizer = require("./tokenize.js");
var pprint = require("./pprint.js");


//var istr = fs.readFileSync('/dev/stdin').toString();
var istr = "lambda a b -> (a + b)";
var ast = parse.parseFull(tokenizer.tokenize(istr));


function evaluate(ast, environment) {
  var l = ast.length;
  for (var i = 0; i < l; i++) {
    if (ast[i].exprType == "Function") {
      console.log(ast[i]);
    }
  }
}

evaluate(ast[0], false);

