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

  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");

  client.connect(function (err) {
    if (err) {
      return console.error('Connect error', err);
    }

    var grid = {};
    var minMax = {};

    var sql = "SELECT ST_ClusterID() AS cluster_id, ST_ClusterEnvelope().ST_Centroid().ST_X() AS cluster_x, ST_ClusterEnvelope().ST_Centroid().ST_Y() AS cluster_y, COUNT(*) AS rides, AVG(f.TOTAL / t.DISTANCE) as rate \
      FROM \"NYCCAB\".\"TRIP_SPATIAL_ANNOTATED\" t \
      JOIN \"NYCCAB\".\"FARE\" f \
      ON t.MEDALLION = f.MEDALLION AND t.DRIVER = f.DRIVER AND t.PICKUP_TIME = f.PICKUP_TIME \
      WHERE TO_DATE(t.PICKUP_TIME) >= '" + req.query.start_date + "' AND TO_DATE(t.PICKUP_TIME) <= '" + req.query.start_date + "' \
      AND t.DISTANCE > 0 \
      AND (f.TOTAL / t.DISTANCE) < 100 \
      AND (f.TOTAL / t.DISTANCE) > 1 \
      AND PICKUP.ST_within('POLYGON((" + req.query.polygon_string + "))') = 1 \
      GROUP CLUSTER BY PICKUP \
      USING GRID X BETWEEN " + req.query.bottom_left.lat + " AND " + req.query.top_right.lat + " CELLS " + req.query.cells + " Y BETWEEN " + req.query.bottom_left.lng + " AND " + req.query.top_right.lng + " CELLS " + req.query.cells + " \
      ORDER BY cluster_id";

    client.exec(sql, function (err, rows) {
      client.end();
      if (err) {
        return console.error('Execute error:', err);
      }

      grid = rows;

      var minRides;
      var maxRides = 0;
      var minRate;
      var maxRate = 0;

      for(key in grid){
        console.log(grid[key]);
        if(!minRides || grid[key]['RIDES'] < minRides)
          minRides = grid[key]['RIDES'];
        if(!minRate || grid[key]['RATE'] < minRate)
          minRate = grid[key]['RATE'];
        if(grid[key]['RIDES'] > maxRides)
          maxRides = grid[key]['RIDES'];
        if(grid[key]['RATE'] > maxRate)
          maxRate = grid[key]['RATE'];
      }


      minMax = rows;
      res.setHeader('Content-Type', 'application/json');
      res.send(req.query.callback + "(" + JSON.stringify({"grid": grid, "minRides": minRides, "minRate": minRate, "maxRides": maxRides, "maxRate": maxRate}) + ")");
    });
  });
});

router.get('/averageSpeed', function(req, res, next) {

  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");

  client.connect(function (err) {
    if (err) {
      return console.error('Connect error', err);
    }

    var grid = {};
    var minMax = {};

    var sql = "SELECT * FROM  \
      ( \
      SELECT \
          ST_ClusterID() AS cluster_id, \
          ST_ClusterEnvelope().ST_Centroid().ST_X() AS cluster_x, \
          ST_ClusterEnvelope().ST_Centroid().ST_Y() AS cluster_y, \
          COUNT(*) AS rides, \
          AVG(f.TOTAL / t.DISTANCE) as rate, \
          AVG(t.DISTANCE / t.TRIPTIME * 3600) AS \"avg_speed\" \
      FROM \"NYCCAB\".\"TRIP_SPATIAL_ANNOTATED\" t \
      JOIN \"NYCCAB\".\"FARE\" f \
      ON t.MEDALLION = f.MEDALLION AND t.DRIVER = f.DRIVER AND t.PICKUP_TIME = f.PICKUP_TIME \
      WHERE \
          YEAR(t.PICKUP_TIME)=2013 \
          AND DISTANCE>0 \
          AND TRIPTIME>0 \
          AND TRIPTIME<10800 \
          AND t.DISTANCE > 0 \
          AND (f.TOTAL / t.DISTANCE) < 100 \
          AND (f.TOTAL / t.DISTANCE) > 1 \
          AND TO_SECONDDATE(t.PICKUP_TIME) >= '" + req.query.start_date + "' AND TO_SECONDDATE(t.PICKUP_TIME) <= '" + req.query.end_date + "' \
          AND PICKUP.ST_within('POLYGON((" + req.query.polygon_string + "))') = 1 \
          GROUP CLUSTER BY PICKUP \
          USING GRID X BETWEEN " + req.query.bottom_left.lat + " AND " + req.query.top_right.lat + " CELLS " + req.query.cells + " Y BETWEEN " + req.query.bottom_left.lng + " AND " + req.query.top_right.lng + " CELLS " + req.query.cells + " \
          ORDER BY cluster_id \
      )";

      client.exec(sql, function (err, rows) {
      client.end();
      if (err) {
        return console.error('Execute error:', err);
      }

      grid = rows;

      var minRides;
      var maxRides = 0;
      var minRate;
      var maxRate = 0;

      for(key in grid){
        console.log(grid[key]);
        if(!minRides || grid[key]['RIDES'] < minRides)
          minRides = grid[key]['RIDES'];
        if(!minRate || grid[key]['RATE'] < minRate)
          minRate = grid[key]['RATE'];
        if(grid[key]['RIDES'] > maxRides)
          maxRides = grid[key]['RIDES'];
        if(grid[key]['RATE'] > maxRate)
          maxRate = grid[key]['RATE'];
      }

      minMax = rows;
      res.setHeader('Content-Type', 'application/json');
      res.send(req.query.callback + "(" + JSON.stringify({"grid": grid, "minRides": minRides, "minRate": minRate, "maxRides": maxRides, "maxRate": maxRate}) + ")");
    });
  });
});

router.get('/kmeans', function(req, res, next) {

  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");

  client.connect(function (err) {
    if (err) {
      return console.error('Connect error', err);
    }

    var sql = "SELECT c.CLUSTER_ID, COUNT(ID) AS size, c.DROPOFF_LAT AS lat, c.DROPOFF_LONG AS long \
              FROM \"TUKGRP2\".\"PAL_KMEANS_ASSIGNED_TBL_" + req.query.kmeans_state + "_ITERATION\" a \
              JOIN \"TUKGRP2\".\"PAL_KMEANS_CENTERS_TBL_" + req.query.kmeans_state + "_ITERATION\" c \
              ON c.cluster_id = a.cluster \
              GROUP BY c.CLUSTER_ID, c.DROPOFF_LAT, c.DROPOFF_LONG";

      client.exec(sql, function (err, rows) {
      client.end();
      if (err) {
        return console.error('Execute error:', err);
      }

      res.setHeader('Content-Type', 'application/json');
      res.send(req.query.callback + "(" + JSON.stringify(rows) + ")");
    });
  });
});

module.exports = router;
