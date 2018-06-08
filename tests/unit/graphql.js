var should = require("chai").should();
var rewire = require('rewire');
var graphQL = rewire("../../models/graphql.js");
var settings = require("../../models/settings.js");
var sinon = require('sinon');
var _ = require('lodash');

var messageQuery = { body: '{message(id: "messageId") {createdBy {displayName id emailAddresses photoUrl} content id modifiedBy {displayName id emailAddresses photoUrl} created contentType annotations}}'}
var testResult = {key: "value"};
var fake = sinon.fake.resolves(testResult);
var graphQLUtils = graphQL.__get__("utils");
var fields = [
 {
   name: "createdBy",
   fields: [
     "displayName",
     "id",
     "emailAddresses",
     "photoUrl"
   ]
 },
 "content",
 "id",
 {
   name: "modifiedBy",
   fields: [
     "displayName",
     "id",
     "emailAddresses",
     "photoUrl"
   ]
 },
 "created",
 "contentType",
 "annotations"
];

describe('graphQL function', function() {
  it('get message', async function() {
    sinon.replace(graphQLUtils,"sendRequest", fake);
    var resp = await graphQL("message","messageId",fields);
    fake.lastArg.should.be.deep.equal(messageQuery);
    resp.should.be.deep.equal(testResult);
    sinon.restore();
  });
})
