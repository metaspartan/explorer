/*
    Crypto-socket

    A basic wrapper for websockets, along with pusher and autobahn for the exchanges that use them.
    Most exchanges (that use normal websockets) are passed through 'makeSocket'. Which updates 
    global variable 'Exchanges' which can be accssessd via .getQuote('btcusd','bitfinex').
    Values wont appear until the socket returns the something. Most of the exchanges send back
    a fair amount of data other than a simple last trade price but that is the only information
    currently stored.
*/

var WebSocket = require('faye-websocket'),
    Pusher = require('pusher-client'),
    autobahn = require('autobahn');

var Exchanges = {}, Sockets = {},

BfxChannelIds = {};

exports.Exchanges = Exchanges;

// helper function that can simply echo the exchanges variable so its kinda like a ticker.
exports.echoExchange = function() {
    console.log("\n\n\n\n\n\n\n\n\n\n");
    for(k in Exchanges){
        console.log('\t'+k);
        var r = '';
        for(s in Exchanges[k]){
            r += s + '\t' + Exchanges[k][s] + '\t';
        }
        console.log(r);
    }
    //console.log(Exchanges);
};
exports.start = function(exchange,symbols) {    
    if(typeof exchange == "undefined"){
        cryptoSockets.start();
    }else{
        // check if its supported... ?
        cryptoSockets.start(exchange,symbols);
    }
};
// bread and butter for 2/3 of exchanges. url is the websocket endpoint, title refers to the exchange (single word),onMessage
// is a function that runs when the socket receives a message, send is an object that is sent to subscribe where applicable
var supportedExchanges = [
    'bitfinex',
    'bitmex',
    'bitstamp',
    'cex',
    'gdax',
    'gemini',
    'okcoin',
    'poloniex'
];

exports.supportedExchanges = supportedExchanges;


var cryptoSockets = {

    'bitfinex': function(symbol) {
        var supportedSymbols = {

            "BTCUSD": {
                "event": "subscribe",
                "channel": "ticker",
                "pair": "BTCUSD"
                //"prec" : "P0"
            },
            "ETHBTC": {
                "event": "subscribe",
                "channel": "ticker",
                "pair": "ETHBTC"
            },
            "ETHUSD":

            {
                "event": "subscribe",
                "channel": "ticker",
                "pair": "ETHUSD"
            },
            "LTCBTC": {
                "event": "subscribe",
                "channel": "ticker",
                "pair": "LTCBTC"
            },
            "ETHUSD":

            {
                "event": "subscribe",
                "channel": "ticker",
                "pair": "LTCUSD"
            }
        };
        if (typeof symbol == "undefined") {
            symbol = [];

            for (key in supportedSymbols) {
                symbol.push(supportedSymbols[key]);
            }
        } else {
            symbol = [supportedSymbols[symbol]];

        }

        this.makeSocket('wss://api2.bitfinex.com:3000/ws', 'bitfinex', function(event) {
            if (typeof event.data != "undefined") {
                var data = JSON.parse(event.data);
                if (typeof data.event != "undefined" && data.event == "subscribed" || data.event == "info") {
                    console.log(data);
                    if (data.event == "subscribed" && typeof data.chanId != "undefined" && typeof data.pair != "undefined") {
                        // match channel id with pair
                        BfxChannelIds[data.chanId + ''] = data.pair;
                    }
                }
                if (typeof data[1] != "undefined" && data[1] != "hb") {
                    var floatCheck = parseFloat(data[7]);
                    if (floatCheck && floatCheck > 0) {
                        var tickerValue = floatCheck;
                    }
                    if (tickerValue) {
                        if (tickerValue < 2) {
                            // this is ETH
                            var tickerCode = 'ETHBTC';
                        } else {
                            var tickerCode = "BTCUSD";
                        }
                        //force string
                        var tickerCode = BfxChannelIds[data[0] + ''];

                        if (tickerCode && tickerValue != Exchanges.bitfinex[tickerCode]) {
                            Exchanges.bitfinex[tickerCode] = tickerValue;
                        }
                    }
                }
            }
        }, symbol);


        return true;
    },
    'bitmex': function(symbols) {
        console.log("starting bitmex");
        // bit mex probably supports more.. but its not clear on how to access them...
        // when found they can be added here.... is LTC LTCUSD ? OR 
        var bitmexSymbol={
                "ETHBTC" : "ETHXBT",
                "BTCUSD" : "XBTUSD",
                "DOAETH" : "DAOETH",
                "LSKBTC" : "LSKXBT",
                "LTCUSD" : "LTCUSD"
        };
        var query='';
        if(typeof symbols == "undefined"){
            query='trade:ETHXBT,trade:XBTUSD,trade:DAOETH,trade:LSKXBT'
            // list all
        }else{
            if(typeof bitmexSymbol[symbols] != "undefined"){
                query = 'trade:' + bitmexSymbol[symbols];
            }
        }
        this.makeSocket('wss://www.bitmex.com/realtime?subscribe=' + query, 'bitmex', function(event) {
            if (typeof event.data != "undefined") {
                var data = JSON.parse(event.data);
                //console.log(data);
                if (typeof data != "undefined" && typeof data.data != "undefined" && typeof data.data != "undefined") {
                    data = data.data[0];
                    if(typeof data == "undefined" || typeof data.symbol == "undefined"){
                        // some responses are blank or notification of sub.. when that happens this crashes... 
                        return false;
                    }
                    var tickerCode = data.symbol;
                    if (data.symbol == "XBTUSD" || data.symbol == "XBT") {
                        tickerCode = "BTCUSD";
                    } else if (data.symbol == "XBTDAO") {
                        tickerCode = "DAOBTC";
                    } else if (data.symbol == "ETHXBT") {
                        tickerCode = "ETHBTC";
                    } else if (data.symbol == "LSKXBT") {
                        tickerCode = "LSKBTC";
                    } else if (data.symbol == "LTC") {
                        tickerCode = "LTCUSD";
                    }
                    var tickerValue = parseFloat(data.price);
                    if (tickerValue != Exchanges.bitmex[tickerCode]) {
                        Exchanges.bitmex[tickerCode] = tickerValue;
                    }
                } else {
                    //console.log(event);
                    console.log(JSON.parse(event.data));
                    console.log("Issue with bitmex response");
                    // close the socket?
                }
            }
        });
        return true;
    },
    'bitstamp': function() {
        if (typeof Pusher != "undefined") {
            try {
                var pusher = new Pusher('de504dc5763aeef9ff52', {});
                if (typeof Exchanges.bitstamp == "undefined") {
                    Exchanges.bitstamp = {};
                }
            } catch (error) {
                console.log("startBitstampSocket error:\t:**");
                console.log(error);
                return false;
            }
            console.log("starting bistamp socket");
            // dont forget to filter to only data u want.
            BitstampSocket = pusher.subscribe('live_trades');
            var i = 0;
            BitstampSocket.bind('trade', function(data) {
                var price = parseFloat(data['price']);
                if (Exchanges.bitstamp.BTCUSD != price) {
                    Exchanges.bitstamp.BTCUSD = parseFloat(data['price']);
                }
            });
            return true;
        } else {
            console.log("No pusher");
            return false;
        }
    },
    'cex': function(symbol) {
        this.makeSocket('wss://ws.cex.io/ws/', 'cex', function(event) {
            if (typeof event.data != "undefined") {
                var data = JSON.parse(event.data);
                if (data && typeof data.data != "undefined") {
                    data = data.data;
                    var tickerValue = parseFloat(data.price);
                    if ((data.symbol1 == 'BTC' && data.symbol2 == 'USD') || (data.symbol1 == 'ETH' && data.symbol2 == 'BTC')) {
                        var tickerCode = data.symbol1 + data.symbol2;
                        if(typeof symbol == "string" && tickerCode != symbol){
                            return false;
                        }
                        if (tickerValue != Exchanges.cex[tickerCode]) {
                            Exchanges.cex[tickerCode] = tickerValue;
                        }
                    }
                }
            }
        }, {
            "e": "subscribe",
            "rooms": [
                "tickers"
            ]
        });
        return true;
    },
    'gdax': function(symbol) {
        var query =[{
            "type": "subscribe",
            "product_id": "BTC-USD"
        }, {
            "type": "subscribe",
            "product_id": "ETH-BTC"
        }];

        if(typeof symbol != "undefined" && symbol == "ETHBTC"){
            query.shift();
        }else if(typeof symbol != "undefined" && symbol == "BTCUSD"){
            query.pop();
        }
        this.makeSocket('wss://ws-feed.gdax.com/', 'gdax', function(event) {
            if (typeof event.data != "undefined") {
                var data = JSON.parse(event.data);
                if (data && typeof data.type != "undefined" && data.type == "match") {
                    var tickerValue = parseFloat(data.price);
                    if (tickerValue != Exchanges.gdax["BTCUSD"] && tickerValue > 2) {
                        Exchanges.gdax["BTCUSD"] = tickerValue;
                    } else if (tickerValue < 2) {
                        // this is such hack.
                        Exchanges.gdax["ETHBTC"] = tickerValue;
                    }
                }
            }
        }, query)
    },
    'gemini': function(symbol) {
        if(typeof symbol != "undefined" && symbol == 'ETHBTC'){
            ;
        }else{
            this.makeSocket('wss://api.gemini.com/v1/marketdata/btcusd', 'gemini', function(event) {
                if (typeof event.data != "undefined") {
                    var data = JSON.parse(event.data);
                    if (data && typeof data.events != "undefined") {
                        data = data.events[0];
                        if (data.type == "trade") {
                            if(typeof Exchanges.gemini == "undefined"){
                                Exchanges.gemini = {};
                            }
                            var tickerValue = parseFloat(data.price);
                            Exchanges.gemini["BTCUSD"] = tickerValue;

                        }
                    }
                }
            });
        }
        this.makeSocket('wss://api.gemini.com/v1/marketdata/ethbtc', 'gemini2', function(event) {
            if (typeof event.data != "undefined") {
                var data = JSON.parse(event.data);
                if (data && typeof data.events != "undefined") {
                    data = data.events[0];
                    if (data.type == "trade") {
                        var tickerValue = parseFloat(data.price);
                        if(typeof Exchanges.gemini == "undefined"){
                            Exchanges.gemini = {};
                        }
                        Exchanges.gemini["ETHBTC"] = tickerValue;

                    }
                }
            }
        });
        return true;
    },
    'okcoin': function(symbol) {
        var query = [{
            "event": "addChannel",
            "channel": "ok_btcusd_ticker",
            "pair": "BTCUSD"
            //"prec" : "P0"
        }, {
            "event": "addChannel",
            "channel": "ok_ltcusd_ticker",
            "pair": "LTCUSD"
        }];

        if(typeof symbol == "string" && symbol == "LTCUSD"){    
            query.shift();
        }else if(typeof symbol == "string" && symbol == "BTCUSD"){
            query.pop();
        }
        console.log("Start okcSocket");
        this.makeSocket('wss://real.okcoin.com:10440/websocket/okcoinapi', 'okcoin', function(event) {
            var data = JSON.parse(event.data);
            if (data) {
                data = data[0];
            } else {
                console.log(event);
                console.log("Issue with server response");
            }
            if (typeof data.data == "undefined") {
                // nothing to process
                return false;
            }
            if (typeof data != "undefined" && typeof data.channel != "undefined") {
                if (data.channel == "ok_ltcusd_ticker") {
                    var tickerCode = "LTCUSD";
                } else if (data.channel == "ok_btcusd_ticker") {
                    var tickerCode = "BTCUSD";
                }
                data = data.data.last;
                var floatCheck = parseFloat(data);
                if (floatCheck && floatCheck > 0) {
                    var tickerValue = floatCheck;
                }
                if (tickerValue) {
                    if (tickerValue != Exchanges.okcoin[tickerCode]) {
                        Exchanges.okcoin[tickerCode] = tickerValue;
                    }
                }
            }
        }, query);

        return true;

    },
    'poloniex': function(symbol) {
        var wsuri = "wss://api.poloniex.com";
        Sockets.poloniex = new autobahn.Connection({
            url: wsuri,
            realm: "realm1"
        });
        if (typeof Exchanges.poloniex == "undefined") {
            Exchanges.poloniex = {};
        }
        try {
            Sockets.poloniex.onopen = function(session) {
                session.subscribe('ticker', function(args, kwargs) {
                    //console.log(args[0]);
                    var codeConversion = {
                        "BTC_ETH"  : "ETHBTC",
                        "USDT_BTC" : "BTCUSD",
                        "BTC_DAO" : "DAOBTC",
                        "BTC_LTC" : "LTCBTC",
                        "BTC_DASH" : "DASHBTC",
                        "USDT_DASH" : "DASHUSD",
                        "BTC_LSK" : "LSKBTC",
                        "USDT_ETH" : "ETHUSD"
                    }
                    var tickerCode = (typeof codeConversion[args[0]] != "undefined" ? codeConversion[args[0]] : false);
                    
                    if((tickerCode != symbol && typeof symbol != "undefined") || !tickerCode){
                        return false;
                    }
                    tickerValue = parseFloat(args[1]);

                    if (Exchanges.poloniex[tickerCode] != tickerValue) {
                        Exchanges.poloniex[tickerCode] = tickerValue;
                    }
                });
            };
        } catch (error) {
            console.log(error);
        }

        Sockets.poloniex.onclose = function() {
            console.log("Polosocket connection closed");
        }
        Sockets.poloniex.open();
    },
    makeSocket: function(url, title, onMessage, send) {
        if (typeof url != "string" || typeof title != "string") {
            return false;
        }
        if (typeof Sockets[title] == "undefined" || !Sockets[title]) {
            Sockets[title] = {};
        }
        Sockets[title] = new WebSocket.Client(url);

        try {
            Sockets[title].on('open', function(event) {
                console.log(title + ' open');
                if (typeof Exchanges[title] == "undefined" && title != "gemini2") {
                    Exchanges[title] = {};
                }
            })
        } catch (error) {
            console.log(error);
            return false;

        }
        try {
            Sockets[title].on('close', function(event) {
                console.log(title + ' close');
            })
        } catch (error) {
            console.log(error);
            return false;
        }
        if (typeof onMessage == "function") {
            Sockets[title].on('message', onMessage);
        }
        if (typeof send == "object" && !send instanceof Array) {
            // parse an object to send ?
            try {
                Sockets[title].send(JSON.stringify(send));
            } catch (error) {
                console.log(error);
                return false;
            }
        } else if (typeof send != "undefined" && send instanceof Array) {
            send.filter(function(o) {
                Sockets[title].send(JSON.stringify(o));
            });
        } else if (typeof send != "undefined") {
            try {
                Sockets[title].send(JSON.stringify(send));
            } catch (error) {
                console.log(error);
                return false;
            }
        }
        return true;
    },
    'start': function(exchange,symbols) {
        if (typeof exchange == "undefined") {
            var self = this;

            supportedExchanges.filter(function(e) {
                console.log(e);
                self[e](symbols);
            });
        }else{
            try{
                this[exchange](symbols);
            }catch(error){
                console.log(exchange);
                console.log(error);
            }
        }
    },
    'stop': function(socket) {
        // only for the faye socket libraries?
        if (typeof Sockets[socket] != "undefined") {
            Sockets[socket].close();
            return true;
        }
        return false;
    }

};
// idea make into object that can take a start constructor with options ... and returns an object with the getQuote method.