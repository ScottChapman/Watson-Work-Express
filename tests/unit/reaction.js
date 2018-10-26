var should = require("chai").should();
var rewire = require('rewire');
var Reaction = rewire("../../models/reaction.js");
var fs = require('fs');
var _ = require('lodash');
var utils = require('../utils.js');

var emitter = new utils.emitterStub();
Reaction.__set__("emitter", emitter);

var reactionData = JSON.parse(fs.readFileSync(__dirname + '/../data/inbound/reaction.json'));

describe('Focus class', function() {
  describe('Constructor', function() {
    it('thumbs up!', function() {
      var reaction = new Reaction(reactionData);
      reaction.should.be.an('object');
      var events = Reaction.events().events;
      events.length.should.equal(1);
      var event = events[0];
      event.should.have.property("topic","create");
    });
  });
})
