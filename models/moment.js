var _ = require('lodash');
var Annotation = require('./annotation.js');
// Import events module
var events = require('events');

// Create an eventEmitter object
var emitter = new events.EventEmitter();

module.exports = class Moment extends Annotation {
  constructor(obj) {
    super(obj);
    emitter.emit(this.operation,this);
  }

  static events() {
    return emitter;
  }
}
