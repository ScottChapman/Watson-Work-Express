var _ = require('lodash');
var Annotation = require('./annotation.js');
// Import events module
var events = require('events');

// Create an eventEmitter object
var emitter = new events.EventEmitter();

module.exports = class Focus extends Annotation {
  constructor(obj) {
    super(obj);
    /* istanbul ignore else */
    if (this.payload) {
      try {
        this.payload = JSON.parse(this.payload);
      }
      catch(e) {}
    }
    emitter.emit(this.operation,this);
  }

  static events() {
    return emitter;
  }
}
