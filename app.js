var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bodyParser = require('body-parser');
var index = require('./routes/index');
var users = require('./routes/users');
var meeting = require('./routes/meeting');
var cors = require('cors');
var app = express();

app.use(cors());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.all('*', function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');
  res.header("Content-Type", "application/json;charset=utf-8");
  next();
});

app.use(session({
  //name: 'testapp', //这里的name值得是cookie的name，默认cookie的name是：connect.sid
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: false
  }, //设置maxAge是80000ms，即80s后session和相应的cookie失效过期
  secret: 'keyboardcat',
  resave: false,
  saveUninitialized: false
}));

app.use('/', index);
app.use('/users', users);
app.use('/meeting', meeting);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;