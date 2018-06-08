var crypto = require('crypto');
var settings = require('../models/settings.js');

settings.AppID = "some_id";
settings.AppSecret = "some_secret";
settings.WebhookSecret = "some_other_secret";

module.exports.responseStub = class responseStub {
  constructor() {
    this.resp = {
      headers: {}
    }
  }

  set(arg1, arg2) {
    if (typeof arg1 === "object") {
      this.resp.headers = arg1;
    } else {
      this.resp.headers[arg1] = arg2;
    }
    return this;
  }

  status(val) {
    this.resp.status = val;
    return this;
  }

  send(body) {
    this.resp.body = body
    return this;
  }
}

module.exports.messageStub = class messageStub {
  applyAnnotation(obj) {
    return true;
  }

  removeFromCache(obj) {
    return true;
  }
}

module.exports.emitterStub = class emitterStub {
  constructor() {
    this.events = []
    this.listenerCount = {};
  }

  addListener(topic, count) {
    if (!this.listenerCount.hasOwnProperty(topic)) {
      this.listenerCount[topic] = [];
    }
    this.listenerCount[topic].push(count);
  }

  emit(topic, message) {
    this.events.push({
      topic: topic,
      message: message
    })
  }

  listeners(topic) {
    return this.listenerCount[topic]
  }
}

module.exports.generateEvent = function(body) {
  var rawBody = JSON.stringify(body);
  return({
    rawBody: rawBody,
    body: body,
    headers: {
      "x-outbound-token": crypto.createHmac("sha256", settings.WebhookSecret).update(rawBody).digest("hex")
    }
  });
}
