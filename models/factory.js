  var Message = require('./message.js')
  var Annotation = require('./annotation.js')
  var Action = require('./action.js');
  var Button = require('./button.js');
  var Focus = require('./focus.js')
  var Reaction = require('./reaction.js');
  var Space = require('./space.js');
  var Moment = require('./moment.js');
  var settings = require('./settings.js')

  module.exports.build = function(obj) {
    if (obj.type.startsWith("message-annotation")) {
      if (obj.annotationType === "message-focus")
        return new Focus(obj);
      else if (obj.annotationType === "actionSelected") {
        var payload = JSON.parse(obj.annotationPayload);
        if (payload.actionId.startsWith(settings.buttonPrefix))
          return new Button(obj);
        else
          return new Action(obj);
      }
      else if (obj.annotationType === "conversation-moment")
        return new Moment(obj);
      else
        return new Annotation(obj);
    } else if (obj.type.startsWith("message-")) {
      return new Message(obj);
    } else if (obj.type.startsWith('reaction-')) {
      return new Reaction(obj);
    } else if (obj.type.startsWith('space-')) {
      return new Space(obj);
    }
  }
