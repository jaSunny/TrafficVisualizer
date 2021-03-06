var State = (function(){

  var values = {
    "mode": "num_rides_option",
    "polygon_string" : "",
    "top_right": {},
    "bottom_left": {},
    "start_date": "2012-03-14 10:00",
    "end_date": "2013-03-15 12:00",
    "cells": 200
  };

  var backend = {};

  var updatePolygonString = function(topRight,bottomLeft){
    // values: tl, tr, br, bl, tl

    var topLeft = {"lat": topRight["lat"], "lng": bottomLeft["lng"]};
    var bottomRight = {"lat":bottomLeft["lat"], "lng":topRight["lng"]};

    var str = topLeft["lat"]+" "+topLeft["lng"]+","
      +topRight["lat"]+" "+topRight["lng"]+","
      +bottomRight["lat"]+" "+bottomRight["lng"]+","
      +bottomLeft["lat"]+" "+bottomLeft["lng"]+","
      +topLeft["lat"]+" "+topLeft["lng"];

    values["polygon_string"] = str;
  };

  return {
    setDates: function(startDate,endDate){
      values["start_date"] = startDate;
      values["end_date"] = endDate;
    },
    setCorners: function(topRight,bottomLeft){
      values["top_right"] = topRight;
      values["bottom_left"] = bottomLeft;
      updatePolygonString(topRight,bottomLeft);
    },
    setCells: function(cells){
      values["cells"] = cells;
    },
    setMode: function(mode){
      values["mode"] = mode;
    },
    getData: function(){
      return values;
    },
    getBackend: function(){
      return backend;
    },
    setBackend: function(backendData){
      backend = backendData;
    }
  }
})();


// detail pane wrapper module
var DetailPane = (function(){

  var startDate = '2012-03-14 10:00';
  var endDate = '2013-03-15 12:00';

  var initDateRangePicker = function(){
    $('input[name="daterange"]').daterangepicker({
        locale: {
          format: 'YYYY-MM-DD HH:mm'
        },
        startDate: startDate,
        endDate: endDate,
        minDate: '2012-03-14 00:00',
        maxDate: '2013-05-25 23:59',
        timePicker: true,
        timePickerSeconds: false,
        timePicker24Hour: true
      },
    function(start, end, label) {
        startDate = start.format('YYYY-MM-DD HH:mm');
        endDate = end.format('YYYY-MM-DD HH:mm');
    });

    $('#daterange-picker').on('apply.daterangepicker',function(ev, picker) {
      startDate = picker.startDate;
      endDate = picker.endDate;
      State.setDates(startDate.format('YYYY-MM-DD HH:mm'),endDate.format('YYYY-MM-DD HH:mm'));
    });
  };

  var mode;
  var initModeButtons = function(){
    // initial value
    mode = $("#actionButtons").find(".active").find("input")[0].id;
    // add listeners
    $("#num_rides_btn").on("click", function(){
      mode = 'num_rides_option';
      State.setMode(mode);
    });
    $("#avg_cost_btn").on("click", function(){
      mode = 'avg_cost_option';
      State.setMode(mode);
    });
    $("#avg_speed_btn").on("click", function(){
      mode = 'avg_speed_option';
      State.setMode(mode);
    });
  };

  return {
    create: function(){
      initDateRangePicker();
      initModeButtons();
      return this;
    },
    mode: function(){
      return mode;
    },
    getDates: function(){
      return {"startDate": startDate, "endDate":endDate};
    }
  }
})();

// wrapper module for the leaflet map
var Map = (function(){
  var apiKey = SECRETS['mapbox_key'];
  var baseLayer = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
      maxZoom: 18,
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors,' +
        '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>,' +
        ' Imagery Â© <a href="http://mapbox.com">Mapbox</a>',
      id: 'mapbox.streets',
      accessToken: apiKey});
  var _map;

  var featureGroup;
  var drawControl;
  var boundaryLayer;

  return {
    create: function(elemId,mapConfig){

      cfg = {
        layers: baseLayer
      }
      $.extend(cfg,mapConfig);
      _map = L.map(elemId,cfg);
      var bounds = _map.getBounds();
      var b = {
        "bottom_left" : {
          "lat" : bounds['_southWest']['lat'],
          "lng" : bounds['_southWest']['lng']
        },
        "top_right" : {
          "lat" : bounds['_northEast']['lat'],
          "lng" : bounds['_northEast']['lng']
        }
      }
      State.setCorners(b["top_right"],b["bottom_left"]);
      return this;
    },

    addLayer: function(layer){
      _map.addLayer(layer);
    },

    removeLayer: function(layer){
      _map.removeLayer(layer);
    },

    addControl: function(control){
      _map.addControl(control);
    },

    addDrawControls: function(drawOptions){

      featureGroup = new L.featureGroup();
      drawOptions['edit']['featureGroup'] = featureGroup;
      featureGroup.addTo(_map);
      drawControl = new L.Control.Draw(drawOptions);
      drawControl.addTo(_map);

        _map.on('draw:drawstart', function(e) {
          if (typeof boundaryLayer !== 'undefined') {featureGroup.removeLayer(boundaryLayer)}
        });

        _map.on('draw:created', function(e) {
          boundaryLayer = e.layer;
          featureGroup.addLayer(boundaryLayer);
          var points = e.layer.getLatLngs();
          var coords = ""
          for(key in points) {
            if(key > 0) {
              coords += ",";
            }
            coords += points[key]["lat"] + " " + points[key]["lng"];
          }
          //add first point again because of hana
          coords += "," + points[0]["lat"] + " " + points[0]["lng"];
        });
    },

    addLegend: function(legend){
      legend.addTo(_map);
    },

    on: function(event,func){
      _map.on(event,func);
    },

    getBounds: function(){
      var bounds = _map.getBounds();
      return {
        "bottom_left" : {
          "lat" : bounds['_southWest']['lat'],
          "lng" : bounds['_southWest']['lng']
        },
        "top_right" : {
          "lat" : bounds['_northEast']['lat'],
          "lng" : bounds['_northEast']['lng']
        }
      }
    }
  }
})();

// legend module
var Legend = (function(){
  var _legend;

  var _updateLegend = function(data){
    $(".min-span").html(data["min"])
    $(".max-span").html(data["max"])
  };

  return {
    create: function(map){
      _legend = L.control({position: 'topright'});

      _legend.onAdd = function(map){
        // draw legend
        var div = L.DomUtil.create('div', 'info legend');
        var title = L.DomUtil.create('span','',div);
        title.innerHTML = "";
        title.style.display = "block";
        var canvas = L.DomUtil.create('canvas', 'canvas', div);
        canvas.width=125;
        canvas.height=15;
        var minMaxDiv = L.DomUtil.create('div','',div);
        var minSpan = L.DomUtil.create('span','min-span',minMaxDiv);
        minSpan.innerHTML = "0";
        var maxSpan = L.DomUtil.create('span','max-span',minMaxDiv);
        maxSpan.innerHTML = "0";

        // draw gradient
        var ctx = canvas.getContext("2d");
        var grd=ctx.createLinearGradient(0,0,125,0);
        grd.addColorStop(0,"rgb(0,0,255)");
        grd.addColorStop(0.55,"rgb(0,255,0)");
        grd.addColorStop(0.85,"yellow");
        grd.addColorStop(1,"red");
        ctx.fillStyle=grd;
        ctx.fillRect(0,0,125,15);

        return div;
      };

      map.addLegend(_legend);
      return this;
    },
    update: function(data){
      _updateLegend(data)
    }
  }
})();


var initMap = function(){

  // create detail panel
  var detailPane = DetailPane.create();

  // create map
  var map = Map.create('map', {center: new L.LatLng(40.7127, -74.0059), zoom: 13});

  var initialBounds = map.getBounds();

  // add draw controls
  var drawOptions = {
    draw: {
      polyline: false,
      polygon: false,
      rectangle : false,
      circle: false,
      marker: false
    },
    edit: {
        remove: false,
        edit:false
    }
  };

  // map.addDrawControls(drawOptions);
  map.on('move', function (e) {
    var bounds = map.getBounds()
    State.setCorners(bounds["top_right"],bounds["bottom_left"]);
  });

  // create legend
  legend = Legend.create(map);

  // create heatmap
  var cfg = {
    radius: 20,
    maxOpacity: .8,
    scaleRadius: false,
    useLocalExtrema: false,
    latField: 'CLUSTER_X',
    lngField: 'CLUSTER_Y',
    valueField: 'RIDES',
    onExtremaChange: function onExtremaChange(data){
            legend.update(data);
          }
  };
  var heatmapLayer = new HeatmapOverlay(cfg);
  map.addLayer(heatmapLayer);

  // -- event handling --
  var marker;
  var markerCircle;

  // update
  var update = function(){
    var state = State.getData();
    var backendData = State.getBackend();


    if(state["mode"] == "num_rides_option") {
      cfg["valueField"] = "RIDES";
      map.removeLayer(heatmapLayer);
      heatmapLayer = new HeatmapOverlay(cfg);
      map.addLayer(heatmapLayer);
      heatmapLayer.setData(
      {
        min: backendData["minRides"],
        max: backendData["maxRides"],
        data: backendData['grid']
      })
      legend.update(backendData["minRides"],backendData["maxRides"]);
    } else {
       cfg["valueField"] = "RATE";
       map.removeLayer(heatmapLayer);
       heatmapLayer = new HeatmapOverlay(cfg);
       map.addLayer(heatmapLayer);
       heatmapLayer.setData(
      {
        min: backendData["minRate"].toFixed(2),
        max: backendData["maxRate"].toFixed(2),
        data: backendData['grid']
      })
      legend.update(backendData["minRate"],backendData["maxRate"]);
    }




  };

  $("#drawButton").on("click",function(){
    var data = State.getData();

    $.ajax({
      url:"http://localhost:3000/getGrid",
      dataType: 'jsonp', // Notice! JSONP <-- P (lowercase)
      data: data,
      jsonp: "callback",
      success:function(json){
        State.setBackend(json);
        update();
      },
      error:function(){
         alert("Error");
      },
      beforeSend: function () {
         $(".modal").show();
      },
      complete: function () {
        $(".modal").hide();
      }
    });
    // update();
  })

  $("#avg_speed_btn").on("click",function(){
    var data = State.getData();

    $.ajax({
      url:"http://localhost:3000/averageSpeed",
      dataType: 'jsonp', // Notice! JSONP <-- P (lowercase)
      data: data,
      jsonp: "callback",
      success:function(json){
        State.setBackend(json);
        update();
      },
      error:function(){
         alert("Error");
      },
      beforeSend: function () {
         $(".modal").show();
      },
      complete: function () {
        $(".modal").hide();
      }
    });
    // update();
  })


  // lat lng display
  function onMouseMove(e) {
    $('#latlng').text(e.latlng.lat.toFixed(4) + ", " + e.latlng.lng.toFixed(4))
  }
  map.on('mousemove',onMouseMove);

};

window.onload = initMap;






