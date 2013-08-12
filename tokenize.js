#!  /usr/bin/node

// Tokenization, with no regular expressions, ala Rob Pike :)

var TokenStream = {
  lookahead :
    function(n) {
      return this.tokstream.slice(0,n);
    }
}

function MakeTokStream(tokens) {
  this.tokstream = tokens;
}
MakeTokStream.prototype = TokenStream;

var input = process.argv.slice(2).reduce(function(acc, x) {return acc + " " + x}, "");

var test = new MakeTokStream(input);

console.log(test.lookahead(8));
