/*
 * This file defines common error objects
 * for reporting on syntax errors, type errors,
 * and perhaps runtime exceptions although I have
 * not thought about how that will work much
 */

function JSyntaxError(linenum, charnum, message) {
  this.linenum = linenum;
  this.charnum = charnum;
  this.errormessage = message;
  this.stxerror = function() {
  console.log("Syntax Error\n",
                "Line #", this.linenum,"\n",
                "Near character #", this.charnum, "\n",
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

module.exports =
  {JSyntaxError : JSyntaxError,
   JTypeError : JTypeError};
