var express = require('express');
var app = express();
var server = require('http').createServer(app);
server.listen(3002);
app.use(express.bodyParser());
//app.use(express.methodOverride());
var accountSid = 'AC3bf75f630d9132bcd7d03300527b0dd3';
var authToken = 'ea04068f880d019e46fb9ce1b19dfa09';

//require the Twilio module and create a REST client
var client = require('twilio')(accountSid, authToken);

app.use(express.cookieParser());

app.use(express.static(__dirname + '/public/app'));
app.use(app.router);

app.get('/', function (req, res) {
    res.send("hello");
});

app.post('/send', function (req, res) {

  client.messages.create({
                to: "7138262502",
                from: "+17135974002",
                body: "Food is served to boomer.",
        }, function(err, message) {
                console.log(message);
                res.send("hello");
  });



});
