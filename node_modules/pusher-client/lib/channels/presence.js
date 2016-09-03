var _ = require('underscore');
var Pusher = require('../pusher');
var PrivateChannel = require('./private');
var Members = require('./members');
var Authorizer = require('./authorizer');

var PresenceChannel = function(){
    return PrivateChannel.apply(this, arguments);
};

_.extend(PresenceChannel.prototype, PrivateChannel.prototype, {

    /**
     * Constructor
     */
    initialize: function(){
        PrivateChannel.prototype.initialize.apply(this, arguments);
        this.members = new Members();
        return this;
    },

    /**
     * Authorize channel
     *
     * @param string   socketId
     * @param function callback e.g. callback(false, { auth: "..."}) where first argument is true on error
     */
    authorize: function(socketId, callback){
        var self = this;
        var channelData = this.pusher.config.channel_data || {user_id: 'node-process-'+process.pid};
        var authorizer = new Authorizer(this, this.pusher);
        authorizer.authorize(socketId, channelData, function(error, authData){
            if(!error){
                if(typeof authData.channel_data === 'undefined'){
                    Pusher.warn('Invalid auth response for channel "' + self.name + '", expected "channel_data" field');
                    callback('Invalid auth response');
                    return;
                }
                var channelData = JSON.parse(authData.channel_data);
                self.members.setMyID(channelData.user_id);
            }
            callback(error, authData);
        });
    },

    /**
     * Handle disconnect. For internal use only.
     */
    disconnect: function(){
        this.members.reset();
        PrivateChannel.prototype.disconnect.apply(this, arguments);
    },

    /**
     * Handle incoming event. For internal use only.
     *
     * @param string event
     * @param object data
     */
    handleEvent: function(event, data){
        switch (event) {
            case 'pusher_internal:subscription_succeeded':
                this.members.onSubscription(data);
                this.subscribed = true;
                this.emit('pusher:subscription_succeeded', this.members);
                break;

            case 'pusher_internal:member_added':
                var addedMember = this.members.addMember(data);
                this.emit('pusher:member_added', addedMember);
                break;

            case 'pusher_internal:member_removed':
                var removedMember = this.members.removeMember(data);
                if(removedMember){
                    this.emit('pusher:member_removed', removedMember);
                }
                break;

            default:
                PrivateChannel.prototype.handleEvent.apply(this, arguments);
        }
    }

});

module.exports = PresenceChannel;