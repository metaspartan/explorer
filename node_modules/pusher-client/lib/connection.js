var EventEmitter = require('events').EventEmitter;
var _ = require('underscore');
var WebSocket = require('ws');
var Pusher = require('./pusher');
var Message = require('./message');
var appPackage = require('../package.json');

var Connection = function(){
    EventEmitter.call(this);
    this.bind = this.addListener;
    this.unbind = this.removeListener;
    return this.initialize.apply(this, arguments);
};
_.extend(Connection.prototype, EventEmitter.prototype, {

    /**
     * Constructor
     *
     * @param string appKey  Pusher's unique app key
     * @param object config (optional)
     */
    initialize: function(appKey, config){

        // Apply config
        this.key = appKey;
        this.config = config || {};
        this.encrypted = !!config.encrypted;
        this.setActivityTimeout(config.activityTimeout);

        // Initialize connection state and connect
        this.state = 'initialized';
        this.socket_id = null;
        this.connection = null;
        this.connectionCallbacks = this.buildConnectionCallbacks();

        return this;
    },

    /**
     * Connect to Pusher socket
     */
    connect: function(){

        // Return if already connected or connecting
        if(this.connection) return;
        if(this.state === 'connecting') return;

        // Create new connection
        var url = this.connectionUrl();
        var connection = new WebSocket(url, { protocolVersion: 13 });
        Pusher.debug('Connecting', { url: url });
        this.handshake(connection);
        this.updateState('connecting');
        this.setUnavailableTimeout();
    },

    /**
     * Disconnect from Pusher socket
     */
    disconnect: function(){
        this.clearRetryIn();
        this.clearUnavailableTimeout();
        this.clearActivityCheck();
        this.updateState('disconnected');
        if(this.connection){
            this.connection.close();
            this.abandonConnection();
        }
    },

    /**
     * Handle connection handshake
     * First event after connection should be "pusher:connection_established"
     *
     * @param connection  WebSocket instance
     */
    handshake: function(connection){
        var removeListeners = function(){
            connection.removeAllListeners();
        };

        var messageCallback = function(message){
            removeListeners();
            try{
                var result = Message.decodeMessage(message);
                if(result.event === 'pusher:connection_established'){
                    this.setActivityTimeout(result.data.activity_timeout * 1000);
                    this.clearRetryIn();
                    this.clearUnavailableTimeout();
                    this.setConnection(connection);
                    this.socket_id = result.data.socket_id;
                    this.updateState('connected');
                }else if(result.event === 'pusher:error'){
                    this.handleError(result.data.code, result.data.message);
                }
            }catch(e){
                this.emit('error', { type: 'MessageParseError', error: e, data: message });
            }
        }.bind(this);
        connection.on('message', messageCallback);

        var errorCallback = function(message){
            removeListeners();
            this.handleError(message.code, message.syscall);
        }.bind(this);
        connection.on('error', errorCallback);

        var closeCallback = function(code, message){
            removeListeners();
            this.handleError(code, message);
        }.bind(this);
        connection.on('close', closeCallback);
    },

    /**
     * Handle Pusher / connection errors
     *
     * @param string|int code
     * @param string message
     */
    handleError: function(code, message){
        if(code < 4000) {
            // ignore 1000 CLOSE_NORMAL, 1001 CLOSE_GOING_AWAY,
            //        1005 CLOSE_NO_STATUS, 1006 CLOSE_ABNORMAL
            // ignore 1007...3999
            // handle 1002 CLOSE_PROTOCOL_ERROR, 1003 CLOSE_UNSUPPORTED,
            //        1004 CLOSE_TOO_LARGE
            if (code >= 1002 && code <= 1004) {
                this.retryIn(1000, true);
            }
        }else if(code === 4000) {
            // ssl required. unlike client library, don't switch to SSL
            this.disconnect();
        } else if (code < 4100) {
            // refused
            this.disconnect();
        } else if (code < 4200) {
            // backoff
            this.retryIn(1000, true);
        } else if (code < 4300) {
            // retry immediately
            this.retryIn(0);
        } else {
            // unknown error
            this.disconnect();
        }

        if(isNaN(code)){
            this.emit('error', { type: 'WebSocketError', error: 'Unknown socket error: ' + code + ' ' + message });
        }else{
            this.emit('error', { type: 'WebSocketError', error: message });
        }
    },

    /**
     * Handle successful connect
     *
     * @param object connection  WebSocket instance
     * @scope private
     */
    setConnection: function(connection){
        this.connection = connection;
        for(var event in this.connectionCallbacks){
            connection.addEventListener(event, this.connectionCallbacks[event]);
        }
        this.resetActivityCheck();
    },

    /**
     * Cleanup connection
     *
     * @scope private
     */
    abandonConnection: function(){
        if(!this.connection) return;
        for(var event in this.connectionCallbacks){
            this.connection.removeListener(event, this.connectionCallbacks[event]);
        }
        this.connection = null;
    },

    /**
     * Broadcast data over socket
     *
     * @param string name
     * @param object data (optional)
     * @param string channel (optional)
     * @return boolean
     */
    sendEvent: function(name, data, channel){
        if(this.connection){
            var message = Message.prepare(name, data, channel);
            Pusher.debug('Event sent', message);
            this.connection.send(message);
            return true;
        }else{
            return false;
        }
    },

    /**
     * Generate connection url based on config options
     *
     * @return string e.g. "wss://ws.pusherapp.com:443/app/abc123456?client=node-client&version=0.0.1&protocol=6"
     */
    connectionUrl: function(){
        var protocol = this.encrypted? 'wss://' : 'ws://';
        var port = this.encrypted? this.config.wssPort : this.config.wsPort;
        var params = '?client=node-client&version=' + appPackage.version + '&protocol=' + this.config.protocol;
        var url = protocol + this.config.host + ':' + port + '/app/' + this.key + params;
        return url;
    },

    /**
     * Find out if we should try to reconnect after "disconnect"
     *
     * @return bool
     */
    shouldRetry: function(){
        return this.state === 'connecting' || this.state === 'connected';
    },

    /**
     * Retry reconnect after timeout
     *
     * @param int  delay    Delay in milliseconds
     * @param bool backoff  True to increase delay on each retry
     */
    retryIn: function(delay, backoff){
        var self = this;

        if(!delay) delay = 0;
        if(backoff){
            delay = delay * self.retryInMultiplier;
            self.retryInMultiplier++;
        }
        if(delay > 0) self.emit('connecting_in', Math.round(delay / 1000));

        clearTimeout(this.retryInTimeout);
        self.retryInTimeout = setTimeout(function(){
            self.disconnect();
            self.connect();
        }, delay);
    },

    /**
     * Clear timeout set by retryIn
     */
    clearRetryIn: function(){
        this.retryInMultiplier = 1;
        clearTimeout(this.retryInTimeout);
    },

    /**
     * Start timeout for connection
     * Triggers "unavailable" state if not cancelled before timeout.
     */
    setUnavailableTimeout: function(){
        var self = this;
        self.clearUnavailableTimeout();
        self.unavailableTimeout = setTimeout(function(){
            self.updateState('unavailable');
        }, self.config.unavailableTimeout);
    },

    /**
     * Clear timeout set by setUnavailableTimeout
     */
    clearUnavailableTimeout: function(){
        clearTimeout(this.unavailableTimeout);
    },

    /**
     * Restart timeout for idle connections
     * - Send ping request after timeout
     * - Wait for pong response or try to reconnect after timeout
     */
    resetActivityCheck: function(){
        var self = this;
        self.clearActivityCheck();
        self.activityCheckTimeout = setTimeout(function(){
            if(self.connection) self.connection.ping();
            self.activityCheckTimeout = setTimeout(function(){
                self.retryIn(0);
            }, self.config.pongTimeout);
        }, self.activityTimeout);
    },

    /**
     * Clear timeout set by resetActivityCheck
     */
    clearActivityCheck: function(){
        clearTimeout(this.activityCheckTimeout);
    },

    /**
     * Set new activity timeout value if provided value if lower than current one
     *
     * @param int timeout Suggested timeout in milliseconds
     */
    setActivityTimeout: function(timeout){
        if(this.activityTimeout === undefined || this.activityTimeout > timeout){
            this.activityTimeout = timeout;
        }
    },

    /**
     * Update connection state. Emit change.
     *
     * @param string newState
     * @param object data (optional)
     * @scope private
     */
    updateState: function(newState, data){
        var previousState = this.state;
        this.state = newState;
        if(previousState !== newState){
            Pusher.debug('State changed', previousState + ' -> ' + newState);
            this.emit('state_change', { previous: previousState, current: newState });
            this.emit(newState, data);
        }
    },

    /**
     * Return list of callbacks binded to connection events
     *
     * @return object hash with event handlers
     * @scope private
     */
    buildConnectionCallbacks: function(){
        var self = this;
        return {

            message: function(socketData){ // includes pong messages from server

                // We're still alive
                self.resetActivityCheck();

                // Parse message
                var message;
                try{
                    message = Message.decodeMessage(socketData.data);
                }catch(e){
                    self.emit('error', { type: 'MessageParseError', error: e, data: socketData.data });
                }

                // Emit special event and forward message
                if(typeof message !== 'undefined'){
                    Pusher.debug('Event recd', message);
                    switch(message.event){
                        case 'pusher:error':
                            self.emit('error', { type: 'PusherError', data: message.data });
                            break;

                        case 'pusher:ping':
                            self.emit('ping');
                            break;

                        case 'pusher:pong':
                            self.emit('pong');
                            break;
                    }
                    self.emit('message', message);
                }
            },

            error: function(error){
                self.emit('error', { type: 'WebSocketError', error: error });
            },

            close: function(){
                var code = arguments[0]? arguments[0].code : arguments[0]; // close event can be object or two arguments (code, message)
                var message = arguments[1] || arguments[0].reason || 'close code ' + code;
                self.abandonConnection();
                if(self.shouldRetry()){
                    self.handleError(code, message);
                }
            },

            ping: function(){
                self.resetActivityCheck();
            },

            pong: function(){
                self.resetActivityCheck();
            }
        };
    }

});

module.exports = Connection;
