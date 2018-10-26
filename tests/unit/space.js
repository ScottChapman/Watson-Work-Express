var should = require("chai").should();
var rewire = require('rewire');
var Space = rewire("../../models/space.js");
var fs = require('fs');
var sinon = require('sinon');
var _ = require('lodash');
var utils = require('../utils.js');

var emitter = new utils.emitterStub();
Space.__set__("emitter", emitter);

var spaceUtils = Space.__get__("utils");
var memberAdded = JSON.parse(fs.readFileSync(__dirname + '/../data/inbound/member_added.json'));
var memberAddedResult = JSON.parse(fs.readFileSync(__dirname + '/../data/outbound/created_message.json'));
var sentImageResult = JSON.parse(fs.readFileSync(__dirname + '/../data/outbound/sent_image.json'));
var fakeSentMessage = sinon.fake.resolves(memberAddedResult);
var fakeSentImage = sinon.fake.resolves(sentImageResult);
Space.__set__("graphQL", function() {
  return {
    data: {
      space: memberAddedResult
    }
  }
})

describe('Space class', function() {
  it('member-added', function() {
    var space = new Space(memberAdded);
    space.should.be.an('object');
    var events = Space.events().events;
    events.length.should.equal(1);
    var event = events[0];
    event.should.have.property("topic","members-added");
  });

  it('get cached', async function() {
    var space = await Space.get(memberAdded.spaceId);
    space.should.be.an('object');
  });

  it('get uncached', async function() {
    var space = await Space.get("someotherId");
    space.should.be.an('object');
  });

  it('sendMessage', async function() {
    var space = await Space.get(memberAdded.spaceId);
    sinon.replace(spaceUtils,"sendRequest",fakeSentMessage);
    var message = await space.sendMessage("hi there");
    sinon.restore();
    message.should.be.an('object');
  });

  it('sendFile default size', async function() {
    var space = await Space.get(memberAdded.spaceId);
    sinon.replace(spaceUtils,"sendRequest",fakeSentImage);
    var result = await space.sendFile(__dirname + "/../data/inbound/blank.jpeg");
    sinon.restore();
    result.should.be.an('object');
  });

  it('sendFile specific size', async function() {
    var space = await Space.get(memberAdded.spaceId);
    sinon.replace(spaceUtils,"sendRequest",fakeSentImage);
    var result = await space.sendFile(__dirname + "/../data/inbound/blank.jpeg",185,189);
    sinon.restore();
    result.should.be.an('object');
  });
})
