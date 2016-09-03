var EventEmitter = require('events').EventEmitter;
var sinon = require('sinon');

var PublicChannel = function(name){
    EventEmitter.call(this);
    this.bind = this.addListener;
    this.unbind = this.removeListener;
    this.name = name;

    this.authorize = sinon.spy();
    this.disconnect = sinon.spy();
    this.handleEvent = sinon.spy();
};
PublicChannel.prototype = EventEmitter.prototype;
PublicChannel.prototype.initialize = sinon.spy();

module.exports = PublicChannel;