var _ = require('lodash');
var Annotation = require('./annotation.js');
var utils = require('./utils.js');
var util = require('util');
var events = require('events');
var settings = require('./settings.js');

// Create an eventEmitter object
var emitter = new events.EventEmitter();

module.exports = class Action extends Annotation {
  constructor(obj) {
    super(obj);
    if (this.annotationType.endsWith('Selected'))
      this.operation = "selected";
    emitter.emit(this.operation,this);
  }

  static events() {
    return emitter;
  }

  isButton() {
    return this.actionId.startsWith(settings.buttonPrefix)
  }

  async sendTargettedMessage(cards) {
    var cardStructure = generateCards(cards,settings.buttonPrefix);

    var string = util.format(`mutation {
      createTargetedMessage(input: {
        conversationId: "%s"
        targetUserId: "%s"
        targetDialogId: "%s"
        attachments: %s
      }) {
        successful
      }
    }`, this.conversationId, this.userId, this.targetDialogId, cardStructure)
    var headers = {
      'Content-Type': 'application/graphql',
      'x-graphql-view': 'TYPED_ANNOTATIONS,BETA,PUBLIC'
    };
    return utils.sendRequest('graphql',"POST",headers,{body: string});
  }
}
/*
 * takes an array of cards which looks like:
  {
    type: 'INFORMATION',
    title: <string>,
    subtitle: <string>,
    text: <string>,
    date: <string>,
    buttons: [
      {
        text: <string>,
        payload: <string>,
        style: 'PRIMARY' || 'SECONDARY'
      }
    ]
  }
 */

function generateCards(cards) {
  if (!cards.hasOwnProperty("length"))
    cards = [cards];
  var results = [];
  cards.forEach(card => {
    var buttonArray = [];
    card.buttons.forEach(button => {
      var payload = button.payload;
      if (typeof button.payload === "object")
        payload = JSON.stringify(button.payload).replace(/\"/g,"\\\"");
      buttonArray.push(util.format(`{
                            text: "%s",
                            payload: "%s",
                            style: %s
                        }`,button.text,settings.buttonPrefix + payload,button.style));
    })
    results.push(util.format(`{
      type: CARD,
      cardInput: {
          type: %s,
          informationCardInput: {
              title: "%s",
              subtitle: "%s",
              text: "%s",
              date: "%s",
              buttons:  %s
          }
      }
    }`, card.type, card.title, card.subtitle, card.text, Date.now(), '[' + buttonArray.join(', ') + ']'));
  });
  return results;
}
