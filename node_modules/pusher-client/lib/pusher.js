var _ = require('underscore');
var EventEmitter2 = require('eventemitter2').EventEmitter2;
var defaultOptions = require('./options/default');
var Connection; // lazy loading due to dependencies on Pusher
var Channels; // lazy loading due to dependencies on Pusher

var Pusher = function(){
    Connection = require('./connection');
    Channels = require('./channels/channels');
    return this.initialize.apply(this, arguments);
};

_.extend(Pusher, {
    /**
     * Whether or not to autoconnect new instances
     */
    autoConnect: true,

    /**
     * Pusher logger. To receive log output provide a Pusher.log function
     * e.g. Pusher.log = function(m){console.log(m)}
     */
    debug: function(){
        if(!Pusher.log) return;
        Pusher.log.apply(Pusher.log, arguments);
    },

    /**
     * Pusher warnings logger
     */
    warn: function(){
        console.log.apply(console, arguments);
    }

});

_.extend(Pusher.prototype, {

    /**
     * Constructor
     *
     * @param string appKey  Pusher's unique app key
     * @param object options (optional)
     */
    initialize: function(appKey, options){
        var self = this;

        // Apply config
        if(!appKey) Pusher.warn('You must pass your app key when you instantiate Pusher.');
        this.key = appKey;
        this.config = _.extend({},
            defaultOptions,
            (options && options.cluster)? defaultOptions.cluster(options.cluster) : {},
            options || {}
        );

        // Initialize channels
        this.channels = new Channels();

        // Initialize global event emitter
        this.globalEmitter = new EventEmitter2();

        // Initialize socket to Pusher and handle incoming events
        this.connection = new Connection(this.key, this.config);
        this.connection.on('connected', function(){
            self.subscribeAll();
        });

        this.connection.on('message', function(params){
            if(params.channel){ // broadcast event on channel
                var channel = self.channel(params.channel);
                if(channel){
                    channel.handleEvent(params.event, params.data);
                }
            }

            if(params.event.indexOf('pusher_internal:') !== 0){ // broadcast globally (might be deprecated)
                self.globalEmitter.emit(params.event, params.data);
            }
        });

        this.connection.on('disconnected', function(){
            self.channels.disconnect();
        });

        this.connection.on('error', function(error){
            Pusher.warn('Error', error);
        });

        if(Pusher.autoConnect){
            this.connect();
        }

        return this;
    },

    /**
     * Connect to Pusher
     */
    connect: function(){
        this.connection.connect();
    },

    /**
     * Disconnect from Pusher
     */
    disconnect: function(){
        this.connection.disconnect();
    },

    /**
     * Find and return channel by name
     *
     * @return object or undefined
     */
    channel: function(name){
        return this.channels.find(name);
    },

    /**
     * Return a list of all channels
     *
     * @return array
     */
    allChannels: function(){
        return this.channels.list();
    },

    /**
     * Subscribe to all channels
     */
    subscribeAll: function(){
        var self = this;
        this.channels.each(function(channel){
            self.subscribe(channel.name);
        });
    },

    /**
     * Subscribe to a channel
     *
     * @param string channelName
     * @return object channel object
     */
    subscribe: function(channelName){
        var self = this;
        var channel = this.channels.add(channelName, this);
        if(this.connection.state === 'connected'){
            channel.authorize(this.connection.socket_id, function(error, data){
                if(error){
                    channel.handleEvent('pusher:subscription_error', data);
                }else{
                    self.sendEvent('pusher:subscribe', {
                        channel: channelName,
                        auth: data.auth,
                        channel_data: data.channel_data
                    });
                }
            });
        }
        return channel;
    },

    /**
     * Unsubscribe from a channel
     *
     * @param string channelName
     */
    unsubscribe: function(channelName){
        this.channels.remove(channelName);
        if(this.connection.state === 'connected'){
            this.sendEvent('pusher:unsubscribe', {
                channel: channelName
            });
        }
    },

    /**
     * Bind to a specific event regardless of channel
     *
     * @param string   event
     * @param function callback
     */
    bind: function(event, callback){
        this.globalEmitter.on(event, callback);
    },

    /**
     * Bind to all broadcast events. Use with care.
     *
     * @param function callback
     */
    bindAll: function(callback){
        this.globalEmitter.onAny(callback);
    },

    bind_all: function(){
        this.bindAll.apply(this, arguments);
    },

    /**
     * Broadcast data over socket. For internal use only.
     *
     * @param string name
     * @param object data (optional)
     * @param string channel (optional)
     * @return boolean
     */
    sendEvent: function(name, data, channel){
        return this.connection.sendEvent(name, data, channel);
    },

    /**
     * Return whether or not we're using SSL
     *
     * @return bool
     */
    isEncrypted: function(){
        return !!this.config.encrypted;
    }

});

module.exports = Pusher;
