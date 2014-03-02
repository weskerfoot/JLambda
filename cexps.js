/*
 * Defines the data structures associated with Continuation Expressions (cexps)
 * The object here is to have an intermediate representation that allows a code generator backend
 * to easily create sequential code. In other words we are taking an alegraic/applicative language
 * and translating it to something more similar to the "one word at a time" architecture of the von-Neumann
 * architecture
 */

var cexp = {
  type : "cexp"
}

function record(values_accesspaths,
                w,
                next_cexp) {
        this.values_accesspaths = values_accesspaths;
        this.w = w;
        this.next_cexp = next_cexp;
        return this;
}

record.prototype = cexp;

function select(i, v, w, next_cexp) {
  this.i = i;
  this.v = v;
  this.w = w;
  this.next_cexp = next_cexp;
  return this;
}
select.prototype = cexp;

function offset(i, v, w, next_cexp) {
  this.i = i;
  this.v = v;
  this.w = w;
  this.next_cexp = next_cexp;
  return this;
}
offset.prototype = cexp;

function app(k, vs) {
  this.k =k;
  this.vs = vs;
  return this;
}
app.prototype = cexp;

function fix(fs, next_cexp) {
  this.fs = fs;
  this.next_cexp = next_cexp;
  return this;
}
fix.prototype = cexp;

function switchl(v, cexps) {
  this.v = v;
  this.cexps = cexps;
  return this;
}
switchl.prototype = cexp;

function primop(op, vals, vars, next_cexp) {
  this.op = op;
  this.vals = vals;
  this.vars = vars;
  this.next_cexp = next_cexp;
  return this;
}
primop.prototype = cexp;

function accessPath(offp, selp) {
  this.offp = offp;
  this.selp = selp;
  return this;
}

var primoptype = {
  type : "primop",
  equal : function(pOp) {
    return this.name === pOp.name
  }
};

function Primop(name) {
  function ptype() {
    this.name = name;
    return this;
  };
  ptype.prototype = primoptype;
  return new ptype();
}

var times = Primop("+");
var plus = Primop("+");
var div = Primop("div");
var tilde = Primop("~");
var ieql = Primop("ieql");
var ineq = Primop("ineq");
var lessthan = Primop("<");
var lessoreq = Primop("<=");
var greatthan = Primop(">");
var greatoreq = Primop(">=");
var bang = Primop("!");
var subscript = Protoype("subscript");
var ordof = Primop("ordof");
var assign = Primop(":=");
var unboxedassign = Primop("unboxedassign");
var update = Primop("update");
var unboxedupdate = Primop("unboxedupdate");
var store = Primop("store");
var makeref = Primop("makeref");
var makerefunboxed = Primop("makerefunboxed");
var alength = Primop("alength");
var slength = Primop("slength");
var gethdlr = Primop("gethdlr")
var sethdlr = Primop("sethdlr");
var boxed = Primop("boxed");
var fadd = Primop("fadd");
var fsub = Primop("fsub");
var fdiv = Primop("fdiv");
var fmul = Primop("fmul");
var feql = Primop("feql");
var fneq = Primop("fneq");
var fge = Primop("fge");
var fgt = Primop("fgt");
var fle = Primop("fle");
var flt = Primop("flt");
var rshift = Primop("rshift");
var lshift = Primop("lshift");
var orb = Primop("orb");
var andb = Primop("andb");
var xorb = Primop("xorb");
var notb = Primop("notb");

