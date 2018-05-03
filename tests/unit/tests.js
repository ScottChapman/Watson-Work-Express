var should = require("chai").should();
var fs = require("fs");
var rewire = require('rewire');
var WWExpress = rewire("../../index.js");
var nock = require("nock");
var util = require("../utils/utils.js");

WWExpress.__set__("AppID", "some_id");
WWExpress.__set__("AppSecret", "some_secret");
WWExpress.__set__("WebhookSecret", "some_other_secret");

var challenge = {
  type: "verification",
  challenge: "challenge_token"
};

var message = util.generateEvent(challenge,WWExpress.__get__("WebhookSecret"));

var authResp = JSON.parse(fs.readFileSync("../data/auth.json"));
var sentMessageResp = JSON.parse(fs.readFileSync("../data/created_message.json"));

describe('Watson Work Express Package', function() {
  describe('genToken', function() {
    it('should return refreshed token', function() {
      nock.cleanAll();
      var auth = nock("https://api.watsonwork.ibm.com")
      .post("/oauth/token")
      .once()
      .reply(200,authResp);
      return WWExpress.__get__("genToken")().then(resp => {
        resp.should.have.property("source","refresh");
      })
    });

    it('should return cached token', function() {
      return WWExpress.__get__("genToken")().then(resp => {
        resp.should.have.property("source","cache");
      })
    });

    it('should reject bad result', function() {
      WWExpress.__get__("resetToken")();
      var auth = nock("https://api.watsonwork.ibm.com")
      .post("/oauth/token")
      .once()
      .reply(401,{status: "failed"});
      return WWExpress.__get__("genToken")().catch(resp => {
        resp.body.should.have.property("status","failed");
      })
    });
  });

  describe("cleanUpEvent", function() {
    it('Should expand annotation', function() {
      var body = JSON.parse(fs.readFileSync("../data/keywords_annotation.json"));
      var message = util.generateEvent(body,WWExpress.__get__("WebhookSecret"));
      var resp = WWExpress.__get__("cleanUpEvent")(message.body);
      resp.annotationPayload.should.have.property("keywords");
    });
  })


  describe("expandEvent", function() {
    it('should return expanded annotation created event', function() {
      var body = JSON.parse(fs.readFileSync("../data/keywords_annotation.json"));
      var queryResponse = JSON.parse(fs.readFileSync("../data/graphql_response.json"));
      var message = util.generateEvent(body,WWExpress.__get__("WebhookSecret"));
      var auth = nock("https://api.watsonwork.ibm.com")
        .post("/oauth/token")
        .once()
        .reply(200,authResp);
      var graphql = nock("https://api.watsonwork.ibm.com")
        .post("/graphql")
        .once()
        .reply(200,queryResponse);
      return WWExpress.__get__("expandEvent")(message.body).then(resp => {
        resp.message.content.should.equal("This is a test");
      })
    });
  })

  describe("validateSender", function() {
    it ('should validate successfully', function () {
      var resp = WWExpress.__get__("validateSender")(message);
      resp.should.equal(true);
    })
  })

  describe("generateChallengeResponse", function() {
    it ('should generate expected response', function () {
      var resp = WWExpress.__get__("generateChallengeResponse")(message.body);
      var body = JSON.parse(resp.body);
      body.response.should.equal(challenge.challenge);
    })
  })

  describe("processEvent", function() {
    it ('fail validation', function () {
      WWExpress.__with__({
        validateSender: function() {
          return false
        }
      })(function () {
        WWExpress.__get__("processEvent")(message).catch(resp => {
          resp.statusCode.should.equal(400);
          resp.body.should.equal("Wrong Sender");
        })
      });
    })

    it ('Generate Challenge', function () {
      WWExpress.__with__({
        validateSender: function() {
          return true
        }
      })(function () {
        WWExpress.__get__("processEvent")(message).catch(resp => {
          resp.statusCode.should.equal(200);
          var body = JSON.parse(resp.body);
          body.response.should.equal(challenge.challenge);
        })
      });
    })

    it ('Process Event', function () {
      WWExpress.__with__({
        validateSender: function() {
          return true
        },
        cleanUpEvent: function (body) {
          return body;
        },
        expandEvent: function (body) {
          return Promise.resolve(body);
        }
      })(function () {
        message.body.type = "message_added";
        WWExpress.__get__("processEvent")(message).then(resp => {
          resp.event.should.deep.equal(challenge);
          resp.response.statusCode.should.equal(200);
        })
      });
    })

    it('should return Sent Message', function() {
      var auth = nock("https://api.watsonwork.ibm.com")
        .post("/v1/spaces/spaceID/messages")
        .once()
        .reply(201,sentMessageResp);
      return WWExpress.__get__("sendMessage")("spaceID",{}).then(resp => {
        resp.should.be.deep.equal(sentMessageResp);
      })
    });

    it('should fail Send Message', function() {
      var auth = nock("https://api.watsonwork.ibm.com")
        .post("/v1/spaces/spaceID/messages")
        .once()
        .reply(401,sentMessageResp);
      return WWExpress.__get__("sendMessage")("spaceID",{}).catch(resp => {
        resp.should.be.equal(401);
      })
    });
  })
})
