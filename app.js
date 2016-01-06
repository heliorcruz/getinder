var express = require('express');
var app = express();
var tinder = require('./routes/tinder');
var path = require('path');

app.use(express.static(path.join(__dirname, 'public')));
app.use('/', tinder);

// catch 404 and forward to error handler 

app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
}); 

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});