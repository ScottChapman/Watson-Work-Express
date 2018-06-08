module.exports = {
  AppID: process.env.APP_ID,
  AppSecret: process.env.APP_SECRET,
  WebhookSecret: process.env.WEBHOOK_SECRET,
  cache: {
    stdTTL: 120,
    checkperiod: 60,
    useClones: false
  },
  interval: 5000,
  baseUrl: 'https://api.watsonwork.ibm.com',
  buttonPrefix: "BUTTON_SELECTED: ",
  graphQL: {
    fields: {
      message: [
       "content",
       "id",
       "created",
       "contentType",
       {
         name: "createdBy",
         fields: [
           "displayName",
           "id",
           "emailAddresses",
           "photoUrl"
         ]
       },
       "annotations"
       ],
       person: [
         "displayName",
         "id",
         "email",
         "photoUrl"
       ],
       space: [
         "title",
         "description",
         "created",
         "id",
         "updated",
         {
           name: "updatedBy",
           fields: ["id"],
         },
         {
           name: "createdBy",
           fields: ["id"],
         },
         "membersUpdated",
         {
           name: "members",
           fields: [
             {
               name: "items",
               fields: [ "id" ]
             }
           ],
         }
      ]
    }
  },
  messageDefaults: {
    type: 'generic',
    version: 1.0,
    color: '#6CB7FB',
    title: "title",
    text: "text",
    actor: {
      name: 'Watson Work Bot'
    }
  }
}
