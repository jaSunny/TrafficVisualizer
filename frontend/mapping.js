// detail pane wrapper module
var DetailPane = (function(){

  var startDate = '2012-03-14';
  var endDate = '2013-03-15';

  var initDateRangePicker = function(){
    $('input[name="daterange"]').daterangepicker({
        locale: {
          format: 'YYYY-MM-DD'
        },
        startDate: startDate,
        endDate: endDate,
        minDate: '2012-03-14',
        maxDate: '2013-05-25'
      },
    function(start, end, label) {
        startDate = start.format('YYYY-MM-DD');
        endDate = end.format('YYYY-MM-DD');
    });
  };

  var mode;
  var initModeButtons = function(){
    // initial value
    mode = $("#actionButtons").find(".active").find("input")[0].id;
    // add listeners
    $("#num_rides_btn").on("click", function(){
      mode = 'num_rides_option';
      console.log(mode);
    });
    $("#avg_cost_btn").on("click", function(){
      mode = 'avg_cost_option';
      console.log(mode);
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
      $.extend(cfg,mapConfig)
      _map = L.map(elemId,cfg)
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
          coords += "," + points[0]["lat"] + " " + points[0]["lng"]
          console.log(coords);
        });
    },

    addLegend: function(legend){
      legend.addTo(_map);
    },

    on: function(event,func){
      _map.on(event,func);
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
        title.innerHTML = "Taxi Pickups";
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

  // add draw controls
  var drawOptions = {
    draw: {
      polyline: false,
      polygon: false,
      // {
      //   allowIntersection: false,
      //   drawError: {
      //     color: '#red',
      //     message: '<strong>Sorry, no intersections possible.<strong>'
      //   },
      //   shapeOptions: {color: 'blue', fillOpacity: 0}
      //   },
      rectangle : {
        shapeOptions: {color: 'blue', fillOpacity: 0}
      },
      circle: false,
      marker: false
    },
    edit: {
        remove: false,
        edit:false
    }
  };
  map.addDrawControls(drawOptions);

  // create legend
  legend = Legend.create(map);

  // create heatmap
  var cfg = {
    radius: 15,
    maxOpacity: .8,
    scaleRadius: false,
    useLocalExtrema: false,
    latField: 'lat',
    lngField: 'lng',
    valueField: 'count',
    onExtremaChange: function onExtremaChange(data){
            legend.update(data);
          }
  };
  var heatmapLayer = new HeatmapOverlay(cfg);
  map.addLayer(heatmapLayer);

  // -- event handling --
  var marker;
  var markerCircle;
  var onMapClick = function(e) {
    if (typeof marker !== "undefined") {map.removeLayer(marker)};

    heatmapLayer.setData(
      {
        min: 0,
        max:10,
        data: MOCKDATA['data']
      })
    marker = L.marker(e.latlng);
    map.addLayer(marker);
    legend.update(0,10);
  }
  map.on('click', onMapClick);

  function onMouseMove(e) {
    $('#latlng').text(e.latlng.lat.toFixed(4) + ", " + e.latlng.lng.toFixed(4))
  }
  map.on('mousemove',onMouseMove)
};

window.onload = initMap;






