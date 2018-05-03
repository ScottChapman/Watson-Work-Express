var app = require('express')();
var bodyParser = require('body-parser');
var http = require('http').Server(app);
// var WWHandler = require("watson-work-express")();
var WWExpress = require("watson-work-express");

app.use(bodyParser.json());
app.use(bodyParser.text());
app.use(WWExpress.express());

WWExpress.setMessageDefaults(
  {
    title: "Hello World",
    actor: {
      name: "Hello World Bot"
    }
  }
)

app.post('/webhook', function(req, res){
  var event = req.body;
  if (event.type === "message-created") {
    if (event.content.toLowerCase().startsWith("hello world")) {
      WWExpress.sendMessage(event.spaceId, {
        text: "Hello yourself!"
      }).catch(err => {
        console.log("Failed to send message");
        console.dir(err);
      })
    }
  }
});

var port = process.env.PORT || 3030
http.listen(port, function(){
  console.log('listening on *:' + port);
});
