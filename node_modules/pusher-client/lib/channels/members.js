var _ = require('underscore');

var Members = function(){
    return this.initialize.apply(this, arguments);
};

_.extend(Members.prototype, {

    /**
     * Constructor
     */
    initialize: function(){
        this.reset();
        return this;
    },

    /**
     * Return member's info for given id
     *
     * @param string|int id
     * @return object or undefined  e.g. {id: 1, info: {...}}
     */
    get: function(id){
        if(this.members.hasOwnProperty(id)){
            return {
                id: id,
                info: this.members[id]
            };
        }
    },

    /**
     * Calls back for each member in unspecified order
     *
     * @param function callback  e.g. each(function(member){ ... })
     */
    each: function(callback){
        _.each(this.members, function(member, id){
            callback(this.get(id));
        }, this);
    },

    /**
     * Update the id for connected member. For internal use only
     *
     * @param string|int id
     */
    setMyID: function(id){
        this.myID = id;
    },

    /**
     * Handle subscription data. For internal use only
     *
     * @param object subscriptionData
     */
    onSubscription: function(subscriptionData){
        this.members = subscriptionData.presence.hash;
        this.count = subscriptionData.presence.count;
        this.me = this.get(this.myID);
    },

    /**
     * Adds a new member to the collection. For internal use only
     *
     * @param object memberData  e.g. {user_id: 1, user_info: {...}}
     * @return object
     */
    addMember: function(memberData){
        if(!this.get(memberData.user_id)){
            this.count++;
        }
        this.members[memberData.user_id] = memberData.user_info;
        return this.get(memberData.user_id);
    },

    /**
     * Removes a member from the collection. For internal use only
     *
     * @param object memberData  e.g. {user_id: 1, user_info: {...}}
     * @return object or undefined
     */
    removeMember: function(memberData){
        var member = this.get(memberData.user_id);
        if(member){
            delete this.members[memberData.user_id];
            this.count--;
        }
        return member;
    },

    /**
     * Reset collection to initial state. For internal use only
     */
    reset: function(){
        this.members = {};
        this.count = 0;
        this.myID = null;
        this.me = null;
    }

});

module.exports = Members;