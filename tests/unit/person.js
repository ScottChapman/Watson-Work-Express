var chai = require('chai').use(require('chai-as-promised'));
var should = require("chai").should();
var rewire = require('rewire');
var Person = rewire("../../models/person.js");
var fs = require('fs');
var sinon = require('sinon');
var _ = require('lodash');
var utils = require('../utils.js');

var emitter = new utils.emitterStub();
Person.__set__("emitter", emitter);

var personResult = JSON.parse(fs.readFileSync(__dirname + '/../data/inbound/person.json'));
Person.__set__("graphQL", function() {
  return {
    data: {
      person: personResult
    }
  }
})

describe('Person class', function() {
  it('Constructor', function() {
    var space = new Person(personResult);
    space.should.be.an('object');
  });

  it('get cached', async function() {
    var space = await Person.get(personResult.id);
    space.should.be.an('object');
  });

  it('get uncached', async function() {
    var space = await Person.get("someotherId");
    space.should.be.an('object');
  });

  it('get using email', async function() {
    var space = await Person.get({email: personResult.email});
    space.should.be.an('object');
  });

  it('get using id', async function() {
    var space = await Person.get({id: personResult.id});
    space.should.be.an('object');
  });

  it('get using invalid key', function() {
    return Person.get({someonenamed: "homer"}).should.be.rejected;
  });

})
