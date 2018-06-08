var should = require("chai").should();
var rewire = require('rewire');
var Message = rewire("../../models/message.js");
var Annotation = require("../../models/annotation.js");
var fs = require('fs');
var _ = require('lodash');
var utils = require('../utils.js');
var logger = require('winston');

logger.level = 'error';

var annotationData = JSON.parse(fs.readFileSync('../data/inbound/keywords_annotation.json'));
var messageData = JSON.parse(fs.readFileSync('../data/inbound/created_message.json'));
var messageWithAnnotation = JSON.parse(fs.readFileSync('../data/inbound/keywords_annotation.json'));
var addFocus = JSON.parse(fs.readFileSync('../data/outbound/focus_added.json'));
messageWithAnnotation.annotations = [];
messageWithAnnotation.annotations.push(JSON.stringify(annotationData));

var userId = messageData.userId;

var emitter = new utils.emitterStub();
emitter.addListener("complete",1);
Message.__set__("emitter", emitter);
Message.__get__("settings").interval = 0;

function setGraphQLToMessageQuery() {
  Message.__set__("graphQL", function() {
    return {
      data: {
        message: messageWithAnnotation
      }
    }
  })
}

function setGraphQLToFocusAdded() {
  Message.__set__("graphQL", function() {
    return {
      data: {
        addMessageFocus: addFocus
      }
    }
  })
}

setGraphQLToMessageQuery();

describe('Message class', function() {

  it('message created', function(done) {
    delete messageData.userId;
    var message = new Message(messageWithAnnotation);
    message.should.be.an('object');
    setTimeout(function() {
      var events = Message.events().events;
      events.length.should.equal(2);
      var event = events[0];
      event.should.have.property("topic","create");
      var cached = Message.__get__("getCache")(messageData.spaceId).get(messageData.messageId);
      done();
    },1000)
  });

  it('addFocus', async function() {
    var message = new Message(messageData);
    setGraphQLToFocusAdded();
    var newMessage = await message.addFocus("Express","MyLens","MyCategory","OneAction",{key: "value"},false);
    newMessage.addMessageFocus.message.should.have.property("messageId",addFocus.message.messageId);
    setGraphQLToMessageQuery();
    return true;
  });

  it('addMessage', async function() {
    delete messageData.userId;
    var message = new Message(messageData);
    messageData.userId = userId;
    var tmp = new Message(messageData);
    var newMessage = await Message.get(messageData.spaceId, messageData.messageId)
    newMessage.should.have.property("userId",userId);
    return true;
  });

  it('apply annotation', async function() {
    var cached = Message.__get__("getCache")(messageData.spaceId).get(messageData.messageId);
    var annotation = new Annotation(annotationData);
    Message.applyAnnotation(annotation);
    var message = await Message.get(messageData.spaceId, messageData.messageId)
    message.annotations.length.should.equal(1);
  })

  it('apply same annotation', async function() {
    var cached = Message.__get__("getCache")(messageData.spaceId).get(messageData.messageId);
    var annotation = new Annotation(annotationData);
    Message.applyAnnotation(annotation);
    var message = await Message.get(messageData.spaceId, messageData.messageId)
    message.annotations.length.should.equal(1);
  })

  it('apply annotation to completed message', async function() {
    var cached = Message.__get__("getCache")(messageData.spaceId).get(messageData.messageId);
    cached.status = "Sent";
    var annotation = new Annotation(annotationData);
    Message.applyAnnotation(annotation);
    var message = await Message.get(messageData.spaceId, messageData.messageId)
    message.annotations.length.should.equal(1);
  })

  it('remove annotation', async function() {
    var message = await Message.get(messageData.spaceId, messageData.messageId)
    annotationData.type = "annotation-deleted";
    annotation = new Annotation(annotationData);
    delete message.annotations;
    Message.applyAnnotation(annotation);
    message = await Message.get(messageData.spaceId, messageData.messageId)
    message.annotations.length.should.equal(0);
  })

  it('message deleted event', function(done) {
    var type = messageData.type;
    messageData.type = "message_deleted";
    var message = new Message(messageData);
    var cached = Message.__get__("getCache")(messageData.spaceId).get(messageData.messageId);
    should.not.exist(cached);
    done();
  });

  it('flushCache', function(done) {
    Message.flushCache();
    var cache = Message.__get__("messageCache");
    _.keys(cache).length.should.equal(0);
    done();
  });

  it('get message not in cache', async function() {
    var message = await Message.get(messageData.spaceId, messageData.messageId)
    message.spaceName.should.equal(messageData.spaceName);
  });
})
