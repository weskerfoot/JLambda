import riot from 'rollup-plugin-riot'
import nodeResolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import buble from 'rollup-plugin-buble'
import uglify from 'rollup-plugin-uglify'

export default {
  entry: './tags/jlambda.js',
  dest: './assets/bundle.js',
  moduleName: "jlambda",
  plugins: [
    riot(),
    nodeResolve({ jsnext: true }),
    commonjs({
      './vm.js' : ['evaluateString']
    }),
    buble(),
    uglify()
  ],
  format: 'iife'
}
