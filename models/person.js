var _ = require('lodash');
var mustache = require('mustache')
var settings = require('./settings.js');
var NodeCache = require('node-cache');
var graphQL = require('./graphql.js');

idCache = new NodeCache( settings.cache );
emailCache = new NodeCache( settings.cache );

module.exports = class Person {
  constructor(obj) {
    Object.assign(this, obj)
    idCache.set(this.id,this);
    emailCache.set(this.email,this);
  }

  static async get(personId, fields) {
    /* istanbul ignore else */
    if (!fields) {
      fields = settings.graphQL.fields.person;
    }

    if (typeof personId === "object") {
      var key = _.keys(personId)[0].toLowerCase();
      var value = _.values(personId)[0];
      switch (key) {
        case "email":
          person = emailCache.get(value);
          break;
        case "id":
        case "personid":
          person = idCache.get(value);
          break;
        default:
          throw new Error("Unknown person ID key")
      }
      /* istanbul ignore else */
      if (person)
        return person;
    }
    else {
      var person = idCache.get(personId);
      if (person) {
        return person;
      }
    }
    var resp = await graphQL("person",personId,fields);
    var person = new Person(resp.data.person);
    return person;
  }
}
