JLambda
=======

JLambda is a functional language in the spirit of languages such as Scheme,
SML, or Clean. It aims to have a very flexible syntax and a clean and easy to
understand type system. Another goal is to generate very efficient JavaScript
code and possibly native code as well. Currently the type system is still being
conceived, and the various parts that conspire to generate actual code are
being written and will likely change quite a bit. It is possible to parse code
and generate a pretty printed version of it (see example.jl for what the syntax
looks like at the moment).

JLambda also aims to support concurrency which will be built on a
continuation-passing style intermediate language. I have not figured out how
scheduling threads will work, or whether I will provide any programmer directed
way of scheduling (i.e. yield).

Installation
------------

    git clone git@github.com:nisstyre56/JLambda.git
    cd JLambda
    npm install

Usage
-----
    cd server
    yarn
    yarn repl # starts the local read-eval-print loop
    yarn server # starts a web app with an interactive REPL
