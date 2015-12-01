client.exec('select * from NYCCAB.TRIP LIMIT 1', function (err, rows) {
    client.end();
    if (err) {
      return console.error('Execute error:', err);
    }
    console.log('Results:', rows);
  });