# Watson-Work-Express
[Watson Work](https://workspace.ibm.com/) Module for use with NodeJS Express. See [Developer Guide](https://developer.watsonwork.ibm.com/docs/get-started) for details on developing Watson Work Applications.

## Install
```
npm install watson-work-express
```

## Use
```
var WWHandler = require('watson-work-express');
...
app.use(WWHandler.express())
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
