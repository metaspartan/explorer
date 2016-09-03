var EventEmitter = require('events').EventEmitter;
var sinon = require('sinon');

var Connection = function(){
    EventEmitter.call(this);
    this.bind = this.addListener;
    this.unbind = this.removeListener;
};
Connection.prototype = EventEmitter.prototype;
Connection.prototype.initialize = sinon.spy();
Connection.prototype.connect = sinon.spy();
Connection.prototype.disconnect = sinon.spy();
Connection.prototype.sendEvent = sinon.stub().returns(true);
Connection.prototype.close = sinon.spy();

module.exports = Connection;