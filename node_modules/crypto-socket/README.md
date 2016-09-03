##crypto-socket

**Ronaldo Barbachano, 2016**

***Provided as is.***

Combines public crypto currency websocket API's to provide a low-resource, zero configuration ticker.


### Quickstart


```
cryptoSocket = require("crypto-socket")
cryptoSocket.start();

```

3) Get ticker quotes via **cryptoSocket.echoExchange()** or access object variable **cryptoSocket.Exchanges**


##Supported Exchanges/Symbols

|Exchange | btc | eth | ltc| dash | lsk | DAO | 
|---------|-----|-----|----|------|-----|-----|
|Bitfinex | *   | *   |    | | | |
|Poloniex | *   | *   |    |* | * | *|
|Cex      | *   | *   |    |
|Bitstamp | *   |     |    |
|Gemini   | *   | *    |   |
|GDAX	 	| *	   | *		| 	|
|Bitmex   | *   | * | | | * | *|
|OKCoin   | *   |    | * | | |


## Basic functions

###cryptoSocket.start(exchange,symbol)

Starts a websocket. Where ***exchange*** is always lowercase and ***symbol*** is always upper-case.



```
// listen to ETHBTC on bitfinex,bitmex,and cex.
cryptoSocket.start("bitfinex","ETHBTC")
cryptoSocket.start("bitmex","ETHBTC")
cryptoSocket.start("cex","ETHBTC")
```

**Note**

As of now **Poloniex** exchange only has one open socket that sends back all data. The above syntax is not recommeneded unless you are only following one symbol; as it will open up multiple sockets that return all data, and filter out your selections.
__________

###echoExchange()

A simple printout of all open ticker quotes.



```
// print out quotes every 1000 ms (1 second)
setInterval(
	function(){
		cryptoSocket.echoExchange()
	},1000);
```

________________
###cryptoSocket.Exchanges

Access to the raw variable the module uses to store ticker quotes as they update. One value at a time.



```
// get bitfinex quotes
console.log(cryptoSocket.Exchanges['bitfinex'])
// renders '{ ETHBTC: 0.02492 }' to console.
```



##FAQ

**Does this store data?**

Nope. Ticker values (in most cases last sale price) is stored in memory.

***Why?***

Other popular BTC average modules require incredible amount of bandwidth at regular intervals which can make deployment difficult in many situations. Websockets are obviously the way to go for real time data, as constantly querying many exchanges can be taxing.

This module **does not include exchange API's that do not have web sockets**. Why? Theres a billion other modules that do something similar, and perhaps this is a wake up call to any exchange that does not offer rhobust websocket support.

Many developers would rather not be bothered reading through additional API documentation which, in many cases, is incomplete, hard to follow and usually lacking node.js examples. I did it for you! In node. Your welcome.

###Why Should I use websockets?

They are (usually) faster. Data is sent to the client as its received, versus a poll-and-diff approach which requires regular polling intervals. This can mean the difference between a constant 10k/s stream versus a sporadic 3k/s steam. Sites that poll many exchanges regularly increase bandwith use based on polling intervals. (For example if you attempt to use BTCAverage module, and three times a second, you can easily consume 300k/s) This module with all websockets activated consumes around 3-10k/s making it possible for low-bandwith enviornments to function somewhat efficently.

###Why are some symbols unavailable?

The exchange's api does not offer the symbol via websocket or laziness. Hook it up with a PR brah; after a while one gets burnt out glazing over poorly written/organized API documentation; **and its all subject to change at any given moment so prepare for this to break**.

###Why are some exchanges unavailable?

For the most part they do not offer a public web socket and I did not feel it nessary to reduplicate more code to create a 'faux-socket', as there are many alternatives.

##Donate wallet
Got some extra coins? Send them here.
 
bitcoin wallet address : **1K9R37jV71x3EN7HubbNicvKQ1gqo6xWpM**

