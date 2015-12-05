var express = require('express');
var router = express.Router();

// Database Settings
var hdb    = require('hdb');
var client = hdb.createClient({
  host     : '192.168.30.150',
  port     : 30915,
  user     : '',
  password : ''
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
    client.exec('select * from NYCCAB.TRIP_SPATIAL_ANNOTATED LIMIT '+limit+' ', function (err, rows) {
      client.end();
      if (err) {
        return console.error('Execute error:', err);
      }
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(rows, null, 3));
    });
  });
});

router.get('/getGrid', function(req, res, next) {

  client.connect(function (err) {
    if (err) {
      return console.error('Connect error', err);
    }

    var sql = "SELECT ST_ClusterID() AS cluster_id, ST_ClusterEnvelope().ST_Centroid().ST_AsGeoJson() AS cluster_centroid, COUNT(*) AS rides, AVG(f.TOTAL / t.DISTANCE) as rate \
      FROM \"NYCCAB\".\"TRIP_SPATIAL_ANNOTATED\" \
      JOIN \"NYCCAB\".\"FARE\" f \
      ON t.MEDALLION = f.MEDALLION AND t.DRIVER = f.DRIVER AND t.PICKUP_TIME = f.PICKUP_TIME \
      WHERE TO_DATE(PICKUP_TIME) >= '" + req.query.start_date + "' AND TO_DATE(PICKUP_TIME) <= '" + req.query.start_date + "' \
      AND t.DISTANCE > 0 \
      AND PICKUP.ST_within('POLYGON((" + req.query.polygon_string + "))') = 1 \
      GROUP CLUSTER BY PICKUP \
      USING GRID X BETWEEN " + req.query.bottom_left.lat + " AND " + req.query.top_right.lat + " CELLS " + req.query.cells + " Y BETWEEN " + req.query.bottom_left.lng + " AND " + req.query.top_right.lng + " CELLS " + req.query.cells + " \
      ORDER BY cluster_id";
      // WITH HINT (OLAP_PARALLEL_AGGREGATION)";

    client.exec(sql, function (err, rows) {
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