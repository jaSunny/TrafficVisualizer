-- get grid for # rides and avg rate per mile for given time and coordinates

SELECT ST_ClusterID() AS cluster_id,
	ST_ClusterEnvelope().ST_Centroid().ST_X() AS cluster_x,
	ST_ClusterEnvelope().ST_Centroid().ST_Y() AS cluster_y,
	COUNT(*) AS rides,
	AVG(f.TOTAL / t.DISTANCE) as rate
FROM "NYCCAB"."TRIP_SPATIAL_ANNOTATED" t
JOIN "NYCCAB"."FARE" f
	ON t.MEDALLION = f.MEDALLION
	AND t.DRIVER = f.DRIVER
	AND t.PICKUP_TIME = f.PICKUP_TIME
WHERE TO_DATE(t.PICKUP_TIME) >= '2010-06-01'
	AND TO_DATE(t.PICKUP_TIME) <= '2010-06-30'
	AND t.DISTANCE > 0
	AND (f.TOTAL / t.DISTANCE) < 100
	AND (f.TOTAL / t.DISTANCE) > 1
	AND PICKUP.ST_WITHIN('POLYGON((40.69664826715396 -74.02656555175781,40.728397037445035 -74.02656555175781,40.728397037445035 -73.96459579467773,40.69664826715396 -73.96459579467773,40.69664826715396 -74.02656555175781))') = 1
GROUP CLUSTER BY PICKUP
	USING GRID
	X BETWEEN 40.69664826715396 AND 40.728397037445035 CELLS 10
	Y BETWEEN -74.02656555175781 AND -73.96459579467773 CELLS 10
ORDER BY cluster_id;


