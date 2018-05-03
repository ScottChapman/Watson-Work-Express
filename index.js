var crypto = require('crypto');
var _ = require('lodash');
var request = require('request');
var mustache = require('mustache');

var AppID = process.env.APP_ID;
var AppSecret = process.env.APP_SECRET;
var WebhookSecret = process.env.WEBHOOK_SECRET;

/* istanbul ignore next */
function express(credentials) {
  genToken();
  credentials = credentials ? credentials : {};
  AppID = credentials.AppID ? credentials.AppID : process.env.APP_ID;
  AppSecret = credentials.AppSecret ? credentials.AppSecret : process.env.APP_SECRET;
  WebhookSecret = credentials.WebhookSecret ? credentials.WebhookSecret : process.env.WEBHOOK_SECRET;
  return function (req,res,next) {
    processEvent(req).then(response => {
      sendResponse(res,response.response);
      req.body = response.event;
      next();
    }).catch(err => {
      sendResponse(res,err);
    })
  }
}
var messageDefaults = {
  type: 'generic',
  version: 1.0,
  color: '#6CB7FB',
  title: "title",
  text: "text",
  actor: {
    name: 'Watson Work Bot',
  }
}

function setMessageDefaults(def) {
  /* istanbul ignore next */
  _.merge(messageDefaults,def);
}

function sendMessage(spaceId, message) {
  return new Promise(function(success, failure) {
    /* istanbul ignore catch */
    genToken().then(token => {
      var annotation = _.merge(messageDefaults,message);
      request.post(
        'https://api.watsonwork.ibm.com/v1/spaces/' + spaceId + '/messages', {
          headers: {
            Authorization: 'Bearer ' + token.jwt
          },
          json: true,
          body: {
            type: 'appMessage',
            version: 1.0,
            annotations: [ annotation ]
          }
        }, (err, res) => {
          /* istanbul ignore next */
          if (err || res.statusCode !== 201) {
            failure(res.statusCode);
          }
          success(res.body);
        });
    }).catch(/* istanbul ignore next */err => {
      failure(err);
    })
  })
}

function graphQL(query) {
  return new Promise(function(success, failure) {
    genToken().then(token => {
      request.post(
        'https://api.watsonwork.ibm.com/graphql', {
          headers: {
            'Content-Type': 'application/graphql',
            'Authorization': 'Bearer ' + token.jwt,
            'x-graphql-view': 'TYPED_ANNOTATIONS,BETA,PUBLIC'
          },
          body: query
        }, (err, response) => {
          response.body = JSON.parse(response.body);
          /* istanbul ignore next */
          if (err || response.statusCode !== 200 || response.body.hasOwnProperty("errors")) {
            failure(response.body.errors);
          } else {
            success(response.body);
          }
        });
    }).catch(/* istanbul ignore next */ err => {
      failure(err);
    });
  });
}

function processEvent(req) {
  return new Promise((resolve,reject) => {
    /* istanbul ignore else */
    if (WebhookSecret) {
      // console.log("Inbound event");
      // console.log("Body: " + JSON.stringify(req.body));
      // console.log("Token: " + req.headers['x-outbound-token'] );

      if (!validateSender(req)) {
        // console.log("Wrong Sender...")
        // res.status(400).send("Wrong Sender");
        reject({
          statusCode: 400,
          headers: {
            "Content-Type": "text/plain; charset=utf-8"
          },
          body: "Wrong Sender"
        });
      }
      else {
        // console.log("Correct sender");
        if (_.get(req.body, "type") === "verification") {
            // console.log("Responding to Challenge");
            var response = generateChallengeResponse(req.body);
            // res.setHeader("X-OUTBOUND-TOKEN",response.token);
            // res.statusCode = 200;
            // res.setHeader("Content-Type","text/plain; charset=utf-8");
            // res.send(response.body);
            reject({
              statusCode: 200,
              headers: {
                "X-OUTBOUND-TOKEN": response.token,
                "Content-Type": "text/plain; charset=utf-8"
              },
              body: response.body
            });
        } else {
          expandEvent(cleanUpEvent(req.body)).then(event=> {
            // console.log("it's some kind of event");
            // console.log("Event: " + JSON.stringify(req.body));
            req.body = event;
            resolve({
              response: {
                statusCode: 200,
                headers: {
                  "Content-Type": "text/plain; charset=utf-8"
                },
                body: "Got Event"
              },
              event: event
            })
          }).catch( /* istanbul ignore next */ err => {
            // console.log("Some kind of error occured");
            // console.dir(err);
            reject({
              statusCode: 400,
              headers: {
                "Content-Type": "application/json"
              },
              body: {
                error: err,
                message: "Some kind of error occurred"
              }
            });
          });
        }
      }
    } else {
      // console.log("No Webhook Secret set...")
      // res.status(400).send("No Webhook Secret set");
      reject({
        statusCode: 400,
        headers: {
          "Content-Type": "text/plain; charset=utf-8"
        },
        body: "No Webhook Secret"
      });
    }
  });
}

/* istanbul ignore next */
function sendResponse(res,options) {
  res.set(options.headers);
  res.status(options.statusCode).send(options.body);
}

function generateChallengeResponse(reqBody) {
  var body = {
      response: reqBody.challenge
  };
  var strBody = JSON.stringify(body);
  var token = crypto.createHmac("sha256", WebhookSecret).update(strBody).digest("hex");
  return {
    token: token,
    body: strBody
  }
}

function validateSender(req) {
    var ob_token = req.headers["x-outbound-token"];
    var calculated = crypto.createHmac("sha256", WebhookSecret).update(JSON.stringify(req.body)).digest("hex");
    return ob_token == calculated;
}

var annotationGQL = {
    GraphQLExpansion: `
   query {
     message(id: "{{messageId}}") {
       content
       id
       created
       createdBy {
         displayName
         id
         emailAddresses
         photoUrl
       }
     }
   }`
};

var expansion = {
    "message-annotation-added": annotationGQL,
    "message-annotation-edited": annotationGQL,
    "message-annotation-removed": annotationGQL,
};

function expandEvent(body) {
  return new Promise((resolve, reject) => {
    // Check to see if there is an expansion GraphQL expression to run
    /* istanbul ignore else */
    if (body.hasOwnProperty("type") && expansion.hasOwnProperty(body.type)) {
      var exp = expansion[body.type];
      graphQL(mustache.render(exp.GraphQLExpansion, body)).then(resp => {
        resolve(_.merge(body, resp.data));
      })
    } else {
      resolve(body);
    }
  });
}

function cleanUpEvent(event) {
    // expand annotationPayload into JSON obejct if it exists.
    try {
      event.annotationPayload = JSON.parse(event.annotationPayload);
    }
    catch (/* istanbul ignore next */ e) {}

    // Cleanup time field
    /* istanbul ignore else */
    if (event.hasOwnProperty("time"))
      event.time = Date(event.time).toString();

    return event;
}

var currentToken;
var tokenExpiration = 0;

function genToken() {
  /* istanbul ignore next */
  if (!AppID || ! AppSecret) {
    Promise.reject("Missing AppID and/or AppSecret")
  }
  return new Promise((resolve, reject) => {
    if (tokenExpiration > Date.now())
      resolve({
          jwt: currentToken,
          source: "cache"
        });
    else {
      request.post('https://api.watsonwork.ibm.com/oauth/token', {
        auth: {
          user: AppID,
          pass: AppSecret
        },
        json: true,
        form: {
          grant_type: 'client_credentials'
        }
      }, (err, res) => {
        if (err || res.statusCode !== 200) {
          reject(err || res);
        } else {
          currentToken = res.body.access_token;
          tokenExpiration = Date.now() + (res.body.expires_in * 900);
          resolve({
            source: "refresh",
            jwt: currentToken
          });
        }
      })
    }
  });
}

function resetToken() {
  tokenExpiration = 0;
}

module.exports = {
  express: express,
  sendMessage: sendMessage,
  setMessageDefaults: setMessageDefaults,
  graphQL: graphQL
}
