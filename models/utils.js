var request = require('request-promise');
var logger = require('winston');
var token = require('./token.js');
var settings = require('./settings.js')
var _ = require('lodash');

// controls the request-promise logging level; logs the raw req/res data
/* istanbul ignore next */
require('request-debug')(request, (type, data, r) => {
  if (logger.level === 'debug') {
    logger.debug(JSON.stringify(data, null, 2))
  }
})

module.exports = {

  /**
   * Sends a request to Watson Work Services.
   * If a POST body is set, it will be checked whether it is a string or Object.
   * If the body is an Object, the response is assumed to also be JSON.
   * @param {string} route The route e.g. spaces
   * @param {string} method HTTP method e.g. GET or POST
   * @param {Object} headers HTTP headers
   * @param {string|Object} [body] Optional HTTP body if POSTing
   * @returns {Promise<Object>} Promise containing the server response
   */
  sendRequest: async(route, method, headers, body) => {
    // add the auth header for convenience
    var jwt = await token.genToken();
    var options = {};

    if (!headers)
      headers = {};
    headers.Authorization = `Bearer ${jwt.jwt}`

    if (body.body) {
      options = {
        method: method,
        uri: `${settings.baseUrl}/${route}`,
        headers: headers,
        json: (typeof body.body) === 'object',
        body: body.body
      }
    }
    else {
      options = _.merge({
        method: method,
        uri: `${settings.baseUrl}/${route}`,
        headers: headers,
      },body)
    }

    logger.verbose(`${method} to '${route}'`)

    var resp = await request(options);
    /* istanbul ignore else */
    if (typeof resp === "string")
      resp = JSON.parse(resp);
    return resp;
  },
  timeout: ms => new Promise(res => setTimeout(res, ms))
}
