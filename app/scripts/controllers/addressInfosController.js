// preliminary code! TDD - still needs refactoring & optimization
//
//
// chainInfoController.js
//
// contains 1 controller:
//    addressInfosCtrl
//
// by AltSheets
//    September 2015
//

angular.module('ethExplorer')
    .controller('addressInfosCtrl', function ($rootScope, $scope, $location, $routeParams,$q) {

        $scope.init=function()
        {

            $scope.addressId=$routeParams.addressId;
            var addressId = $routeParams.addressId;

            if($scope.addressId!==undefined) {
            	getAddressBalance()
                    .then(function(result){
                    	$scope.balance = web3.fromWei(result).toNumber();
                    });
            	getAddressTransactionCount()
	                .then(function(result){
	                	$scope.txCount = result;
	                });
            	getCode()
            		.then(function(result){
            			$scope.code = result;
            		});
            	getTransactions()
                .then(function(result){
                	console.log("getTransactions is executed!")
                	console.log(result)
                	$scope.transactions=result;
                	});
              getETHUSD();
            } else {
                $location.path("/");
            }

            function getAddressBalance(){
                var deferred = $q.defer();
                web3.eth.getBalance($scope.addressId, function(error, result) {
                    if(!error){deferred.resolve(result);}
                    else{deferred.reject(error);}
                });
                return deferred.promise;
            }

            function getETHUSD() {
              $.getJSON("https://api.coinmarketcap.com/v1/ticker/ethereum/", function(json) {
                var price = Number(json[0].price_usd);
                var ethusd = price.toFixed(2);
                var balanceusd = "$" + ethusd * $scope.balance;
                $scope.balanceusd = balanceusd;
                //console.log("Balance in USD " + $scope.balanceusd);
              });
            }

            function getAddressTransactionCount(){
            	// var success=$.getScript('../../config.js');
                var deferred = $q.defer();
                web3.eth.getTransactionCount($scope.addressId, function(error, result) {
                    if(!error){deferred.resolve(result);}
                    else{deferred.reject(error);}
                });
                return deferred.promise;
            }

            function getCode(){
                var deferred = $q.defer();
                web3.eth.getCode($scope.addressId, function(error, result) {
                    if(!error){deferred.resolve(result);}
                    else{deferred.reject(error);}
                });
                return deferred.promise;
            }

            // TODO: not working yet:
            function getTransactions(){
                var deferred = $q.defer();

                /*

                // See https://github.com/ethereum/go-ethereum/issues/1897#issuecomment-166351797
                // plus the following posts
                // Giving up for now. Invested another 3 hours without results. Grrrr..

                // var options="address:"+$scope.addressId;
                // var options = {"address": "0xf2cc0eeaaaed313542cb262b0b8c3972425143f0"}; // $scope.addressId}; // , "topics": [null]
                // var options = 'pending'
                // console.log(options);

                var options = {fromBlock: 0, toBlock: 'latest', address: "0xf2cc0eeaaaed313542cb262b0b8c3972425143f0"};

                var myfilter = web3.eth.filter(options);

                // var myfilter= web3.eth.filter(options);
                console.log(myfilter);


                myfilter.get(function (error, log) {
                	  console.log("get error:", error);
                	  console.log("get log:", log);
                	});

                web3.eth.filter(options,
                		function(error, result){
                			if(!error){
                				console.log("no error");
                				deferred.resolve(result);
                				}
                			else{
                				console.log("error");
                				deferred.reject(error);
                				}
                			});

                */
                return deferred.promise;

            }
        };
        $scope.init();

function hex2a(hexx) {
    var hex = hexx.toString();//force conversion
    var str = '';
    for (var i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
}
});
