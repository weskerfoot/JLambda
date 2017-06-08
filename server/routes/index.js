var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  var query_params = req.query;
  res.render('index', { title: 'Express', output: ""});
});

module.exports = router;
