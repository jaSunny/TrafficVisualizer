# TrafficVisualizer

This repo contains an application, which visualizes a NYCCAB dataset with ~100m records by using a SAP HANA instance.

## Frontend

### Frontend prototype

![aveSpeed calculation](https://raw.githubusercontent.com/jaSunny/TrafficVisualizer/master/aveSpeed.png)

![k-means calculation](https://github.com/jaSunny/TrafficVisualizer/blob/master/k-means.png)

### Startup

1. install bower: npm install -g bower
2. run: bower install
3. open index.html

## Deployment

Fire up the backend with

```
cd backend/
npm start
```

Afterwards, you can access the API via

```
http://localhost:3000/
```

## API calls

For fetching entire rows, call

```
http://localhost:3000/records?limit=10
```

which returns you an array of 10 rows for example.

### average speed with grid

```
http://localhost:3000/averageSpeed
```

### k-means

To get the results of k-means operation

```
http://localhost:3000/kmeans?kmeans_state=<add_stage_here>
```

```
[{"CLUSTER_ID":5,"SIZE":149359,"LAT":40.73991012573242,"LONG":-73.98237991333008},{"CLUSTER_ID":7,"SIZE":22710,"LAT":40.7400598526001,"LONG":-73.98223972320557},{"CLUSTER_ID":9,"SIZE":15404,"LAT":40.74178981781006,"LONG":-73.98237991333008},{"CLUSTER_ID":8,"SIZE":17727,"LAT":40.74290466308594,"LONG":-73.98225975036621},{"CLUSTER_ID":16,"SIZE":35099,"LAT":40.748430252075195,"LONG":-73.98237991333008},{"CLUSTER_ID":14,"SIZE":45090,"LAT":40.75153732299805,"LONG":-73.98221015930176},{"CLUSTER_ID":11,"SIZE":54707,"LAT":40.75942039489746,"LONG":-73.98225402832031},{"CLUSTER_ID":10,"SIZE":41794,"LAT":40.76235580444336,"LONG":-73.98225402832031},{"CLUSTER_ID":6,"SIZE":10849,"LAT":40.76836013793945,"LONG":-73.98225402832031},{"CLUSTER_ID":12,"SIZE":1985,"LAT":40.768402099609375,"LONG":-73.98225975036621},{"CLUSTER_ID":13,"SIZE":24995,"LAT":40.76955032348633,"LONG":-73.98212432861328},{"CLUSTER_ID":2,"SIZE":2343,"LAT":40.769619941711426,"LONG":-73.98237991333008},{"CLUSTER_ID":1,"SIZE":2356,"LAT":40.77064037322998,"LONG":-73.98237991333008},{"CLUSTER_ID":15,"SIZE":3625,"LAT":40.772315979003906,"LONG":-73.98225975036621},{"CLUSTER_ID":0,"SIZE":1196,"LAT":40.77255630493164,"LONG":-73.98237991333008},{"CLUSTER_ID":3,"SIZE":2259,"LAT":40.77385330200195,"LONG":-73.98223972320557},{"CLUSTER_ID":19,"SIZE":639,"LAT":40.77404022216797,"LONG":-73.98223972320557},{"CLUSTER_ID":17,"SIZE":10895,"LAT":40.7745246887207,"LONG":-73.98221015930176},{"CLUSTER_ID":4,"SIZE":1394,"LAT":40.774932861328125,"LONG":-73.98225402832031},{"CLUSTER_ID":18,"SIZE":89136,"LAT":40.77570724487305,"LONG":-73.98221015930176}]
```

## Data Sources

The original data sets are not public but similar can be found here:

* [NYC Taxi Trips](http://www.andresmh.com/nyctaxitrips/)
* [Uber Data](https://github.com/toddwschneider/nyc-taxi-data)
* [NYC Taxi & Limousine Commission](http://www.nyc.gov/html/tlc/html/about/trip_record_data.shtml)
