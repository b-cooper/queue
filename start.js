// transpile es2015
require('babel-register')({
  presets: [ 'env' ]
})

module.exports = require('./app.js')
