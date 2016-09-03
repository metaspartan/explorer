var EventEmitter = require('events').EventEmitter;
var _ = require('underscore');

var PublicChannel = function(){
    EventEmitter.call(this);
    this.bind = this.addListener;
    this.unbind = this.removeListener;
    return this.initialize.apply(this, arguments);
};

_.extend(PublicChannel.prototype, EventEmitter.prototype, {

    /**
     * Constructor
     *
     * @param string name   Channel name
     * @param object pusher Pusher instance
     */
    initialize: function(name, pusher){
        this.name = name;
        this.pusher = pusher;
        this.subscribed = false;
        return this;
    },

    /**
     * Authorize channel
     *
     * @param string   socketId
     * @param function callback
     * @notice Skipped for public channels
     */
    authorize: function(socketId, callback){
        return callback(false, {});
    },

    /**
     * Trigger an event
     *
     * @param string event
     * @param object data (optional)
     * @return send result
     */
    trigger: function(event, data){
        return this.pusher.sendEvent(event, data, this.name);
    },

    /**
     * Handle disconnect. For internal use only.
     */
    disconnect: function(){
        this.subscribed = false;
    },

    /**
     * Handle incoming event. For internal use only.
     *
     * @param string event
     * @param object data (optional)
     */
    handleEvent: function(event, data){
        if(event.indexOf('pusher_internal:') === 0){
            if(event === 'pusher_internal:subscription_succeeded'){
                this.subscribed = true;
                this.emit('pusher:subscription_succeeded', data);
            }
        }else{
            this.emit(event, data);
        }
    }


});

module.exports = PublicChannel;