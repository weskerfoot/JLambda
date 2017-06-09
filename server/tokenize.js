import rep from "./representation.js";
import $ from "./tools.js";
import error from "./errors.js";
import _ from "underscore";
import prelude from "./prelude.js";

var operators = Object.keys(rep.OPInfo);

function isDigit(c) {
  if (!c)
    return false;
  var code = c.charCodeAt();
  if (isNaN(code)) {
    return false;
  }
  return (47 < code) && (code < 58)
}

function isWhitespace(c) {
  if (!c)
    return true;

  var code = c.charCodeAt();
  if (isNaN(code)) {
    return true;
  }
  return (code === 9 ||
          code === 32 ||
          code === 10 ||
          code === 13 ||
          code === 11);
}

function isIdentifier(c) {
  var code = c.charCodeAt();
  return (!isNaN(code) &&
          code !== 41 &&
          code !== 40 &&
          code !== 125 &&
          code !== 123 &&
          code !== 93 &&
          code !== 91 &&
          code !== 44 &&
          code !== 34 &&
          code > 32);
}

function isUpper(c) {
  var code = c.charCodeAt();
  return (!isNaN(code) &&
          (code >= 65) &&
          (code <= 90));
}

function tokenizeNum(tokstream, charnum, linenum) {
  var number = [];
  var code = tokstream[0].charCodeAt();
  var isFloat = false;
  var n = 0;
  // + -
  // might want to remove this since it probably won't ever get run?
  if (code === 43 || code === 45) { // + or -
    number.push(tokstream[0]);
    tokstream = tokstream.substr(1);
    n++;
  }
  else if (code === 46) { // .
    tokstream = tokstream.substr(1);
    n++;
    charnum++;
    number.push('0');
    number.push('.');
    isFloat = true;
  }

  while (isDigit(tokstream[0]) && tokstream.length !== 0) {
    number.push(tokstream[0]);
    tokstream = tokstream.substr(1);
    charnum++;
    n++;
  }
  if (tokstream[0] === '.' && isDigit(tokstream[1])) {
    number.push('.');
    number.push(tokstream[1]);
    tokstream = tokstream.substr(2);
    charnum++; charnum++;
    n++; n++;
    while (isDigit(tokstream[0]) && tokstream.length !== 0) {
      number.push(tokstream[0]);
      tokstream = tokstream.substr(1);
      n++;
      charnum++;
    }
    return [n, ["float", parseFloat(number.join(''), 10), charnum, linenum]];
  }
  if (!isFloat)
    return [n, ["integer", parseInt(number.join(''), 10), charnum, linenum]];
  else
    return [n, ["float", parseFloat(number.join(''), 10), charnum, linenum]];
}

/* Split up the tokenized identifier if an operator appears in it
 * prefer longer identifiers that start with the same character(s) as shorter ones
 * e.g. ++ over +
 * Everything after the operator goes back on to the token stream
 */

function tokenizeIdent(tokstream,
                       matchop,
                       charnum,
                       linenum) {
  var identifier = [];
  var n = 0;
  while ((!isWhitespace(tokstream[0])) && isIdentifier(tokstream[0]) && !matchop(tokstream)) {
    identifier.push(tokstream[0]);
    tokstream = tokstream.substr(1);
    n++;
    charnum++;
  }
  identifier = identifier.join('');

  return [[n, ["identifier", identifier, charnum, linenum]]];
}

function tokenizeCtor(tokstream,
                      matchop,
                      charnum,
                      linenum) {
    var ident = tokenizeIdent(tokstream,
                              matchop,
                              charnum,
                              linenum);
    ident[0][1][0] = "constructor";
    return ident;
}

function tokenizeStr(tokstream, charnum, linenum) {
  var stringlit = [];
  var n = 1;
  var new_charnum = charnum;
  tokstream = tokstream.substr(1);
  while (tokstream[0].charCodeAt() !== 34) {
    stringlit.push(tokstream[0]);
    tokstream = tokstream.substr(1);
    n++;
    new_charnum++;
    if (tokstream.length < 1) {
      throw error.JSyntaxError(linenum, charnum, "Error: missing quotation mark");
    }
  }
  n++;
  return [n, ["stringlit", stringlit.join(''), new_charnum, linenum]];

}

function tokenizeT(tokstream, charnum, linenum) {
  if (tokstream.length < 4)
    return false;
  var next4 = tokstream.substr(0,4);
  if (next4 === "then")
    return ["thenexp", "then"];
  else if (next4 === "true")
    return ["truelit", "true"];
  return false;
}

function peek(tokstream, toktype, word, charnum, linenum) {
  var n = word.length;
  if (tokstream.length < n)
    return false;
  var nextN = tokstream.substr(0, n);
  if (nextN == word) {
    return [toktype, word];
  }
  return false;
}


function tokenize(tokstream, matchop) {
  var tokens = [];
  var charnum = 1;
  var linenum = 1;
  var i, result, lambda, num, comment;

  while (tokstream) {
    switch (tokstream[0].charCodeAt()) {
      /* falls through */
      case 59: // ;
        while (tokstream[0].charCodeAt() !== 10) {
          tokstream = tokstream.substr(1);
        }
        break;
      case 9: // '\t'
        charnum++;
        tokens.push(["whitespace", '\t', charnum, linenum]);
        tokstream = tokstream.substr(1);
        break;
      /* falls through */
      case 32: // ' '
        charnum++;
        tokens.push(["whitespace", ' ', charnum, linenum]);
        tokstream = tokstream.substr(1);
        break;
      /* falls through */
      case 10: // '\n'
        linenum++;
        charnum = 1; /* Reset the character number for each line to 1 */
        tokens.push(["whitespace", '\n', charnum, linenum]);
        tokstream = tokstream.substr(1);
        break;
      /* falls through */
      case 44: // ','
        charnum++;
        tokens.push(["comma", ",", charnum, linenum]);
        tokstream = tokstream.substr(1);
        break;
      /* falls through */
      case 40: // '('
        charnum++;
        tokens.push(["left_paren", '(', charnum, linenum]);
        tokstream = tokstream.substr(1);

        break;
      /* falls through */
      case 41: // ')'
        charnum++;
        tokens.push(["right_paren", ')', charnum, linenum]);
        tokstream = tokstream.substr(1);
        break;
      /* falls through */
      case 123: // '{'
        charnum++;
        tokens.push(["left_brace", '{', charnum, linenum]);
        tokstream = tokstream.substr(1);
        break;
      /* falls through */
      case 125: // '}'
        charnum++;
        tokens.push(["right_brace", '}', charnum, linenum]);
        tokstream = tokstream.substr(1);
        break;
      /* falls through */
      case 91: // '['
        charnum++;
        tokens.push(["left_square", '[', charnum, linenum]);
        tokstream = tokstream.substr(1);
        break;
      /* falls through */
      case 93: // ']'
        charnum++;
        tokens.push(["right_square", ']', charnum, linenum]);
        tokstream = tokstream.substr(1);
        break;
      /* falls through */
      case 34: // '"'
        result = tokenizeStr(tokstream, charnum, linenum);
        var str = result[1];
        i = result[0];
        tokens.push(str);
        tokstream = tokstream.substr(i);
        break;

      /* falls through */
      case 46: // '.'
        if (isDigit(tokstream[1])) {
          result = tokenizeNum(tokstream, charnum, linenum);
          num = result[1];
          i = result[0];
          if (!isNaN(num[1])) {
            tokens.push(num);
          }
          tokstream = tokstream.substr(i);
          break;
        }
      /* falls through */
      case 116: // 't'
        result = tokenizeT(tokstream);
        if (result) {
          tokens.push($.extend(result, [charnum, linenum]));
          tokstream = tokstream.substr(4); // 4 = length of either token
          break;
        }
      /* falls through */
      case 105: // 'i'
        var ifexp = peek(tokstream, "ifexp", "if");
        if (ifexp) {
          tokens.push($.extend(ifexp, [charnum, linenum]));
          tokstream = tokstream.substr(2);
          break;
        }
        var inkeyword = peek(tokstream, "in", "in ");
        if (inkeyword) {
          tokens.push($.extend(inkeyword, [charnum, linenum]));
          tokstream = tokstream.substr(3);
          break;
        }

      /* falls through */
      case 100: // 'd'
        var defop = peek(tokstream, "defop", "defop");
        if (defop) {
          tokens.push(["defop", "defop", charnum, linenum]);
          tokstream = tokstream.substr(5);
          break;
        }
        var deftype = peek(tokstream, "deftype", "deftype");
        if (deftype) {
          tokens.push(["deftype", "deftype", charnum, linenum]);
          tokstream = tokstream.substr(7);
          break;
        }
        var def = peek(tokstream, "def", "def");
        if (def) {
          tokens.push(["def", "def", charnum, linenum]);
          tokstream = tokstream.substr(3);
          break;
        }
      /* falls through */
      case 101: // e
        result = peek(tokstream, "elsexp", "else");
        if (result) {
          tokens.push($.extend(result, [charnum, linenum]));
          tokstream = tokstream.substr(4);
          break;
        }
      /* falls through */
      case 102: // f
        result = peek(tokstream, "falselit", "false");
        if (result) {
          tokens.push($.extend(result, [charnum, linenum]));
          tokstream = tokstream.substr(5);
          break;
        }
      /* falls through */
      case 108: // l
        lambda = peek(tokstream, "lambda", "lambda");
        if (lambda) {
          tokens.push($.extend(lambda, [charnum, linenum]));
          tokstream = tokstream.substr(6);
          break;
        }
        var letexp = peek(tokstream, "let", "let");
        if (letexp) {
          tokens.push($.extend(letexp, [charnum, linenum]));
          tokstream = tokstream.substr(3);
          break;
        }

      /* falls through */
      default:
        if (isDigit(tokstream[0])) {
          result = tokenizeNum(tokstream, charnum, linenum);
          num = result[1];
          i = result[0];
          if (!isNaN(num[1])) {
            tokens.push(num);
          }
          tokstream = tokstream.substr(i);
          break;
        }
        var op = matchop(tokstream);
        if (op) {
          var l = op.length;
          charnum = charnum + l;
          tokstream = tokstream.substr(l);
          tokens.push(["identifier", op, charnum, linenum]);
        }
        else {
          if (isUpper(tokstream[0])) {
            result = tokenizeCtor(tokstream, matchop, charnum, linenum);
          }
          else {
            result = tokenizeIdent(tokstream, matchop, charnum, linenum);
          }
          for(var index = 0; index < result.length; index++) {
            charnum++;
            tokens.push(result[index][1]);
            tokstream = tokstream.substr(result[index][0]);
          }
        }
     }
  }
  return tokens;
}

function tokenizeHelp(input, matchop, strip_whitespace) {
  try {
    return tokenize(input, matchop).reverse().filter(function(x) {
      if (strip_whitespace) {
        return x[0] !== "whitespace";
      }
      else {
        return true;
      }
    });
  } catch (e) {
    console.log(e.stxerror());
  }
}

var defop_pattern = ["defop", "integer", "constructor",
                     "left_paren", "identifier",
                     "identifier", "identifier", "right_paren"];

function checkPattern(x, i) {
  return x === defop_pattern[i];
}

function tokenizeFull(input) {
  var preludeSrc = prelude.src;
  var matchop;
  input = [preludeSrc, input].join("");
  var initialPass = tokenizeHelp(input, _.constant(false), true).reverse();

  for (var i = 0; i < initialPass.length; i++) {
    if (initialPass.slice(i, i+8).
        map(_.first).
        every(checkPattern)) {
          rep.OPInfo[initialPass[i+5][1]] =
            [parseInt(initialPass[i+1][1], 10),
            initialPass[i+2][1]];
         }
  }
  operators = Object.keys(rep.OPInfo);
  matchop = $.opMatch(operators);
  return tokenizeHelp(input, matchop, true);
}

export default {tokenize : tokenizeFull,
                  isIdentifier : isIdentifier};
