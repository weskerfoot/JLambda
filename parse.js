#! /usr/bin/node

var fs = require("fs");
var typ = require("./representation.js");
var tool = require("./tools.js");
var tokenizer = require("./tokenize.js");
var desugarer = require("./desugar.js");
var pprint = require("./pprint.js");
var error = require("./errors.js");

var print = console.log;

function fst(ts) {
	return ts[ts.length-1];
}

function snd(ts) {
	return ts[ts.length-2];
}

//Checks if the next token is not followed by any of ``checks''
function notFollowedBy(tokens, checks) {
	var nextT = fst(tokens)[0];
	if (checks.some(function (x) {return x === nextT;}))
		return false;
	else
		return true;
}

//returns a function that takes a parameter and
//checks if it is in the array ``props''
function makeChecker(props) {
	return function(x) {
		return x && props.some(function (y) {return y === x;});
	};
}

/*Tries to parse until the prediction ``valid'' fails or the wrong type is parsed
  Collects the results into an array and returns it*/
function parseMany(exprType, valid, tokens) {
  var current = fst(tokens)[0];
	var results = [];
	var parsed;

	if (valid(fst(tokens)[0])) {
		parsed = parse(tokens);
	}
	else {
		throw error.JSyntaxError(fst(tokens)[2], fst(tokens)[3], "Error: unexpected token "+fst(tokens)[0]+" in parseMany");
	}
  results.push(parsed);

	//make sure there are at least 2 tokens to parse
	if (tokens.length > 1 && valid(fst(tokens)[0])) {
		while (valid(snd(tokens)[0])) {
			if (!(valid(fst(tokens)[0])))
        break;
      //print(valid(fst(tokens)[0]), tokens);
      results.push(parse(tokens));
			if (!exprType(fst(results).exprType))
				break;
			current = fst(tokens)[0]
			if (tokens.length <= 1)
				break;
		}
	}
	//do the same validity check as before and in the loop
  if (!fst(tokens))
    throw "Error: unexpected end of source";
	if (valid(fst(tokens)[0]))
		results.push(parse(tokens));
	return results;
}


/* Tries to parse exprType separated by the token between
 * e.g. <identifier>,<identifier>,...
 */
function parseBetween(exprType, between, tokens) {
  var first = parse(tokens);
  if (!exprType(first)) {
    throw "Error, unexpected token:"+fst(tokens)[0];
  }
  var items = [first];
  var parsed;
  if (tokens.length > 1 && fst(tokens)[0] === between) {
    while (fst(tokens)[0] === between) {
      tokens.pop();
      parsed = parse(tokens);
      items.push(parsed);
    }
    return items;
  }
  return items;
}

function parseList(tokens) {
  if (fst(tokens)[0] === "right_square") {
      var xs = [];
  }
  else if (fst(tokens)[0] === "comma") {
    tokens.pop();
    var xs = [];
  }
  else {
    var xs = parseBetween(function (x) { return true; }, "comma", tokens);
  }
  if (fst(tokens)[0] !== "right_square") {
    throw error.JSyntaxError(fst(tokens)[3], fst(tokens)[2], "Error, list must be terminated by ]");
  }
  tokens.pop();
  return new typ.ListT(xs);
}


function parseDefFunction(tokens) {
	var fname = parse(tokens);
  if (fname.exprType != "Name") {
    throw error.JSyntaxError(fst(tokens)[3], fst(tokens)[2], "Error, expected an identifier in function definition");
  }
  if (fst(tokens)[0] === "right_paren") {
    var parameters = [];
  }
  else {
    var parameters = parseMany(validName, validFormPar, tokens);
  }
  if ((fst(tokens)[0]) !== "right_paren") {
    throw "Error, formal parameters must be followed by )";
  }
  tokens.pop();
  var body = parse(tokens);
  return new typ.DefFunc(fname, parameters, body);
}



function parseDef(tokens) {
  if (fst(tokens)[0] === "left_paren") {
    // It's a function definition
    tokens.pop();
    return parseDefFunction(tokens);
  }
	if (notFollowedBy(tokens, ["identifier"])) {
		throw "Error: def must be followed by identifier, not "+fst(tokens)[0];
	}
	else {
    var identifier = parse(tokens);
    if (!notFollowedBy(tokens, ["def", "comma", "arrow", "right_brace", "right_square"])) {
      throw "Error: def " + identifier.val + " must not be followed by " + fst(tokens)[0];
    }
		return new typ.Def(identifier, parse(tokens));
	}
 }


function parseIf(tokens) {
	if (!notFollowedBy(tokens, ["def","comma","lambda"])) {
		throw "Error: ``if'' cannot be followed by "+fst(tokens)[0];
	}
	else {
		var ifC = parse(tokens);
		if (!fst(tokens) || fst(tokens)[0] !== "thenexp")
			throw "Error: if <exp> must be folowed by <then> exp, not "+snd(tokens)[0];
		else {
			tokens.pop();
			var thenC = parse(tokens);

			if (fst(tokens) && fst(tokens)[0] === "elsexp") {
				tokens.pop();
				var elseC = parse(tokens);
				return new typ.If(ifC, thenC, elseC);

			}
			else {
				return new typ.If(ifC, thenC);
			}
		}
	}
}


var validFormPar = makeChecker(["identifier"]);
var validName = makeChecker(["Name"]);

function parseLambda(tokens) {
	var parameters = parseMany(validName,validFormPar, tokens);

	if (fst(tokens)[0] !== "arrow") {
		throw "Error: arrow must follow parameters in lambda, not "+fst(tokens)[0];
	}
	tokens.pop()
	var body = parse(tokens);
	return new typ.FuncT(parameters, body);
}

//function parseLet(tokens) {


var invalidArguments = ["def", "comma", "right_paren", "right_square", "right_brace", "left_brace", "right_brace"];
var validArgument = tool.compose(tool.not, makeChecker(invalidArguments));
var validArgTypes = tool.compose(tool.not, makeChecker(["Definition"]));
var validOperator = makeChecker(["identifier"]);

//Parses function application (either infix or prefix)
function computeApp(tokens) {
  var lhs = parse(tokens);
	if (fst(tokens))
		var next = fst(tokens);
	else {
		throw "Error: Unexpected end of source";
	}
	if (typ.OPInfo[next[1]]) {
		//it's an infix expression
		var result = parseInfix(tokens, 1, lhs);
		if (fst(tokens)[0] !== "right_paren") {
			throw "Error: mismatched parentheses";
		}
		else {
			//return the result
      tokens.pop();
			return result;
		}
	}
	else {
		//it's a prefix application

		var parameters = parseMany(validArgTypes, validArgument, tokens);
		if (fst(tokens)[0] !== "right_paren") {
			throw "Error: mismatched parentheses";
		}
		else {
			//return the result
      tokens.pop();
			return typ.makeApp(lhs, parameters);
		}
	}
}

/*Parses infix expressions by precedence climbing
  See this for more info and an implementation in python
  http://eli.thegreenplace.net/2012/08/02/parsing-expressions-by-precedence-climbing/
*/
function parseInfix(tokens, minPrec, lhs) {
	if (!lhs) {
		var lhs = parse(tokens);
	}
	while (true) {
		var cur = fst(tokens);
		if (!cur) {
			throw "Error: Unexpected end of source";
		}
		var opinfo = typ.OPInfo[cur[1]];

		if (!opinfo || opinfo[0] < minPrec)
			break;

		var op = new typ.Name(cur[1]);
		var prec = opinfo[0];
		var assoc = opinfo[1];
		var nextMinPrec = assoc === "Left" ? prec + 1 : prec;
		tokens.pop();
		//remove the operator token
		var rhs = parseInfix(tokens, nextMinPrec);
		lhs = typ.makeApp(op, [lhs, rhs]);
	}
	return lhs;
}

function parse(tokens) {
	if (fst(tokens))
		var toktype = fst(tokens)[0];
	else {
		process.exit(code=1);
	}
	var token = fst(tokens)[1];
	tokens.pop();
	if (toktype === "stringlit")
		return new typ.StrT(token);
  else if (toktype === "left_square")
    return parseList(tokens);
	else if (toktype === "lambda")
		return parseLambda(tokens);
	else if (toktype === "integer")
		return new typ.IntT(token);
	else if (toktype === "float")
		return new typ.FloatT(token);
	else if (toktype === "identifier")
		return new typ.Name(token);
	else if (toktype === "truelit" || toktype === "falselit")
		return new typ.BoolT(token);
	else if (toktype === "def")
		return parseDef(tokens);
	else if (toktype === "ifexp")
		return parseIf(tokens);
	else if (toktype === "left_paren") {
		if (fst(tokens)[0] === "lambda") {
      tokens.pop();
      var parsed = parseLambda(tokens);
      tokens.pop();
      return parsed;
    }
    else
      return computeApp(tokens);
  }
//  else if (toktype === "let") {
//    return parseLet(tokens);
//  }
  else {
    throw "Error: Unexpected token: " + toktype;
  }
}

var istr = fs.readFileSync('/dev/stdin').toString();
function parseFull(tokenized) {
  var ast = new Array();
  try {
    while (tokenized.length > 0) {
      var parsed = desugarer.desugar(parse(tokenized));
      ast.push(parsed);
    }
    return ast;
  } catch (e) {
      e.stxerror();
      process.exit(1);
  }
}
console.log(parseFull(tokenizer.tokenize(istr)).map(pprint.pprint).join("\n"));

//console.log(tokenizer.tokenize(istr));
//console.log(parseFull(tokenizer.tokenize(istr))[8].val.body);

//module.exports = {parse : tool.compose(parseFull, tokenizer.tokenize) };
