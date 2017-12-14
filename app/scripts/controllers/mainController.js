//var cryptoSocket = require('crypto-socket');
var BigNumber = require('bignumber.js');
angular.module('ethExplorer')
    .controller('mainCtrl', function ($rootScope, $scope, $location) {

        // Display & update block list
        getETHRates();
        updateBlockList();
        updateTXList();
        updateStats();
        getHashrate();

        web3.eth.filter("latest", function(error, result){
          if (!error) {
            getETHRates();
            updateBlockList();
            updateTXList();
            updateStats();
            getHashrate();
            $scope.$apply();
          }
        });

        $scope.processRequest= function(){
            var requestStr = $scope.ethRequest;


            if (requestStr!==undefined){

                // maybe we can create a service to do the reg ex test, so we can use it in every controller ?

                var regexpTx = /[0-9a-zA-Z]{64}?/;
                //var regexpAddr =  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}/; // TODO ADDR REGEX or use isAddress(hexString) API ?
                var regexpAddr = /^(0x)?[0-9a-f]{40}$/; //New ETH Regular Expression for Addresses
                var regexpBlock = /[0-9]{1,7}?/;

                var result =regexpTx.test(requestStr);
                if (result===true){
                    goToTxInfos(requestStr)
                }
                else{
                    result = regexpAddr.test(requestStr.toLowerCase());
                    if (result===true){
                        goToAddrInfos(requestStr.toLowerCase())
                    }
                    else{
                        result = regexpBlock.test(requestStr);
                        if (result===true){
                            goToBlockInfos(requestStr)
                        }
                        else{
                            console.log("nope");
                            return null;
                        }
                    }
                }
            }
            else{
                return null;
            }
        };


        function goToBlockInfos(requestStr){
            $location.path('/block/'+requestStr);
        }

        function goToAddrInfos(requestStr){
            $location.path('/address/'+requestStr.toLowerCase());
        }

        function goToTxInfos (requestStr){
             $location.path('/tx/'+requestStr);
        }

        function updateStats() {
            web3.eth.getBlockNumber(function (err,currentBlockNumber) {
                if(err)
                    return console.log(err);
                $scope.blockNum = currentBlockNumber;
                if ($scope.blockNum !== undefined) {
                    web3.eth.getBlock($scope.blockNum, function (err, blockNewest) {
                        if (err)
                            return console.log(err);
                        if (blockNewest !== undefined) {

                            // difficulty
                            $scope.difficulty = blockNewest.difficulty;

                            // Gas Limit
                            $scope.gasLimit = new BigNumber(blockNewest.gasLimit).toFormat(0) + " m/s";

                            web3.eth.getBlock($scope.blockNum - 1, function (err, blockBefore) {
                                if (err)
                                    return console.log(err);
                                $scope.blocktime = blockNewest.timestamp - blockBefore.timestamp;
                            });
                        }
                    });
                }
            });
        }


        function getHashrate()	{
          $.getJSON("https://etherchain.org/api/miningEstimator", function(json) {
            var hr = json.data[0].hashRate;
            $scope.hashrate = hr;
       	});
      }

        function getETHRates() {
          $.getJSON("https://api.coinmarketcap.com/v1/ticker/ethereum/", function(json) {
            var price = Number(json[0].price_usd);
            $scope.ethprice = "$" + price.toFixed(2);
          });

          $.getJSON("https://api.coinmarketcap.com/v1/ticker/ethereum/", function(json) {
            var btcprice = Number(json[0].price_btc);
            $scope.ethbtcprice = btcprice;
          });

          $.getJSON("https://api.coinmarketcap.com/v1/ticker/ethereum/", function(json) {
            var cap = Number(json[0].market_cap_usd);
            //console.log("Current ETH Market Cap: " + cap);
            $scope.ethmarketcap = cap;
          });
        }

        function updateTXList() {
            web3.eth.getBlockNumber(function (err,currentBlockNumber) {
                if(err)
                    return console.log(err);
                $scope.txNumber = currentBlockNumber;
                $scope.recenttransactions = [];

                getTransactionsFromBlock(currentBlockNumber);

                function getTransactionsFromBlock(blockNumber) {
                    web3.eth.getBlock(blockNumber, true, function (err, block) {
                        if (err) {
                            console.log(err);
                            return getTransactionsFromBlock(blockNumber);
                        }
                        $scope.recenttransactions = $scope.recenttransactions.concat(block.transactions);
                        $scope.$apply();
                        if ($scope.recenttransactions.length <= 10 && blockNumber > 0)
                            getTransactionsFromBlock(--blockNumber)
                    });
                }
            });
        }

        function updateBlockList() {
            web3.eth.getBlockNumber(function (err,currentBlockNumber) {
                if(err)
                    return console.log(err);
                $scope.currentBlockNumber = currentBlockNumber;
                $scope.blocks = [];
                getBlockDetails(currentBlockNumber);

                function getBlockDetails(blockNumber) {
                    web3.eth.getBlock(blockNumber, function (err, block) {
                        if (err) {
                            console.log(err);
                            return getBlockDetails(blockNumber);
                        }
                        $scope.blocks = $scope.blocks.concat(block);
                        $scope.$apply();

                        if ($scope.blocks.length <= 10 && blockNumber > 0)
                            getBlockDetails(--blockNumber)
                    })
                }
            });
        }

    });

angular.module('filters', []).
  filter('truncate', function () {
    return function (text, length, end) {
        if (isNaN(length))
            length = 10;

        if (end === undefined)
            end = "...";

        if (text.length <= length || text.length - end.length <= length) {
            return text;
        } else {
            return String(text).substring(0, length-end.length) + end;
        }
      };
      }).filter('diffFormat', function () {
    //convert hash/solution to different kiloHash,MegaHash/solution and others
    return function (diffi) {
        if (isNaN(diffi)) return diffi;
        if (diffi > 1000000000000000) {
            var n = diffi / 1000000000000000;
            return n.toFixed(3) + " P";
        }
        if (diffi > 1000000000000) {
            var n = diffi / 1000000000000;
            return n.toFixed(3) + " T";
        }
        if (diffi > 1000000000) {
            var n = diffi / 1000000000;
            return n.toFixed(3) + " G";
        }
        if (diffi > 1000000) {
            var n = diffi / 1000000;
            return n.toFixed(3) + " M";
        }
        var n = diffi / 1000;
        return n.toFixed(3) + " K";
    };
}).
  filter('stylize', function () {
    return function (style) {
      if (isNaN(style)) return style;
      var si = '<span class="btn btn-primary">' + style + '</span>';
      return si;
    };
  }).
  filter('stylize2', function () {
    return function (text) {
      if (isNaN(text)) return text;
      var si = '<i class="fa fa-exchange"></i> ' + text;
      return si;
    };
  }).filter('hashFormat', function () {
    //convert hash/second to different kiloHash,MegaHash/second and others
    return function (hashr) {
        if (isNaN(hashr)) return hashr;
        if (hashr > 1000000000000000) {
            var n = hashr / 1000000000000000;
            return n.toFixed(3) + " PH/s";
        }
        if (hashr > 1000000000000) {
            var n = hashr / 1000000000000;
            return n.toFixed(3) + " TH/s";
        }
        if (hashr > 1000000000) {
            var n = hashr / 1000000000;
            return n.toFixed(3) + " GH/s";
        }
        if (hashr > 1000000) {
            var n = hashr / 1000000;
            return n.toFixed(3) + " MH/s";
        }
        var n = hashr / 1000;
        return n.toFixed(3) + " KH/s";
    };
}).
  filter('gasFormat', function () {
    return function (txt) {
      if (isNaN(txt)) return txt;
      var b = new BigNumber(txt);
      return b.toFormat(0) + " m/s";
    };
  }).
  filter('BigNum', function () {
    return function (txt) {
      if (isNaN(txt)) return txt;
      var b = new BigNumber(txt);
      var w = web3.fromWei(b, "ether");
      return w.toFixed(6) + " ETH";
    };
  }).
  filter('sizeFormat', function () {
    return function (size) {
      if (isNaN(size)) return size;
      var s = size / 1000;
      return s.toFixed(3) + " kB";
    };
  });
