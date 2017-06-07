var express = require('express');
var router = express.Router();
var vm = require("../vm.js");

/* GET home page. */
router.get('/', function(req, res, next) {
  var query_params = req.query;
  var evaluated = vm.evaluate(query_params.source);
  res.render('index', { title: 'Express', output: JSON.stringify(evaluated)});
});

module.exports = router;
