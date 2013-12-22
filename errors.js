/*
 * This file defines common error objects
 * for reporting on syntax errors, type errors,
 * and perhaps runtime exceptions although I have
 * not thought about how that will work much
 */

var JLException = {
  stxerror :
    function () {
      console.log("There was an error\n",
                  "Line #",this.linenum,"\n",
                  "Character #", this.charnum,"\n",
                  this.errormessage);
    },
  type_error :
    function () {
      return;
    }
}

function JSyntaxError(linenum, charnum, message) {
  this.linenum = linenum;
  this.charnum = charnum;
  this.errormessage = message;
  this.stxerror = function() {
  console.log("Syntax Error\n",
                "Line #", this.linenum,"\n",
                "Character #", this.charnum, "\n",
                this.errormessage);
  };
  return this;
}

function JTypeError(linenum, charnum, token, message) {
  this.linenum = linenum;
  this.charnum = charnum;
  this.errormessage = message;
  this.token = token;
  return this;
}
TypeError.prototype = JLException;

module.exports =
  {JSyntaxError : JSyntaxError,
   JTypeError : JTypeError};
