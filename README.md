# Watson-Work-Express [![Build Status](https://travis-ci.org/ScottChapman/Watson-Work-Express.svg?branch=master)](https://travis-ci.org/ScottChapman/Watson-Work-Express) [![Coverage Status](https://coveralls.io/repos/github/ScottChapman/Watson-Work-Express/badge.svg?branch=master)](https://coveralls.io/github/ScottChapman/Watson-Work-Express?branch=master)
[Watson Work](https://workspace.ibm.com/) Module for use with NodeJS Express. See [Developer Guide](https://developer.watsonwork.ibm.com/docs/get-started) for details on developing Watson Work Applications.
This package provides a number of objects, event sources, caching, and support functions to make it easier to develop Watson Work applications.

* Event
  * Message
  * Annotation
    * Action
      * Button
  * Focus
  * Reaction
* Space
* Person
* graphQL

## Install
```
npm install watson-work-express
```

## Use
```javascript
var WWExpress = require('watson-work-express');
var Express = new WWExpress();
...
app.use('/webhook', Express.express()); // add Watson Work Express Middleware
app.post('/webhook',(req,resp) => {
  // don't really need to do anything here, but you can inspect the req.body for raw events
})
...
```

`Express` method takes optional settings. See [settings](./models/settings) for all default values.

However if you just want to get the raw events (not using any classes), the `express` class is also a type of [EventEmitter](https://nodejs.org/api/events.html#events_class_eventemitter) with the event `type` as the topic:
###### Express as EventEmitter
EventEmitte for CRUD operations (create, update, delete)

```javascript
Express.on("message-annotation-added", annotation => {
  console.log("Annotation Added:")
  console.log(JSON.stringify(annotation,null,2));
});
```


### Event class
The event class is a base class for all the inbound events coming from the Watson Work outbound webhook mechanism. The class also creates a normalized `operation` property representing the standard CRUD operations for the event as appropriate.

### Message class
Messages are a type of Event and are cached per [settings](./models/settings.js#5).
###### static events()
EventEmitter for CRUD operations (create, update, delete)

```javascript
Express.message.events().on("create", message => {
  console.log("Message Created:")
  console.log(JSON.stringify(message,null,2));
});
```
There is also a special event `completed` which waits a specific [period of time](./models/settings.js#10) from when the message created event is recieved in order to allow all annotation events to be received and associated with the message. This is the best way to get the complete message (with annotations), but does require a delay in emitting the event.

###### static get(spaceId, messageId})
find a specific message in a specific spaces
```javascript
Express.message.get("somevalidspaceid", "somevalidmessageid").then(message => {
  console.log("Got Message:");
  console.log(JSON.stringify(message,null,2));
})
```

###### addFocus(phrase, lens, category, actions, payload, hidden = false)
Adds a focus annotation to a specific message. A Payload can be added to the focus containing and useful information for processing the focus later. Returns the the message with all annotations.
```javascript
message.addFocus("Express","MyLens","MyCategory","OneAction",{key: "value"}).then(message => {
  console.log("Focus created");
  console.log(JSON.stringify(message,null,2));
})
```
### Annotation class
The annotation class simplifies the structure of the raw Watson Work Annotation by JSON parsing the payload, and merging the payload properties with the annotation properties (so there is no longer a `annotationPayload` property).
###### static events()
EventEmitter for CRUD operations (create, update, delete)
```javascript
Express.annotation.events().on("create", annotation => {
  console.log("Annotation Created:")
  console.log(JSON.stringify(annotation,null,2));
});
```
### Focus class
Focus is a type of Annotation.
###### static events()
EventEmitter for CRUD operations (create, update, delete)
```javascript
Express.focus.events().on("create", focus => {
  console.log("Focus Created:")
  console.log(JSON.stringify(focus,null,2));
});
```
### Reaction class
Reaction is a type of Event.
###### static events()
EventEmitter for CRUD operations (create, update, delete)
```javascript
Express.reaction.events().on("create", reaction => {
  console.log("Reaction Created:")
  console.log(JSON.stringify(reaction,null,2));
});
```
### Space class
Space is a type of Event and are cached per [settings](./models/settings.js#5).
###### static events()
EventEmitter for CRUD operations (create, update, delete, members-added, members-removed)
```javascript
Express.space.events().on("update", space => {
  console.log("Space Updated:")
  console.log(JSON.stringify(space,null,2));
});
```
###### static get(spaceId})
find a specific spaces
```javascript
Express.space.get("somevalidspaceid").then(space => {
  console.log("Got Space:");
  console.log(JSON.stringify(space,null,2));
})
```
###### sendMessage(message)
Sends a message to the space. Message structure is ([default values](./models/settings.js#64)):
```javascript
{
    type: <string>, // currently 'generic' is only valid option
    version: <float>, // currently 1.0 is only valid option
    color: <hex color>,
    title: <string>,
    text: <string,
    actor: {
      name: <string>
    }
  }
```
###### sendFile(filename, width, height)
Sends a file to the space, width & height can be ignore if file is an image.
```javascript
  space.sendFile("picture.png").then(response => {
    console.log("Added file, response:")
    console.dir(response);
  })
})
```
### Action class
Actions are a type of Annotation, and are part of the [Action Fulfillment](https://developer.watsonwork.ibm.com/docs/tutorials/action-fulfillment) flow.
###### static events()
EventEmitter operations ('selected');
```javascript
Express.action.events().on("selected", action => {
  console.log("Action Selected:")
  console.log(JSON.stringify(action,null,2));
});
```
###### sendTargettedMessage(cards)
Responds to an action with an array of cards. Cards take the structure of:
```javascript
{
    type: 'INFORMATION',
    title: <string>,
    subtitle: <string>,
    text: <string>,
    date: <string>,
    buttons: [
      {
        text: <string>,
        payload: <string>,
        style: 'PRIMARY' || 'SECONDARY'
      }
    ]
  }
```
`payload` can be any kind of javascript type including an object. The payload will be available in the `Button` action when it is pressed.
###### isButton()
Returns true if the action is a button, false otherwise.

### Button class
Buttons are a kind of Action. They happen when a button on an action fulfillment card is pressed.
###### buttonPayload
Property that contains the payload specified when the button on the card was created as part of the targetted message.
###### static events()
EventEmitter for operations ('selected')
```javascript
Express.button.events().on("selected", button => {
  console.log("Button Selected:")
  console.log(JSON.stringify(button,null,2));
});
```
###### closeAction(cards)
used to complete the Action Fulfillment flow, you can provide any set of cards you want. The default is a single card with no buttons:
```javascript
{
  type: 'INFORMATION',
  title: 'Action Completed',
  text: "You can close this action.",
  buttons: []
};
```

## Example
See [Example](./example).
