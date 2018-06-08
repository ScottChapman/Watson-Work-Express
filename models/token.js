
var settings = require('./settings.js');
var request = require('request');

var currentToken;
var tokenExpiration = 0;
module.exports.genToken = function() {
  /* istanbul ignore next */
  if (!settings.AppID || ! settings.AppSecret) {
    Promise.reject("Missing AppID and/or AppSecret")
  }
  return new Promise((resolve, reject) => {
    if (tokenExpiration > Date.now())
      resolve({
          jwt: currentToken,
          source: "cache"
        });
    else {
      request.post('https://api.watsonwork.ibm.com/oauth/token', {
        auth: {
          user: settings.AppID,
          pass: settings.AppSecret
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

module.exports.resetToken = function() {
  tokenExpiration = 0;
}
