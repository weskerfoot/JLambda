#! /usr/bin/env node

import readline from "readline";
import vm from "./vm.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'λ '
});

rl.prompt();

var last;

rl.on('line', (line) => {
  try {
    if (line.trim().length == 0) {
      rl.prompt();
    }
    else {
      last = vm.evaluateString(line);
      if (last == undefined) {
        rl.prompt();
      }
      else {
        console.log(last);
        vm.env.bindings["it"] = last;
      }
    }
  }
  catch (e) {
    console.log(e.errormessage);
  }
  rl.prompt();
}).on('close', () => {
  console.log('Bye');
  process.exit(0);
});
