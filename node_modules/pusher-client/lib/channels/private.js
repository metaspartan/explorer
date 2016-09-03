var _ = require('underscore');
var PublicChannel = require('./public');
var Authorizer = require('./authorizer');

var PrivateChannel = function(){
    return PublicChannel.apply(this, arguments);
};

_.extend(PrivateChannel.prototype, PublicChannel.prototype, {

    /**
     * Authorize channel
     *
     * @param string   socketId
     * @param function callback e.g. callback(false, { auth: "..."}) where first argument is true on error
     */
    authorize: function(socketId, callback){
        var authorizer = new Authorizer(this, this.pusher);
        authorizer.authorize(socketId, undefined, callback);
    }

});

module.exports = PrivateChannel;