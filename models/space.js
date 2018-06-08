var _ = require('lodash');
var mustache = require('mustache')
var settings = require('./settings.js');
var NodeCache = require('node-cache');
var graphQL = require('./graphql.js');
var utils = require('./utils.js');
var events = require('events');
var Event = require('./event.js');
var imageSize = require('image-size')
var mime = require('mime-types');
var util = require('util');
var path = require('path');
var fs = require('fs');

// Create an eventEmitter object
var emitter = new events.EventEmitter();

cache = new NodeCache( { stdTTL: 600, checkperiod: 60, useClones: false } );

module.exports = class Space  extends Event {
  constructor(obj) {
    super(obj);
    if (this.type && this.type.startsWith('space-members')) {
      this.operation = this.type.substr(6);
    }
    cache.set(this.spaceId, this);
    emitter.emit(this.operation,this);
  }

  static events() {
    return emitter;
  }

  static async get(spaceId) {
    var space = cache.get(spaceId);
    if (space) {
      return space;
    } else {
      var resp = await graphQL("space",spaceId, settings.graphQL.fields.space);
      resp.data.space.spaceId = resp.data.space.id;
      delete resp.data.space.id;
      return new Space(resp.data.space);
    }
  }

  async sendFile(file, width, height) {
    const mimeType = mime.contentType(path.extname(file))
    var uri = 'v1/spaces/' + this.spaceId + '/files';

    if (width && height) {
      uri += `?dim=${width}x${height}`
    } else {
      const isImage = mimeType.toLowerCase().includes('image/')

      /* istanbul ignore else */
      if (isImage) {
        // figure out the dimensions and send full size
        const dim = imageSize(file)
        uri += `?dim=${dim.width}x${dim.height}`
      }
    }

    const options = {
      resolveWithFullResponse: false,
      formData: {
        file: {
          value: fs.createReadStream(file),
          options: {
            filename: path.parse(file).base,
            contentType: mimeType
          }
        }
      }
    }
    return await utils.sendRequest(uri,
      "POST",
      {
        'content-type': 'multipart/form-data'
      },
      options);
  }

  async sendMessage(message) {
      /* istanbul ignore else */
      if (typeof message === "string")
        message = {text: message};
      var annotation = _.merge(settings.messageDefaults,message);
      var res = await utils.sendRequest('v1/spaces/' + this.spaceId + '/messages',
        "POST",
        null,
        {
          body: {
            type: 'appMessage',
            version: 1.0,
            annotations: [ annotation ]
          }
        }
      );
      res.messageId = res.id;
      delete res.id;
      return res;
  }
}
