var _ = require('lodash');
var Event = require('./event.js');
var mustache = require('mustache');
var NodeCache = require('node-cache');
var token = require('./token.js');
var graphQL = require('./graphql.js');
var settings = require('./settings.js');
var utils = require('./utils.js');
var logger = require('winston');
var events = require('events');

var emitter = new events.EventEmitter();

var messageCache = {};

class Message extends Event {
  constructor(obj) {
    super(obj);

    /* istanbul ignore else */
    if (!this.annotations)
      this.annotations = [];

    var cached = getCache(this.spaceId).get(this.messageId);
    if (cached) {
      logger.warn("Cache already contains message.")
    }
    addMessage(this);
    /* istanbul ignore else */
    if (this.type) {
      emit(this);
      /* istanbul ignore else */
      if (emitter.listeners("complete").length > 0) {
        logger.debug("There is a completed message listener")
        delayMessageCompleted(this);
      }
      else {
        logger.debug("no message completed listener")
      }
    }
  }

  static async get(spaceId, messageId) {

    /* istanbul ignore next */
    if (!spaceId || !messageId)
      return Promise.reject("Missing argument to message.get");

    var fields = settings.graphQL.fields.message;
    var cache = getCache(spaceId);
    var message = cache.get(messageId);
    if (message) {
      return message;
    } else {
      var resp = await graphQL("message", messageId, fields);
      message = resp.data.message;
      message.messageId = messageId;
      message.spaceId = spaceId;
      delete message.id;
      /* istanbul ignore else */
      if (message.annotations) {
        message.annotations = _.map(message.annotations,JSON.parse);
      }
      return new Message(message);
    }
  }

  async addFocus (phrase, lens, category, actions, payload, hidden) {
    logger.verbose(`Adding message focus to message '${this.messageId}'`)

    var pos = this.content.indexOf(phrase);

    /* istanbul ignore else */
    if (typeof payload === "object")
      payload = JSON.stringify(payload).replace(/"/g,'\\"');

    const mutation = `mutation {addMessageFocus(input: {
      messageId: "${this.messageId}",
      messageFocus: {
        phrase: "${phrase}",
        lens: "${lens}",
        category: "${category}",
        actions: "${actions}",
        confidence: 0.99,
        payload: "${payload}",
        start: ${pos},
        end: ${pos + phrase.length},
        version: 1,
        hidden: ${hidden || false}
      }
    }){
      message {
        id
        annotations
    }}}`

    var resp = await graphQL(mutation);
    var annotations = [];
    resp.data.addMessageFocus.message.annotations.forEach(annotation => {
      annotations.push(JSON.parse(annotation));
    })
    resp.data.addMessageFocus.message.annotations = annotations;
    resp.data.addMessageFocus.message.messageId = resp.data.addMessageFocus.message.id;
    delete resp.data.addMessageFocus.message.id;
    return resp.data;
  }

  static applyAnnotation(annotation) {
    var message = getCache(annotation.spaceId).get(annotation.messageId);
    /* istanbul ignore else */
    if (message) {
      message.annotations = _.filter(message.annotations, existing => {
        return existing.annotationId !== annotation.annotationId
      })
      if (annotation.operation !== "delete") {
        if (annotation.annotationType === "generic" && message.content === "")
          message.content = annotation.text;
        message.annotations.push(annotation);
      }
      /* istanbul ignore else */
      if (message.status && message.status === "Sent") {
        logger.warn("Annotation (" + annotation.annotationId + ") added to message (" + message.messageId + ") already completed.")
      }
    }
    else {
      logger.warn("No message to add annotation to")
    }
  }

  static flushCache() {
    _.keys(messageCache).forEach(spaceId => {
      messageCache[spaceId].flushAll();
      delete messageCache[spaceId]
    })
    messageCache = {};
  }

  static events() {
    return emitter;
  }
}

function getCache(spaceId) {
  if (!messageCache.hasOwnProperty(spaceId))
    messageCache[spaceId] = new NodeCache( settings.cache );

  return messageCache[spaceId];
}

function addMessage(message) {
  var cache = getCache(message.spaceId);
  if (message.operation === "delete")
    cache.del(message.messageId);
  else
    cache.set(message.messageId, message);
}

async function delayMessageCompleted(event) {
  event.status = "Pending";
  /* istanbul ignore next */
  if (settings.interval > 0)
    await utils.timeout(settings.interval);
  var message = getCache(event.spaceId).get(event.messageId)
  if (!message) {
    logger.warn("Message deleted before completed timer expired");
  }
  else {
    message.status = "Sent";
    let clone = Object.assign( Object.create( Object.getPrototypeOf(message)), message)
    clone.annotations = _.values(message.annotations);
    logger.debug("emitting completed message")
    emitter.emit("complete",clone);
  }
}

function emit(obj) {
  emitter.emit(obj.operation,obj);
}

module.exports = Message;
