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
    return [n, ["Float", parseFloat(number.join(''), 10)]];
  }
  if (!isFloat)
    return [n, ["Integer", parseInt(number.join(''), 10)]];
  else
    return [n, ["Float", parseFloat(number.join(''), 10)]];
}

function tokenizeIdent(tokstream) {
  var identifier = [];
  var n = 0;
  while (!(isWhitespace(tokstream[0]) || tokstream[0].charCodeAt() === 34)) {
    identifier.push(tokstream[0]);
    tokstream = tokstream.substr(1);
    n++;
  }
  return [n, ["identifier", identifier.join('')]];
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
    return ["then-exp", "then"];
  else if (next4 === "true")
    return ["bool", "true"];
  else
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
        var result = tokenizeNum(tokstream);
        var num = result[1];
        var i = result[0];
        if (num[1] !== NaN)
          tokens.push(num);
        tokstream = tokstream.substr(i);
        break;
      case 45: // '-'
        var result = tokenizeNum(tokstream);
        var num = result[1];
        var i = result[0];
        if (num[1] !== NaN)
          tokens.push(num);
        tokstream = tokstream.substr(i);
        break;
      case 46: // '.'
        var result = tokenizeNum(tokstream);
       var num = result[1];
        var i = result[0];
        if (num[1] !== NaN)
          tokens.push(num);
        tokstream = tokstream.substr(i);
        break;
      case 116: // 't'
        var result = tokenizeT(tokstream);
        if (result) {
          tokens.push(result);
          tokstream = tokstream.substr(4); // 4 = length of either token
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
        var result = tokenizeIdent(tokstream);
        var i = result[0];
        var ident = result[1];
        tokens.push(ident);
        tokstream = tokstream.substr(i);
    }
  }
  return tokens;
}

var tokstream = fs.readFileSync("/dev/stdin").toString();

console.log(tokenize(tokstream));
//tokenize(tokstream);

