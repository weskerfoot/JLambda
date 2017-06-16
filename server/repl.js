#! /usr/bin/env node

import readline from "readline";
import vm from "./vm.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'OHAI> '
});

rl.prompt();

rl.on('line', (line) => {
  console.log(vm.evaluateString(line));
  rl.prompt();
}).on('close', () => {
  console.log('Bye');
  process.exit(0);
});
