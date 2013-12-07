#!  /usr/bin/node

var fs = require("fs");
var rep = require("./representation.js");
var tools = require("./tools.js");
var operators = Object.keys(rep.OPInfo);

var matchop = tools.opMatch(operators);

function isDigit(a) {
  if (!a)
    return false;
  var code = a.charCodeAt();
  return (46 < code && code < 58 || code < 58 && code > 46);
}

function isWhitespace(a) {
  if (!a)
    return true;

  var code = a.charCodeAt();
  return (code === 9 || code === 32 || code === 10 || code === 13 || code === 11);
}

function isIdentifier(a) {
  var code = a.charCodeAt();
  return code !== 41 && code !== 40 && code && 125 && code && 123 && code !== 93 && code !== 91 && code !== 44;
}

function tokenizeNum(tokstream) {
  var number = [];
  var code = tokstream[0].charCodeAt();
  var isFloat = false;
  var n = 0;
  // + -
  if (code === 43 || code === 45) {
    number.push(tokstream[0]);
    tokstream = tokstream.substr(1);
    n++;
  }
  else if (code === 46) {
    tokstream = tokstream.substr(1);
    n++;
    number.push('0');
    number.push('.');
    isFloat = true;
  }

  while (isDigit(tokstream[0]) && tokstream.length !== 0) {
    number.push(tokstream[0]);
    tokstream = tokstream.substr(1);
    n++;
  }
  if (tokstream[0] === '.' && isDigit(tokstream[1])) {
    number.push('.');
    number.push(tokstream[1]);
    tokstream = tokstream.substr(2);
    n++; n++;
    while (isDigit(tokstream[0]) && tokstream.length !== 0) {
      number.push(tokstream[0]);
      tokstream = tokstream.substr(1);
      n++;
    }
    return [n, ["float", parseFloat(number.join(''), 10)]];
  }
  if (!isFloat)
    return [n, ["integer", parseInt(number.join(''), 10)]];
  else
    return [n, ["float", parseFloat(number.join(''), 10)]];
}

/* Split up the tokenized identifier if an operator appears in it
 * prefer longer identifiers that start with the same character(s) as shorter ones
 * e.g. ++ over +
 * Everything after the operator goes back on to the token stream
 */

function tokenizeIdent(tokstream) {
  var identifier = [];
  var n = 0;
  while ((!isWhitespace(tokstream[0])) && isIdentifier(tokstream[0]) && !matchop(tokstream)) {
    identifier.push(tokstream[0]);
    tokstream = tokstream.substr(1);
    n++;
  }
  identifier = identifier.join('');

  return [[n, ["identifier", identifier]]];
}

function tokenizeStr(tokstream) {
  var stringlit = [];
  var n = 1;
  tokstream = tokstream.substr(1);
  while (tokstream[0].charCodeAt() !== 34) {
    stringlit.push(tokstream[0]);
    tokstream = tokstream.substr(1);
    n++;
    if (tokstream.length < 1) {
      console.log("Error: missing quotation mark");
      process.exit(code=1);
    }
  }
  n++;
  return [n, ["stringlit", stringlit.join('')]];

}

function tokenizeT(tokstream) {
  if (tokstream.length < 4)
    return false;
  var next4 = tokstream.substr(0,4);
  if (next4 === "then")
    return ["thenexp", "then"];
  else if (next4 === "true")
    return ["truelit", "true"];
  return false;
}

function peek(tokstream, toktype, word) {
  var n = word.length;
  if (tokstream.length < n)
    return false;
  var nextN = tokstream.substr(0, n);
  if (nextN == word)
    return [toktype, word];
  return false;
}

function tokenize(tokstream) {
  var tokens = [];

  while (tokstream) {
    switch (tokstream[0].charCodeAt()) {
      case 9: // '\t'
        tokens.push(["whitespace", '\t']);
        tokstream = tokstream.substr(1);
        break;
      case 32: // ' '
        tokens.push(["whitespace", ' ']);
        tokstream = tokstream.substr(1);
        break;
      case 10: // '\n'
        tokens.push(["whitespace", '\n']);
        tokstream = tokstream.substr(1);
        break;
      case 44: // ','
        tokens.push(["comma", ","]);
        tokstream = tokstream.substr(1);
        break;
      case 40: // '('
        tokens.push(["left_paren", '(']);
        tokstream = tokstream.substr(1);
        break;
      case 41: // ')'
        tokens.push(["right_paren", ')']);
        tokstream = tokstream.substr(1);
        break;
      case 123: // '{'
        tokens.push(["left_brace", '{']);
        tokstream = tokstream.substr(1);
        break;
      case 125: // '}'
        tokens.push(["right_brace", '}']);
        tokstream = tokstream.substr(1);
        break;
      case 91: // '['
        tokens.push(["left_square", '[']);
        tokstream = tokstream.substr(1);
        break;
      case 93: // ']'
        tokens.push(["right_square", ']']);
        tokstream = tokstream.substr(1);
        break;
      case 34: // '"'
        var result = tokenizeStr(tokstream);
        var str = result[1];
        var i = result[0];
        tokens.push(str);
        tokstream = tokstream.substr(i);
        break;

      case 43: // '+'
        if (isDigit(tokstream[1])) {
          var result = tokenizeNum(tokstream);
          var num = result[1];
          var i = result[0];
          if (num[1] !== NaN)
            tokens.push(num);
          tokstream = tokstream.substr(i);
          break;
        }
      case 45: // '-'
        var lambda = peek(tokstream, "arrow", "->");
        if (lambda) {
          tokens.push(lambda);
          tokstream = tokstream.substr(2);
          break;
        }
        if (isDigit(tokstream[1])) {
          var result = tokenizeNum(tokstream);
          var num = result[1];
          var i = result[0];
          if (num[1] !== NaN)
            tokens.push(num);
          tokstream = tokstream.substr(i);
          break;
        }
      case 46: // '.'
        if (isDigit(tokstream[1])) {
          var result = tokenizeNum(tokstream);
          var num = result[1];
          var i = result[0];
          if (num[1] !== NaN)
            tokens.push(num);
          tokstream = tokstream.substr(i);
          break;
        }
      case 116: // 't'
        var result = tokenizeT(tokstream);
        if (result) {
          tokens.push(result);
          tokstream = tokstream.substr(4); // 4 = length of either token
          break;
        }

      case 105: // 'i'
        var result = peek(tokstream, "ifexp", "if");
        if (result) {
          tokens.push(result);
          tokstream = tokstream.substr(2);
          break;
        }

      case 100: // 'd'
        var result = peek(tokstream, "def", "def");
        if (result) {
          tokens.push(result);
          tokstream = tokstream.substr(3);
          break;
        }
      case 101: // e
        var result = peek(tokstream, "elsexp", "else");
        if (result) {
          tokens.push(result);
          tokstream = tokstream.substr(4);
          break;
        }
      case 102: // f
        var result = peek(tokstream, "falselit", "false");
        if (result) {
          tokens.push(result);
          tokstream = tokstream.substr(5);
          break;
        }
      case 108: // l
        var result = peek(tokstream, "lambda", "lambda");
        if (result) {
          tokens.push(result);
          tokstream = tokstream.substr(6);
          break;
        }

      default:
        if (isDigit(tokstream[0])) {
          var result = tokenizeNum(tokstream);
          var num = result[1];
          var i = result[0];
          if (num[1] !== NaN)
            tokens.push(num);
          tokstream = tokstream.substr(i);
          break;
        }
        var op = matchop(tokstream);
        if (op) {
          var l = op.length;
          tokstream = tokstream.substr(l);
          tokens.push(["identifier", op]);
        }
        else {
          var result = tokenizeIdent(tokstream);
          result.map(function(x) {
            tokens.push(x[1]);
            tokstream = tokstream.substr(x[0]);
          });
        }
    }
  }
  return tokens;
}

function tokenizeFull(input) {
  return tokenize(input).reverse().filter(function(x) {
    return x[0] !== "whitespace";
  });
}


module.exports = {tokenize : tokenizeFull};

//var tokstream = fs.readFileSync("/dev/stdin").toString();
//console.log(tokenize(tokstream));
//console.log(tools.buildTrie('', operators)[1][6]);
//console.log(isIdentifier(')'));
//console.log(tools.maxBy(tools.len, operators.filter(function (x) { return "#".indexOf(x) != -1;})));
//console.log(tokenizeIdent("abc%%3"));


