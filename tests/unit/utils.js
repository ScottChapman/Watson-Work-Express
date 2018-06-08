var should = require("chai").should();
var rewire = require('rewire');
var utils = rewire("../../models/utils.js");
var sinon = require('sinon');
var _ = require('lodash');
var Timer = require('timer-machine');
var stopwatch = new Timer();

var token = {
  jwt: "sometoken"
}
var fakeToken = sinon.fake.resolves(token);
var utilsToken = utils.__get__("token");
var fakeResponse = {key: "value"};
utils.__set__("request",sinon.fake.resolves(JSON.stringify(fakeResponse)));

describe('utilities', function() {
  it('sendRequest with body and headers', async function() {
    sinon.replace(utilsToken,"genToken", fakeToken);
    var resp = await utils.sendRequest("/v1/endpoint","GET",{head1: "value1"},{body: {key: "value"}});
    sinon.restore();
    resp.should.be.deep.equal(fakeResponse);
  });

  it('sendRequest without body or headers', async function() {
    sinon.replace(utilsToken,"genToken", fakeToken);
    var resp = await utils.sendRequest("/v1/endpoint","GET",null,"value");
    sinon.restore();
    resp.should.be.deep.equal(fakeResponse);
  });

  it('timeout', function() {
    stopwatch.start();
    utils.timeout(100).then(function() {
      stopwatch.stop();
      stopwatch.time().should.be.within(100,110);
    });
  });
})
