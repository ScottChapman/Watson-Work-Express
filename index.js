var crypto = require('crypto');
var _ = require('lodash');
var request = require('request');
var mustache = require('mustache');

module.exports = function(AppID, AppSecret,WebhookSecret) {
  AppID = AppID? AppID : process.env.APP_ID;
  AppSecret = AppSecret? AppSecret : process.env.APP_SECRET;
  WebhookSecret = WebhookSecret? WebhookSecret : process.env.WEBHOOK_SECRET;
  return function(req,res,next) {
    processEvent(AppID,AppSecret,WebhookSecret,req).then(response => {
      sendResponse(res,response.response);
      req.body = response.event;
      next();
    }).catch(err => {
      sendResponse(err.response);
    })
  }
}

function processEvent(AppID, AppSecret,WebhookSecret,req) {
  return new Promise((resolve,reject) => {
    if (WebhookSecret) {
      console.log("Inbound event");
      console.log("Body: " + JSON.stringify(req.body));
      console.log("Token: " + req.headers['x-outbound-token'] );

      if (!validateSender(req,WebhookSecret)) {
        console.log("Wrong Sender...")
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
        console.log("Correct sender");
        if (_.get(req.body, "type") === "verification") {
            console.log("Responding to Challenge");
            var response = generateChallengeResponse(req.body, WebhookSecret);
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
          expandEvent(cleanUpEvent(req.body), AppID, AppSecret).then(event=> {
            console.log("it's some kind of event");
            console.log("Event: " + JSON.stringify(req.body));
            req.body = event;
            resolve({
              response: {
                statusCode: 200,
                headers: {
                  "Content-Type": "application/json"
                },
                body: "Got Event"
              },
              event: event
            })
          }).catch(err => {
            console.log("Some kind of error occured");
            console.dir(err);
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
      console.log("No Webhook Secret set...")
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

function sendResponse(res,options) {
  res.set(options.headers);
  res.status(options.statusCode).send(options.body);
}

function generateChallengeResponse(reqBody, secret) {
  var body = {
      response: reqBody.challenge
  };
  var strBody = JSON.stringify(body);
  var token = crypto.createHmac("sha256", secret).update(strBody).digest("hex");
  return {
    token: token,
    body: strBody
  }
}

function validateSender(req, secret) {
    var ob_token = req.headers["x-outbound-token"];
    var calculated = crypto.createHmac("sha256", secret).update(JSON.stringify(req.body)).digest("hex");
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

function expandEvent(body,AppID,AppSecret) {
    return new Promise((resolve, reject) => {
      // Check to see if there is an expansion GraphQL expression to run
      if (body.hasOwnProperty("type") && expansion.hasOwnProperty(body.type)) {
        var exp = expansion[body.type];
        genToken(AppID,AppSecret).then(token => {
          request.post(
            'https://api.watsonwork.ibm.com/graphql', {
              headers: {
                'Content-Type': 'application/graphql',
                'Authorization': 'Bearer ' + token.jwt,
                'x-graphql-view': 'TYPED_ANNOTATIONS,BETA,PUBLIC'
              },
              body: mustache.render(exp.GraphQLExpansion, body)
            }, (err, response) => {
              response.body = JSON.parse(response.body);
              if (err || response.statusCode !== 200 || response.body.hasOwnProperty("errors")) {
                reject(response.body.errors);
              } else {
                resolve(_.merge(body, response.body.data));
              }
            });
          });
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
    catch (e) {}

    // Cleanup time field
    if (event.hasOwnProperty("time"))
      event.time = Date(event.time).toString();

    return event;
}

var currentToken;
var tokenExpiration = 0;

function genToken(AppID, AppSecret) {
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
