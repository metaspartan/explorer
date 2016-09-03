var _ = require('underscore');
var PublicChannel = require('./public');
var PrivateChannel = require('./private');
var PresenceChannel = require('./presence');

var Channels = function(){
    return this.initialize.apply(this, arguments);
};

_.extend(Channels.prototype, {

    /**
     * Constructor
     */
    initialize: function(){
        this.channels = {};
        return this;
    },

    /**
     * Create new channel or retrieve existing by its name
     *
     * @param string name       Channel name
     * @param object pusher     Pusher instance
     * @return channel object
     */
    add: function(name, pusher){
        if(!this.channels.hasOwnProperty(name)){
            this.channels[name] = this.createChannel(name, pusher);
        }
        return this.channels[name];
    },

    /**
     * Find a channel by its name
     *
     * @param string name  Channel name
     * @return channel object or undefined
     */
    find: function(name){
        if(this.channels.hasOwnProperty(name)){
            return this.channels[name];
        }
    },

    /**
     * Calls back for each channel in unspecified order
     *
     * @param function callback  e.g. each(function(channel){ ... })
     */
    each: function(callback){
        _.each(this.channels, callback);
    },

    /**
     * Return a list of all channels
     *
     * @return array
     */
    list: function(){
        return _.values(this.channels);
    },

    /**
     * Remove a channel from the map
     *
     * @param string name  Channel name
     */
    remove: function(name){
        if(this.channels.hasOwnProperty(name)){
            delete this.channels[name];
        }
    },

    /**
     * Proxies disconnection signal to all channels
     */
    disconnect: function(){
        _.each(this.channels, function(channel){
            channel.disconnect();
        });
    },

    /**
     * Create new channel
     *
     * @param string name    Channel name
     * @param object pusher  Pusher instance
     * @scope private
     */
    createChannel: function(name, pusher){
        if(name.indexOf('private-') === 0){
            return new PrivateChannel(name, pusher);
        }else if(name.indexOf('presence-') === 0){
            return new PresenceChannel(name, pusher);
        }else{
            return new PublicChannel(name, pusher);
        }
    }

});

module.exports = Channels;