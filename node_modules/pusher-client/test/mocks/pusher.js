var Pusher = function(appKey, options){
    this.config = options || {};
    this.sendEvent = function(){};
};
module.exports = Pusher;