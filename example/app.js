var app = require('express')();
var bodyParser = require('body-parser');
var http = require('http').Server(app);
var _ = require('lodash');
var WWExpress = require("watson-work-express");
var Express = new WWExpress();
var logger = require('winston');

logger.configure({
  transports: [
    new logger.transports.Console(
      {
        level: 'debug',
        prettyPrint: true,
        colorize: true
      })
  ]
})
app.use('/webhook', Express.express()); // add Watson Work Express Middleware

// Set defaults for send Message
Express.settings.messageDefaults = _.merge(Express.settings.messageDefaults,
  {
    title: "Hello World",
    actor: {
      name: "Hello World Bot"
    }
  }
);

// Listen for "Hello World" messages, and respond with "Hello yourself!"
app.post('/webhook', function(req, res){
  /*
  You still need a POST route, but you don't need to do anything in it...
  */
});

var port = process.env.PORT || 3030
http.listen(port, function(){
  console.log('listening on *:' + port);
});

Express.message.events().on("complete", async message => {
  console.log("Message completed:")
  console.log(JSON.stringify(message,null,2));
  var resp = await message.addFocus("Express","MyLens","MyCategory","OneAction",{key: "value"},false);
  console.log("Added focus");
});

Express.message.events().on("create", message => {
  console.log("Message Created:")
  console.log(JSON.stringify(message,null,2));
});

Express.focus.events().on("create", focus => {
  console.log("focus Created:");
  console.log(JSON.stringify(focus,null,2));
})

Express.action.events().on("create", action => {
  console.log("action Created:");
  console.log(JSON.stringify(action,null,2));
})

Express.action.events().on("selected", async action => {
  if (!action.isButton()) {
    console.log("Action Selected:");
    console.dir(action);
    var result = await action.sendTargettedMessage(
    {
      type: 'INFORMATION',
      title: "some title",
      subtitle: "sone subtitle",
      text: "text message",
      date: Date.now(),
      buttons: [
        {
          text: "First Button",
          payload: "My Payload",
          style: 'PRIMARY'
        },
        {
          text: "Second Button",
          payload: {text: "My Payload"},
          style: 'SECONDARY'
        }
      ]
    } )
    console.dir(result);
  }
})

Express.button.events().on("selected", async button => {
  console.log("Button selected");
  console.dir(button);
  button.closeAction();
})
