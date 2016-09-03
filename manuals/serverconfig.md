# serverconfig

For IP, and port, see
* [app/app.js](https://github.com/altsheets/explorer/blob/MIT/app/app.js#L6-L10)
* [package.json](https://github.com/etherparty/explorer/blob/MIT/package.json#L24)

Thanks to joey, for helping to find out the [correct geth command](https://github.com/altsheets/explorer/blob/MIT/app/app.js#L14-L15). 

It is useful to make a shortcut for starting the server with that geth command, e.g.:

    echo 'geth --rpc --rpcaddr your.ip.address.here --rpcport 8545 --rpcapi "web3,eth" --rpccorsdomain "http://your.ip.address.here:8000"' > ~/go/bin/EthExp_geth
    chmod u+x ~/go/bin/EthExp_geth
    screen -S geth EthExp_geth
    
(CTRL-A D to leave that screen.)

    