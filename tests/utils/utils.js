var crypto = require('crypto');

exports.generateEvent = function(body,secret) {
  var message = {
  }
  return({
    body: body,
    headers: {
      "x-outbound-token": crypto.createHmac("sha256", secret).update(JSON.stringify(body)).digest("hex")
    }
  });
}
