var should = require("chai").should();
var rewire = require('rewire');
var Annotation = rewire("../../models/annotation.js");
var fs = require('fs');
var _ = require('lodash');
var utils = require('../utils.js');

var emitter = new utils.emitterStub();
Annotation.__set__("emitter", emitter);
Annotation.__set__("Message", new utils.messageStub());

var annotationData = JSON.parse(fs.readFileSync(__dirname + '/../data/inbound/keywords_annotation.json'));

describe('Annotation class', function() {
  describe('Constructor', function() {
    it('keyword annotation', function() {
      var annotation = new Annotation(annotationData);
      annotation.should.be.an('object');
      var events = Annotation.events().events;
      events.length.should.equal(1);
      var event = events[0];
      event.should.have.property("topic","create");
    });
  });
})
