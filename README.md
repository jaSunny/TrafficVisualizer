# TrafficVisualizer

This repo contains an application, which visualizes the NYCCAB dataset with ~100m records by using a SAP HANA instance.

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
