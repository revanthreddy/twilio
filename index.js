var express = require('express');
var app = express();
var server = require('http').createServer(app);
var http = require('http').Server(app);
var io = require('socket.io').listen(server);
server.listen(3000);
app.use(express.bodyParser());
//app.use(express.methodOverride());
var MongoClient = require('mongodb').MongoClient
var accountSid = 'AC3bf75f630d9132bcd7d03300527b0dd3';
var authToken = 'ea04068f880d019e46fb9ce1b19dfa09';
var path = require('path');

//require the Twilio module and create a REST client
var client = require('twilio')(accountSid, authToken);
var thresholdWeight = 100; //weight of the food bowl when food is present
var dataPushFrequency = 5; //data logged every 5 secs
var timeCheckLimit = 60/dataPushFrequency; //how far back we want to go
var minimumTimeBetweenEvents = 60000 ; // 1 min = 60000 milli seconds
var FOOD_SERVED = 1;
var FOOD_NOT_CONSUMED = 2;
var NO_EVENT = 0

app.use(express.cookieParser());
app.use(express.static(path.join(__dirname + '/public')));

app.use(app.router);

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');

});

app.get('/temp', function (req, res) {

  res.sendfile(__dirname + '/public/temp.html');

});


io.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
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

// app.post('/log', function (req, res) {
//
//   MongoClient.connect('mongodb://127.0.0.1:27017/smartbowl', function(err, db) {
//     if (err)
//     throw err;
//     var collection = db.collection('foodlog');
//     var jsonBody = req.body;
//     var newWeight = jsonBody.weight;
//     if(!newWeight)
//     newWeight = 0;
//
//     if(newWeight >= thresholdWeight){ //if weight more than threshold run the  logic
//       collection.find({"dog" : "boomer"}).sort({"log_entry" : -1}).limit(timeCheckLimit).toArray(function(err, records) {
//         if (err) {
//           console.log(err);
//           return res.status(400).send("Failed");
//         }
//         if(records.length == 0 ){
//           logFoodWeight(true ,newWeight);
//           sendFoodServedText();
//         }
//
//         for(var i = 0 ; i < records.length ; i++){
//             if(records[i].weight < thresholdWeight && i==0){ // if weight of the last data point is less than threshold just log it and text the user
//               sendFoodServedText();
//               logFoodWeight(true ,newWeight); //notification sent = true
//               break;
//             }else{  //if the weight is greater than the threshold
//
//             if(i == timeCheckLimit-1 && records[i].notified == true){
//
//               sendFoodNotConsumedText();
//               logFoodWeight(true ,newWeight);
//               break;
//             }
//             else if(i == records.length-1){
//               logFoodWeight(false ,newWeight);
//             }
//
//
//
//
//           }
//         }
//
//
//       });
//     }else{
//       //Log the bowl weight
//       logFoodWeight(false ,newWeight); //notification sent = false
//     }
//     return res.status(200).send("Data logged");
//   });
// });


/* Experiment */
app.post('/log', function (req, res) {

  MongoClient.connect('mongodb://127.0.0.1:27017/smartbowl', function(err, db) {
    if (err)
    throw err;
    var collection = db.collection('foodlog');
    var jsonBody = req.body;
    var newWeight = jsonBody.weight;
    if(!newWeight)
    newWeight = 0;

    if(newWeight >= thresholdWeight){ //if weight more than threshold run the  logic
      collection.find({"notified" : true}).sort({"log_entry" : -1}).limit(1).toArray(function(err, notifiedRecords) {
        if (err) {
          console.log(err);
          return res.status(400).send("Failed");
        }
        if(notifiedRecords.length == 0 ){
          logFoodWeight(true ,newWeight , FOOD_SERVED);
          sendFoodServedText();
        }else{
          var currentTime = new Date();
          var lastNotifiedTime = new Date(notifiedRecords[0].log_entry);


            collection.find().sort({"log_entry" : -1}).limit(1).toArray(function(err, records) {
              if (err) {
                console.log(err);
                return res.status(400).send("Failed");
              }
              if(records[0].weight > thresholdWeight){
                if((currentTime.getTime() - lastNotifiedTime.getTime()) < 60000 )
                  logFoodWeight(false , newWeight , NO_EVENT);
                else{
                  logFoodWeight(true , newWeight , FOOD_NOT_CONSUMED);
                  sendFoodNotConsumedText();
                }

              }
              else if(records[0].weight < thresholdWeight){
                logFoodWeight(true , newWeight , FOOD_SERVED);
                sendFoodServedText();
              }

            });


        }


      });
    }else{
      //Log the bowl weight
      logFoodWeight(false ,newWeight, NO_EVENT); //notification sent = false
    }
    return res.status(200).send("Data logged");
  });
});











app.get('/log', function (req, res) {

  MongoClient.connect('mongodb://127.0.0.1:27017/smartbowl', function(err, db) {
    if (err)
    throw err;
    var collection = db.collection('foodlog');
    var jsonBody = req.body;
    collection.find({"dog" : "boomer"}, {"log_entry" : 1 , "weight" : 1 , "notified" : 1}).sort({"log_entry" : -1}).limit(100).toArray(function(err, records) {
      if (err) {
        console.log(err);
        return res.status(400).send("Failed");
      }
      var logs = [];
      for(var i = records.length-1 ; i >= 0 ; i--){
        logs.push({"created" : new Date(records[i].log_entry) , "weight" : records[i].weight , "notified" : records[i].notified});
      }
      return res.status(200).send(logs);

    });
  });

});

function logFoodWeight(isNotified,weight , eventType){
  MongoClient.connect('mongodb://127.0.0.1:27017/smartbowl', function(err, db) {
    if (err)
    throw err;
    var collection = db.collection('foodlog');
    collection.insert({"dog" : "boomer" , "log_entry" : new Date() , "weight" : weight , "notified" : isNotified , "event" : eventType}, {safe: true}, function(err, numOfRecordsInserted) {
      if (err) {
        console.log(err);

      }
      //console.log("data logged for "+numOfRecordsInserted);

    });
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
