#!  /usr/bin/node

var fs = require("fs");

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

function tokenizeNum() {
  var number = [];
  var code = tokstream[0].charCodeAt();
  var isFloat = false;
  // + -

  if (code === 43 || code === 45) {
    number.push(tokstream[0]);
    tokstream = tokstream.substr(1);
  }
  else if (code === 46) {
    tokstream = tokstream.substr(1);
    number.push('0');
    number.push('.');
    isFloat = true;
  }

  while (isDigit(tokstream[0]) && tokstream.length !== 0) {
    number.push(tokstream[0]);
    tokstream = tokstream.substr(1);
  }
  if (tokstream[0] === '.' && isDigit(tokstream[1])) {
    number.push('.');
    number.push(tokstream[1]);
    tokstream = tokstream.substr(2);
    while (isDigit(tokstream[0]) && tokstream.length !== 0) {
      number.push(tokstream[0]);
      tokstream = tokstream.substr(1);
    }
    return ["Float", parseFloat(number.join(''), 10)];
  }
  if (!isFloat)
    return ["Integer", parseInt(number.join(''), 10)];
  else
    return ["Float", parseFloat(number.join(''), 10)];
}

function tokenizeIdent() {
  var identifier = [];
  while (!isWhitespace(tokstream[0])) {
    identifier.push(tokstream[0]);
    tokstream = tokstream.substr(1);
  }
  return ["identifier", identifier.join('')];
}

function tokenize() {
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
      case 43: // '+'
        var num = tokenizeNum();
        if (num !== NaN)
          tokens.push(num);
        break;
      case 45: // '-'
        var num = tokenizeNum();
        if (num !== NaN)
          tokens.push(num);
        break;
      case 46: // '.'
        var num = tokenizeNum();
        if (num !== NaN)
          tokens.push(num);
        break;
      default:
        if (isDigit(tokstream[0])) {
          var num = tokenizeNum();
          if (num !== NaN)
            tokens.push(num);
            break;
        }
        var ident = tokenizeIdent();
        tokens.push(ident);
    }
  }
  return tokens;
}

//var input = process.argv.slice(2).reduce(function(acc, x) {return acc + " " + x}, "").trim();
var tokstream = fs.readFileSync("/dev/stdin").toString();

console.log(tokenize());
