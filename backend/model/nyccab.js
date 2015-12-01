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

client.connect(function (err) {
  if (err) {
    return console.error('Connect error', err);
  }
  client.exec('select * from NYCCAB.TRIP LIMIT 1', function (err, rows) {
    client.end();
    if (err) {
      return console.error('Execute error:', err);
    }
    console.log('Results:', rows);
  });
});

//NYCCAB.getFirstEntry