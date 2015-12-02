initMap = function(){

  var apiKey = SECRETS['mapbox_key']

  var baseLayer = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
      maxZoom: 18,
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors,' + 
      	'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>,' +
      	' Imagery Â© <a href="http://mapbox.com">Mapbox</a>',
      id: 'mapbox.streets',
      accessToken: apiKey
  });

  var cfg = {
    radius: .0025,
    maxOpacity: .3, 
    scaleRadius: true, 
    useLocalExtrema: true,
    latField: 'lat',
    lngField: 'lng',
    valueField: 'count',
    gradient: {
      '.5': 'red',
      '.7': 'yellow',
      '.95': 'white'
    }
  };

  var heatmapLayer = new HeatmapOverlay(cfg);

  var map = L.map('map', {
  	center: new L.LatLng(40.7127, -74.0059),
  	zoom: 12,
    	layers: [baseLayer,heatmapLayer]
  });

  // -- drawing tools --
  var featureGroup = L.featureGroup().addTo(map);

  var drawOptions = {
    draw: {
      polyline: false,
      polygon: {
        allowIntersection: false,
        drawError: {
          color: '#red',
          message: '<strong>Sorry, no intersections possible.<strong>'
        },
        shapeOptions: {color: 'blue'}
        },
      rectangle : {
        shapeOptions: {color: 'blue'}
      },
      circle: {
        shapeOptions: {color: 'blue'}
      },
      marker: false
    },
    edit: {
        featureGroup: featureGroup,
        remove: false,
        edit:false
    }
  };

  var drawControl = new L.Control.Draw(drawOptions).addTo(map);

  var boundaryLayer;
  map.on('draw:drawstart', function(e) {
    if (typeof boundaryLayer !== 'undefined') {featureGroup.removeLayer(boundaryLayer)}
  });

  
  map.on('draw:created', function(e) {
    boundaryLayer = e.layer;
    featureGroup.addLayer(boundaryLayer);
  });

  // -- event handling --
  var marker;
  function onMapClick(e) {
    if (typeof marker !== "undefined") {map.removeLayer(marker)};
    heatmapLayer.setData({max:10,data:[{lat:e.latlng.lat,lng:e.latlng.lng,count:10},{lat:e.latlng.lat+0.0050,lng:e.latlng.lng+0.0050,count:3},{lat:e.latlng.lat-0.003,lng:e.latlng.lng-0.003,count:5}]})
    marker = L.marker(e.latlng);
    map.addLayer(marker);

  }
  map.on('click', onMapClick);

  function onMouseMove(e) {$('#latlng').text(e.latlng.lat.toFixed(4) + ", " + e.latlng.lng.toFixed(4))}
  map.on('mousemove',onMouseMove)
}


window.onload = initMap;






	