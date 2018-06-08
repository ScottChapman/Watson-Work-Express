var _ = require('lodash');

module.exports = class Event {
  constructor(obj) {
    Object.assign(this, obj );
    /* istanbul ignore else */
    if (this.time)
      this.time = new Date(this.time);
    /* istanbul ignore else */
    if (this.type)
      assignOperation(this);
  }
}

function assignOperation(event) {
  switch (true) {
    case (event.type.endsWith("created")):
    case (event.type.endsWith("added")):
      event.operation = "create";
      break;
    case (event.type.endsWith("edited")):
    case (event.type.endsWith("updated")):
      event.operation = "update";
      break;
    case (event.type.endsWith("removed")):
    case (event.type.endsWith("deleted")):
      event.operation = "delete";
      break;
  }
}
