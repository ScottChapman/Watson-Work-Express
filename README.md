# Watson-Work-Express [![Build Status](https://travis-ci.org/ScottChapman/Watson-Work-Express.svg?branch=master)](https://travis-ci.org/ScottChapman/Watson-Work-Express) [![Coverage Status](https://coveralls.io/repos/github/ScottChapman/Watson-Work-Express/badge.svg?branch=master)](https://coveralls.io/github/ScottChapman/Watson-Work-Express?branch=master)
[Watson Work](https://workspace.ibm.com/) Module for use with NodeJS Express. See [Developer Guide](https://developer.watsonwork.ibm.com/docs/get-started) for details on developing Watson Work Applications.

## Install
```
npm install watson-work-express
```

## Use
```
var WWHandler = require('watson-work-express');
...
app.use(WWHandler.express(<options>))
```

Express takes optional argument:
```
{
  AppID: <App_ID>,
  AppSecret: <AppSecret>,
  WebhookSecret: <WebhookSecret>
}
```

default values are obtained through environment variables:
* APP_ID
* APP_SECRET
* WEBHOOK_SECRET
