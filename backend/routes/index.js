var express = require('express');
var router = express.Router();

// Database Settings
var hdb    = require('hdb');
var client = hdb.createClient({
  host     : '192.168.30.150',
  port     : 31615,
  user     : '<username>',
  password : '<password>'
});

client.on('error', function (err) {
  console.error('Network connection error', err);
});


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'TrafficVisualizer' });
});

router.get('/static', function(req, res, next) {
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({ a: 1 }, null, 3));
});

router.get('/record', function(req, res, next) {
  
  if (typeof req.query.limit !== 'undefined' && req.query.limit !== null){
   var limit = req.query.limit;
  } else {
    var limit = 1;
  }
  
  client.connect(function (err) {
    if (err) {
      return console.error('Connect error', err);
    }
    client.exec('select * from NYCCAB.TRIP LIMIT '+limit+' ', function (err, rows) {
      client.end();
      if (err) {
        return console.error('Execute error:', err);
      }
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(rows, null, 3));
    });
  });
});

module.exports = router;