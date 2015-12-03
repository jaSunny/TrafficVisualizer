// detail pane wrapper module
var DetailPane = (function(){
  
  var initDateRangePicker = function(){
    $('input[name="daterange"]').daterangepicker();
  };

  return {
    create: function(){
      initDateRangePicker();
      return this;
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
  var getColor = function(d) {
    return d > 1000 ? '#800026' :
           d > 500  ? '#BD0026' :
           d > 200  ? '#E31A1C' :
           d > 100  ? '#FC4E2A' :
           d > 50   ? '#FD8D3C' :
           d > 20   ? '#FEB24C' :
           d > 10   ? '#FED976' :
                      '#FFEDA0';
  }

  return {
    create: function(map){
      _legend = L.control({position: 'topright'});

      _legend.onAdd = function(map){
        var div = L.DomUtil.create('div', 'info legend'),
            grades = [0, 10, 20, 50, 100, 200, 500, 1000],
            labels = [];

        // loop through our density intervals and generate a label with a colored square for each interval
        for (var i = 0; i < grades.length; i++) {
            div.innerHTML +=
                '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
                grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
        }
        return div;
      };

      map.addLegend(_legend);
      return this;
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
      polygon: {
        allowIntersection: false,
        drawError: {
          color: '#red',
          message: '<strong>Sorry, no intersections possible.<strong>'
        },
        shapeOptions: {color: 'blue', fillOpacity: 0}
        },
      rectangle : {
        shapeOptions: {color: 'blue', fillOpacity: 0}
      },
      circle: {
        shapeOptions: {color: 'blue', fillOpacity: 0}
      },
      marker: false
    },
    edit: {
        remove: false,
        edit:false
    }
  };
  map.addDrawControls(drawOptions);


  // create heatmap
  var cfg = {
    radius: 15,
    maxOpacity: .8, 
    scaleRadius: false, 
    useLocalExtrema: false,
    latField: 'lat',
    lngField: 'lng',
    valueField: 'count',
  };
  var heatmapLayer = new HeatmapOverlay(cfg);
  map.addLayer(heatmapLayer);

  // create legend
  legend = Legend.create(map);

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
  }
  map.on('click', onMapClick);

  function onMouseMove(e) {
    $('#latlng').text(e.latlng.lat.toFixed(4) + ", " + e.latlng.lng.toFixed(4))
  }
  map.on('mousemove',onMouseMove)
};

window.onload = initMap;






	