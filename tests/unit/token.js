var should = require("chai").should();
var fs = require("fs");
var token = require("../../models/token.js");
var nock = require("nock");
var utils = require('../utils.js');

var challenge = {
  type: "verification",
  challenge: "challenge_token"
};

var message = utils.generateEvent(challenge);

var authResp = JSON.parse(fs.readFileSync(__dirname + "/../data/auth.json"));

describe('Token class', function() {
  describe('genToken', function() {
    it('should return refreshed token', function() {
      nock.cleanAll();
      var auth = nock("https://api.watsonwork.ibm.com")
      .post("/oauth/token")
      .once()
      .reply(200,authResp);
      return token.genToken().then(resp => {
        resp.should.have.property("source","refresh");
      })
    });

    it('should return cached token', function() {
      return token.genToken().then(resp => {
        resp.should.have.property("source","cache");
      })
    });

    it('should reject bad result', function() {
      token.resetToken();
      var auth = nock("https://api.watsonwork.ibm.com")
      .post("/oauth/token")
      .once()
      .reply(401,{status: "failed"});
      return token.genToken().catch(resp => {
        resp.body.should.have.property("status","failed");
      })
    });
  });
})
