var express = require('express');
var app = express();
var server = require('http').createServer(app);
server.listen(3002);
app.use(express.bodyParser());
//app.use(express.methodOverride());
var MongoClient = require('mongodb').MongoClient
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

  MongoClient.connect('mongodb://127.0.0.1:27017/smartbowl', function(err, db) {
    if (err)
    throw err;
    var collection = db.collection('foodlog');
    var jsonBody = req.body;
    var weight = jsonBody.weight;
    if(!weight)
      weight = 99;
    collection.insert({"dog" : "boomer" , "log_entry" : new Date() , "weight" : "100"}, {safe: true}, function(err, records) {
      if (err) {
        console.log(err);
        return res.status(400).send("Failed");
      }
      sendText(weight);
      return res.send("data logged");

    });
  });


});

app.get('/log', function (req, res) {

  MongoClient.connect('mongodb://127.0.0.1:27017/smartbowl', function(err, db) {
    if (err)
    throw err;
    var collection = db.collection('foodlog');
    var jsonBody = req.body;
    collection.find({"dog" : "boomer"}).sort({"log_entry" : -1}).toArray(function(err, records) {
      if (err) {
        console.log(err);
        return res.status(400).send("Failed");
      }


      return res.send(records);

    });
  });

});



function sendText(weight){

  MongoClient.connect('mongodb://127.0.0.1:27017/smartbowl', function(err, db) {
    if (err)
    throw err;
    var collection = db.collection('foodlog');
    var jsonBody = req.body;
    collection.find({"dog" : "boomer"}).sort({"log_entry" : -1}).limit(12).toArray(function(err, records) {
      if (err) {
        console.log(err);

      }


    });
  });


  // client.messages.create({
  //   to: "7138262502",
  //   from: "+17135974002",
  //   body: "Food is served to boomer.",
  // }, function(err, message) {
  //   console.log(message);
  // });



}
