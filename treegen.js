#!  /usr/bin/node

var parser = require("./parse.js");
var pprint = require("./pprint.js");
var repr = require("./representation.js");
var lex = require("./tokenize.js");

var qc = require("quickcheck");

function arbIdentifier() {
    var st = qc.arbString()
    if (lex.isIdentifier(st)) {
      return new repr.Name(st);
    }
    else {
      return arbIdentifier();
    }
}

console.log(arbIdentifier());
