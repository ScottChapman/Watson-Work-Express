var should = require("chai").should();
var rewire = require('rewire');
var Focus = rewire("../../models/focus.js");
var fs = require('fs');
var _ = require('lodash');
var utils = require('../utils.js');

var emitter = new utils.emitterStub();
Focus.__set__("emitter", emitter);

var focusData = JSON.parse(fs.readFileSync('../data/inbound/focus_added.json'));

describe('Focus class', function() {
  describe('Constructor', function() {
    it('Question', function() {
      var focus = new Focus(focusData);
      focus.should.be.an('object');
      var events = Focus.events().events;
      events.length.should.equal(1);
      var event = events[0];
      event.should.have.property("topic","create");
    });
  });
})
