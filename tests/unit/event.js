var should = require("chai").should();
var Event = require("../../models/event.js");
var _ = require('lodash');
var utils = require('../utils.js');

var eventList = {
  'message-created': "create",
  'message-edited': "update",
  'space-members-removed': "delete",
  'space-deleted': "delete",
  'message-annotation-edited': "update",
  'reaction-added': "create",
  'message-deleted': "delete",
  'space-members-added': 'create',
  'space-updated': 'update',
  'message-annotation-added': 'create',
  'message-annotation-removed': 'delete',
  'reaction-removed': 'delete'
}

describe('Event class', function() {
  describe('SetOperation', function() {
    _.keys(eventList).forEach(eventName => {
      it(eventName, async function() {
        var event = new Event({
          type: eventName,
          time: Date.now()
        });
        event.operation.should.equal(eventList[eventName]);
      })
    });
  });
})
