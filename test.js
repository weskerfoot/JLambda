#!  /usr/bin/node

var p = require("./parse.js");
var pp = require("./pprint.js");
var tools = require("./tools.js");
var parse = tools.compose(pp.pprint, p.parse);
//console.log(parse("((map g [1,2,3]) >> (print 34))"));
//p.parse("((f [1,2,3,4,5]) >> (* 2 3))");
//p.parse("[1] 45");
//p.parse("(+ 2 3 4)");
