var Message = {

    /**
     * Decode socket message
     *
     * @param string  message  Raw socket message
     * @return object params
     */
    decodeMessage: function(message){
        try{
            var params = JSON.parse(message);
            if(typeof params.data === 'string'){
                try{
                    params.data = JSON.parse(params.data);
                }catch(e){}
            }
            return params;
        }catch(e){
            throw { type: 'MessageParseError', error: e, data: message };
        }
    },

    /**
     * Prepare outgoing Pusher message
     *
     * @param string name    Event name
     * @param object data    Event data (optional)
     * @param string channel Channel name (optional)
     * @return string
     */
    prepare: function(name, data, channel){
        var message = { event: name, data: data || {}};
        if(channel) message.channel = channel;
        return JSON.stringify(message);
    }

};

module.exports = Message;
