var express = require('express');
var app = express();
var server = require('http').createServer(app);
server.listen(3000);
app.use(express.bodyParser());
//app.use(express.methodOverride());
var MongoClient = require('mongodb').MongoClient
var accountSid = 'AC3bf75f630d9132bcd7d03300527b0dd3';
var authToken = 'ea04068f880d019e46fb9ce1b19dfa09';

//require the Twilio module and create a REST client
var client = require('twilio')(accountSid, authToken);
var thresholdWeight = 100; //weight of the food bowl
var dataPushFrequency = 5; //data logged every 5 secs
var timeCheckLimit = 60/dataPushFrequency; //how far back we want to go

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

app.post('/log', function (req, res) {

  MongoClient.connect('mongodb://127.0.0.1:27017/smartbowl', function(err, db) {
    if (err)
    throw err;
    var collection = db.collection('foodlog');
    var jsonBody = req.body;
    var weight = jsonBody.weight;
    if(!weight)
    weight = 0;

    if(weight >= thresholdWeight){ //if weight more than threshold run the smart logic
      collection.find({"dog" : "boomer"}).sort({"log_entry" : -1}).limit(timeCheckLimit).toArray(function(err, records) {
        if (err) {
          console.log(err);
          return res.status(400).send("Failed");
        }

        console.log(records.length);
        var foodNotConsumed = false;
        var counter = 0;

        for(var i = 0 ; i < records.length ; i++){
            if(records[i].weight < thresholdWeight){
              sendFoodServedText();
              logFoodWeight(true); //notification sent = true
              break;
            }else{  //if the weight is greater than the threshold
              
                if(i == records.length-1){
                  sendFoodNotConsumedText();
                  break;
                }
            }
          }


      });
    }
    else{
    //Log the bowl weight
    logFoodWeight(false); //notification sent = false
    }
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

function logFoodWeight(isNotified){
  collection.insert({"dog" : "boomer" , "log_entry" : new Date() , "weight" : weight , "notified" : false}, {safe: true}, function(err, numOfRecordsInserted) {
    if (err) {
      console.log(err);
      return res.status(400).send("Failed");
    }
    return res.status(200).send("data logged for "+numOfRecordsInserted);

  });

}

function sendFoodServedText(weight){
  console.log("Food has been served ");
  // client.messages.create({
  //   to: "7138262502",
  //   from: "+17135974002",
  //   body: "Food is served to boomer.",
  // }, function(err, message) {
  //   console.log(message);
  // });
}

function sendFoodNotConsumedText(weight){
  console.log("Boomer did not eat his food");
  // client.messages.create({
  //   to: "7138262502",
  //   from: "+17135974002",
  //   body: "Food is served to boomer.",
  // }, function(err, message) {
  //   console.log(message);
  // });
}
