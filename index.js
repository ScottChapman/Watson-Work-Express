var _ = require('lodash');
var request = require('request');
var mustache = require('mustache');
var factory = require('./models/factory.js');
var token = require('./models/token.js');
var Message = require('./models/message.js');
var Annotation = require('./models/annotation.js');
var Focus = require('./models/focus.js');
var Reaction = require('./models/reaction.js');
var Person = require('./models/person.js');
var Space = require('./models/space.js');
var Action = require('./models/action.js');
var Button = require('./models/button.js');
var Moment = require('./models/moment.js');
var graphQL = require('./models/graphql.js');
var settings = require('./models/settings.js');
var crypto = require('crypto');
var logger = require('winston');
var EventEmitter = require('events')

/* istanbul ignore next */
module.exports = class Express extends EventEmitter {
  constructor() {
    super();
    this.message = Message;
    this.annotation = Annotation;
    this.person = Person;
    this.graphQL = graphQL;
    this.space = Space;
    this.settings = settings;
    this.focus = Focus;
    this.reaction = Reaction;
    this.action = Action;
    this.button = Button;
    this.moment = Moment;
  }

  express(options) {
    options = options ? options : {};
    _.merge(settings,options)
    token.genToken();
    return async (req,res,next) => {
      let rawBody = '';
      req.on('data', chunk => {
          rawBody += chunk.toString();
      });
      req.on('end', () => {
        req.rawBody = rawBody
        try {
          req.body = JSON.parse(req.rawBody);
          processEvent(this,req,res).then(event => {
            req.body = event;
            next();
          })
        }
        catch (err) {
          logger.warn("Express Error: " + err.message);
          logger.debug(err);
        }
      });
    }
  }
}

async function processEvent(emitter, req,res) {
  var body = req.body;
  // console.log("*** Raw event ***");
  // console.log(JSON.stringify(body,null,2));
  // console.log("*** ***");
  /* istanbul ignore else */
  if (settings.WebhookSecret) {
    if (!validateSender(req)) {
      logger.warn("Wrong Sender...")
      // res.status(400).send("Wrong Sender");
      res.set("Content-Type","text/plain; charset=utf-8");
      res.status(400).send("Wrong Sender");
      throw new Error("Wrong Sender");
    }
    else {
      logger.debug("Correct sender");
      if (_.get(body, "type") === "verification") {
           console.debug("Responding to Challenge");
          var response = generateChallengeResponse(body);
          res.set({
            "X-OUTBOUND-TOKEN": response.token,
            "Content-Type": "text/plain; charset=utf-8"
          });
          res.status(200).send(response.body);
          throw new Error("Responded to challenge");
      } else {
        res.set("Content-Type","text/plain; charset=utf-8");
        res.status(200).send("Got Event!");
        var event = factory.build(body);
        if (event) {
          var topic = event.type;
          logger.debug("Emitting event on topic: " +topic);
          emitter.emit(topic,event);
          return event;
        }
        else {
          throw new Error("Unknown event: " + body.type);
        }
      }
    }
  } else {
    logger.error("No Webhook Secret set...")
    // res.status(400).send("No Webhook Secret set");
    res.set("Content-Type","text/plain; charset=utf-8");
    res.status().send("Missing Webhook Secret");
    throw new Error("No Webhook Secret set.");
  }
}

function generateChallengeResponse(reqBody) {
  var body = {
      response: reqBody.challenge
  };
  var strBody = JSON.stringify(body);
  var token = crypto.createHmac("sha256", settings.WebhookSecret).update(strBody).digest("hex");
  return {
    token: token,
    body: strBody
  }
}

function validateSender(req) {
    var ob_token = req.headers["x-outbound-token"];
    var calculated = crypto.createHmac("sha256", settings.WebhookSecret).update(req.rawBody).digest("hex");
    return ob_token == calculated;
}
