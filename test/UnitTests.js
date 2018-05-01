var should = require("chai").should();
var fs = require("fs");
var rewire = require('rewire');
var WWExpress = rewire("../index.js");
var nock = require("nock");
var util = require("./utils/utils.js");

WWExpress.__set__("AppId", "some_id");
WWExpress.__set__("AppSecret", "some_secret");
WWExpress.__set__("WebhookSecret", "some_other_secret");

var challenge = {
  type: "verification",
  challenge: "challenge_token"
};

var message = util.generateEvent(challenge,WWExpress.__get__("WebhookSecret"));

var authResp = JSON.parse(fs.readFileSync("./data/auth.json"));

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
      var body = JSON.parse(fs.readFileSync("./data/keywords_annotation.json"));
      message = util.generateEvent(body,WWExpress.__get__("WebhookSecret"));
      var resp = WWExpress.__get__("cleanUpEvent")(message.body);
      resp.annotationPayload.should.have.property("keywords");
    });
  })


  describe("expandEvent", function() {
    it('should return expanded annotation created event', function() {
      var body = JSON.parse(fs.readFileSync("./data/keywords_annotation.json"));
      var queryResponse = JSON.parse(fs.readFileSync("./data/graphql_response.json"));
      message = util.generateEvent(body,WWExpress.__get__("WebhookSecret"));
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
});
