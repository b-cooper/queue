// transpile es2015
require('babel-register')({
  presets: ['env', 'es2015'],
  plugins: [
    "transform-object-rest-spread",
    "transform-export-extensions",
    "lodash"
  ]
})

module.exports = require('./app.js')
