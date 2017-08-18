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

app.use(cors({
  origin: [
    'https://192.168.20.211:18081',
    'http://192.168.20.211:18082',
    'https://61.164.221.4:18081',
    'http://localhost:4200',
    'https://localhost:4200'
  ],
  credentials: true,
  methods: ['GET', 'POST'],
  optionsSuccessStatus: 200
}));


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


app.use(session({
  //name: 'testapp', //这里的name值得是cookie的name，默认cookie的name是：connect.sid
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: false
  }, //设置maxAge是80000ms，即80s后session和相应的cookie失效过期
  secret: 'keyboard cat',
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