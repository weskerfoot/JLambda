/* Takes an AST and converts all of the functions into closures.
 * A closure is a pair of two things: an environment and a function
 * The closure has the property that all of the free variables of the function
 * are in the environment, or an exception is raised because the variable is not bound
 * in the current environment.
 * A free variable is simply those that are not in the list of formal parameters.
 * We start with the global environment and traverse the AST. Every time a new function is entered
 * the current environment gets extended with the formal parameters of the function.
 * When a let is encountered the current environment also gets extended.
 * The algorithm continues for any further function definitions in that branch
 * otherwise it just stops for that particular branch and continues with the rest of the AST
 *
 * Therefore in order to call a closure one must first extract the actual function and then
 * call the function with the environment associated with it.
 * For the purposes of type checking it does not matter how the function gets called, the environment
 * is only used for looking up the types of names. Formal parameters are given type variables.
 */
