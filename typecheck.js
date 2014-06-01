/*
 * Typecheck an AST with a given environment
 * the environment maps variables to types
 * a variable can either be bound or free
 * when we say a variable is free that means that it is either
 * unbound (which causes an exception to be raised immediately)
 * or it is bound in the outer scope
 *
 * So the AST must first be converted to a form where each function body is tied
 * to an environment mapping identifiers to types
 */

var rep = require("./representation.js");
var env = require("./environments.js");

/*
 * Map all bindings with explicit type annotations in the environment
 */
function gather_annotations(stx) {
