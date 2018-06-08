var token = require('./token.js');
var utils = require('./utils.js');
var _ = require('lodash');

module.exports = async(obj, query, fields) => {
  /* istanbul ignore else */
  if (fields instanceof Object)
    fields = asString(fields);
  /* istanbul ignore else */
  if (typeof query === "string") {
    query = {id: query}
    query = "{" + obj + "(" + _.keys(query)[0] + ": \"" + _.values(query)[0] + "\") {" + fields + "}}"
  }
  else {
    query = obj;
  }

  var headers = {
    'Content-Type': 'application/graphql',
    'x-graphql-view': 'TYPED_ANNOTATIONS,BETA,PUBLIC,EXPERIMENTAL'
  };

  return await utils.sendRequest(`graphql`, 'POST', headers, {body: query});
}

function asString(fields) {
  var str = "";
  fields.forEach((field) => {
    switch (typeof field) {
      case 'string':
        str += " " + field;
        break;
      case 'object':
        var key = field.name;
        var value = field.fields;
        str += " " + key + " {" + asString(value) + "}"
        break;
    }
  })
  return str.trim();
}
