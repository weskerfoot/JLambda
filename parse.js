var typ = require("./representation.js");
var tool = require("./tools.js");

// Tokenization

var left_paren = /^\(/;
var right_paren = /^\)/;

var left_brace = /^\{/;
var right_brace = /^\}/;

var def = /^def/;

var left_square = /^\[/;
var right_square = /^\]/;
var comma = /^,/;

var truelit = /^true/;
var falselit = /^false/;

var stringlit = /^\"[^\"]*\"/;	

var number = /^(\+|-)?\d+(\.\d+)?/;

var ifexp = /^if/;
var thenexp = /^then/;
var elsexp = /^else/;

var identifier = /^[^\s\.\(\)\{\}\[\]\""]+/;

var lambda = /^lambda/;

var arrow = /^->/;

function tokmatch(t) {
	var ttype;
	var m;
	if (m = t.match(left_paren))
		ttype = "left_paren";
	else if (m = t.match(right_paren))
		ttype = "right_paren";
	else if (m = t.match(left_brace))
		ttype = "left_brace";
	else if (m = t.match(right_brace))
		ttype = "right_brace";
	else if (m = t.match(left_square))
		ttype = "left_square";
	else if (m = t.match(right_square))
		ttype = "right_square";
	else if (m = t.match(def))
		ttype = "def";
	else if (m = t.match(lambda))
		ttype = "lambda";
	else if (m = t.match(arrow))
		ttype = "arrow";
	else if (m = t.match(comma))
		ttype = "comma";
	else if (m = t.match(truelit))
		ttype = "truelit";
	else if (m = t.match(falselit))
		ttype = "falselit";
	else if (m = t.match(stringlit))
		ttype = "stringlit";
	else if (m = t.match(number))
		if (m[0].indexOf(".") !== -1) {
			ttype = "float";
			return [[ttype, m[0]], m.input.slice(m[0].length)];
		}
		else {
			ttype = "integer";
			return [[ttype, m[0]], m.input.slice(m[0].length)];
		}
	else if (m = t.match(ifexp))
		ttype = "ifexp";
	else if (m = t.match(thenexp))
		ttype = "thenexp";
	else if (m = t.match(elsexp))
		ttype = "elsexp";
	else if (m = t.match(identifier))
		ttype = "identifier";
	else {
		console.log("Error: unmatched string: " + t);
		return;
	}
	return [[ttype, m[0]], m.input.slice(m[0].length)];
}

function tokenize(exp) {
	var current, next;
	var tokens = [];
	while (exp != '') {
		if (exp[0].match(/\s/)) {
			exp = exp.slice(1);
			// skip whitespace
		}
		else {
			current = tokmatch(exp);
			if (!current)
				break;
			exp = current[1];
			tokens.push(current[0]);
		}
	}
	return tokens;
}

function fst(ts) {
	return ts[ts.length-1];
}

function snd(ts) {
	return ts[ts.length-2];
}

//Checks if the next token is not followed by any of ``checks''
function notFollowedBy(tokens, checks) {
	var nextT = fst(tokens)[0];
	if (!snd(tokens))
		console.log("Error: "+ fst(tokens)[0] +" must be followed by something");
	else if (checks.some(function (x) {return x === nextT;}))
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
		//console.log(parsed.exprType);
	}
	else {
		console.log("Error: unexpected token "+fst(tokens));
		return;
	}
	results.push(parsed);

	//make sure there are at least 2 tokens to parse
	if (tokens.length > 1 && valid(fst(tokens)[0])) {
		while (valid(snd(tokens)[0])) {
			results.push(parse(tokens));
			//console.log(results);
			if (!exprType(fst(results).exprType))
				break;
			//console.log(results);
			current = fst(tokens)[0]
			if (tokens.length <= 1)
				break;
		}
	}
	//do the same validity check as before and in the loop
	if (valid(fst(tokens)[0]))
		results.push(parse(tokens));
	return results;
}

function parseDef(tokens) {
	if (notFollowedBy(tokens, ["identifier"])) {
		console.log("Error: def must be followed by identifier, not "+fst(tokens)[0]);
		return undefined;
	}
	else {
		return new typ.Def(parse(tokens), parse(tokens));
	}
 }


function parseIf(tokens) {
	if (!notFollowedBy(tokens, ["def","comma","lambda"])) {
		console.log("Error: ``if'' cannot be followed by "+fst(tokens)[0])
		return;
	}
	else {
		var ifC = parse(tokens);
		if (!fst(tokens) || fst(tokens)[0] !== "thenexp")
			console.log("Error: if <exp> must be folowed by <then> exp, not "+snd(tokens)[0]);
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
		console.log("Error: arrow must follow parameters in lambda, not "+fst(tokens)[0])
		return;
	}
	tokens.pop()
	var body = parse(tokens);
	return new typ.FuncT(parameters, body);
}

var invalidArguments = ["def", "comma", "right_paren", "right_square", "right_brace", "left_brace", "right_brace"];
var validArgument = tool.compose(tool.not, makeChecker(invalidArguments));
var validArgTypes = tool.compose(tool.not, makeChecker(["Definition"]));
var validOperator = makeChecker(["identifier"]);

function parse(tokens) {
	if (fst(tokens))
		var toktype = fst(tokens)[0];
	else {
		console.log("Unexpected end of source")
		process.exit(code=1);
	}
	var token = fst(tokens)[1];
	tokens.pop();
	if (toktype === "stringlit")
		return new typ.StrT(token);
	else if (toktype === "lambda")
		return checkParse(parseLambda(tokens));
	else if (toktype === "integer")
		return new typ.IntT(token);
	else if (toktype === "float")
		return new typ.FloatT(token);
	else if (toktype === "identifier")
		return new typ.Name(token);
	else if (toktype === "truelit" || toktype === "falselit")
		return new typ.BoolT(token);
	else if (toktype === "def")
		return checkParse(parseDef(tokens));
	else if (toktype === "ifexp")
		return checkParse(parseIf(tokens));
	else if (toktype === "left_paren")
		return computeApp(tokens);
}

function checkParse(p) {
	if (p === undefined) {
		console.log("Quitting, could not finish parsing!");
		process.exit(code=1);
	}
	else
		return p;
}

//Parses function application (either infix or prefix)
function computeApp(tokens) {
	var lhs = parse(tokens);
	if (fst(tokens))
		var next = fst(tokens);
	else {
		console.log("Unexpected end of source");
		process.exit(code=1);
	}
	if (typ.OPInfo[next[1]]) {
		//it's an infix expression
		var result = parseInfix(tokens, 1, lhs);
		if (fst(tokens)[0] !== "right_paren") {
			console.log("Error: mismatched parentheses");
			process.exit(code=1);
		}
		else {
			//return the result
			return result;
		}
	}
	else {
		//it's a prefix application
		var parameters = parseMany(validArgTypes, validArgument, tokens);
		if (fst(tokens)[0] !== "right_paren") {
			console.log("Error: mismatched parentheses");
			process.exit(code=1);
		}
		else {
			//return the result
			return typ.makeApp(lhs, parameters);
		}
	}
}

//Parses infix expressions by precedence climbing
function parseInfix(tokens, minPrec, lhs) {
	if (!lhs) {
		var lhs = parse(tokens);
	}
	while (true) {
		var cur = fst(tokens);
		if (!cur) {
			console.log("Unexpected end of source")
			process.exit(code=1);
		}
		var opinfo = typ.OPInfo[cur[1]];

		if (!opinfo || opinfo[0] < minPrec)
			break;

		var op = cur[1];
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


var input = process.argv.slice(2).reduce(function(acc, x) {return acc + " " + x}, "");
var wat = tokenize(input).reverse();
//console.log(tool.pprint(parse(wat)));
console.log(parse(wat));
//console.log(wat);
//parse(wat);