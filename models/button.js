var _ = require('lodash');
var Action = require('./action.js');
var utils = require('./utils.js');
var util = require('util');
var events = require('events');
var settings = require('./settings.js');

// Create an eventEmitter object
var emitter = new events.EventEmitter();

module.exports = class Button extends Action {
  constructor(obj) {
    super(obj);
    this.buttonPayload = this.actionId.substr(settings.buttonPrefix.length)
    try {
      this.buttonPayload = JSON.parse(action);
    }
    catch (e) {
    }
    emitter.emit(this.operation,this);
  }

  static events() {
    return emitter;
  }

  async closeAction(cards) {
    if (!cards)
      cards = {
        type: 'INFORMATION',
        title: 'Action Completed',
        text: "You can close this action.",
        buttons: []
      };

    return super.sendTargettedMessage(cards);
  }
}
