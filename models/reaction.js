var _ = require('lodash');
var Event = require('./event.js');
// Import events module
var events = require('events');

// Create an eventEmitter object
var emitter = new events.EventEmitter();

module.exports = class Reaction extends Event {
  constructor(obj) {
    super(obj);
    emitter.emit(this.operation,this);
  }

  static events() {
    return emitter;
  }
}
