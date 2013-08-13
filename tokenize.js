#!  /usr/bin/node

// Tokenization, with no regular expressions, ala Rob Pike :)

function isDigit(a) {
  if (!a)
    return false;
  var code = a.charCodeAt();
  if (46 < code && code < 58 || code < 58 && code > 46)
    return true;
  return false;
}

var TokenStream = {
  lookahead :
    function(n) {
      return this.tokstream[this.tokstream.length-n];
    },
  next :
    function() {
      return this.lookahead(2);
    },
  empty :
    function() {
      return this.tokstream.length === 0;
    },
  current :
    function() {
      return this.tokstream[this.tokstream.length-1];
    },
  pop :
    function() {
      this.tokstream.pop();
    }
}

function MakeTokStream(tokens) {
  this.tokstream = tokens;
}
MakeTokStream.prototype = TokenStream;

function tokenizeNum(tokstream) {
  var number = [];
  tokstream.pop();
  while (isDigit(tokstream.current()) && !tokstream.empty()) {
    number.push(tokstream.current());
    tokstream.pop();
  }
  if (tokstream.current() === '.' && isDigit(tokstream.next())) {
    number.push('.');
    number.push(tokstream.next());
    tokstream.pop();
    tokstream.pop();
    while (isDigit(tokstream.current()) && !tokstream.empty()) {
      number.push(tokstream.current());
      tokstream.pop();
    }
    return ["Float", parseFloat(number.join(''), 10)];
  }
  return ["Integer", parseInt(number.join(''), 10)];
}

function tokenize(tokstream) {
  var tokens = [];

  while (!tokstream.empty()) {
    switch (tokstream.current()) {
      case '(':
        tokens.push(["left_paren", '(']);
        break;
      case ')':
        tokens.push(["right_paren", ')']);
        break;
      case '{':
        tokens.push(["left_brace", '{']);
        break;
      case '}':
        tokens.push(["right_brace", '}']);
        break;
      case '[':
        tokens.push(["left_square", '[']);
        break;
      case ']':
        tokens.push(["right_square", ']']);
        break;
      case '+':
        var num = tokenizeNum(tokstream);
        if (num !== NaN)
          tokens.push(num);
        break;
      case '-':
        var num = tokenizeNum(tokstream);
        if (num !== NaN)
          tokens.push(num);
        break;
      case '.':
        var num = tokenizeNum(tokstream);
        if (num !== NaN)
          tokens.push(num);
        break;
      default:
        tokens.push(["identifier", tokstream.current()]);
        tokstream.pop();
    }
  }
  return tokens;
}

var input = process.argv.slice(2).reduce(function(acc, x) {return acc + " " + x}, "").trim().split('').reverse();

var test = new MakeTokStream(input);

console.log(tokenize(test));
//console.log(isDigit('0'));

