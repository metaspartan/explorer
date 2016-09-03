cryptoSocket = require("crypto-socket");

cryptoSocket.start();

setInterval(
  function(){
            cryptoSocket.echoExchange()
                
  },1000
);
