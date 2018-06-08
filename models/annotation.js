var _ = require('lodash');
var Event = require('./event.js');
var Message = require('./message.js');
// Import events module
var events = require('events');

// Create an eventEmitter object
var emitter = new events.EventEmitter();

module.exports = class Annotation extends Event {
  constructor(obj) {
    super(obj);
    try {
      obj.annotationPayload = JSON.parse(obj.annotationPayload);
    }
    catch(e) {}
    Object.assign(obj,obj.annotationPayload,this)
    Object.assign(this,obj)
    delete this.annotationPayload;

    emitter.emit(this.operation,this);
    Message.applyAnnotation(this);
  }

  static events() {
    return emitter;
  }
}
