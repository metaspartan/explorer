# ETHExplorer V2 based off EtherParty/explorer

![ETHExplorer V2 Screenshot](http://i.imgur.com/wgROAS9.png)

##License

The code in this branch is licensed under GPLv3 (see LICENSE file)

Code in the MIT branch is under the MIT License (shocker, amirite)

But seriously, license file has a TL;DR, at least look at that before using this code in a project

##Installation

`git clone https://github.com/carsenk/explorer`

`npm install`

`bower install`

`npm start`

Make sure to install geth as well for ETH. Then run:

`geth --rpc --rpcaddr localhost --rpcport 8545 --rpcapi "web3,eth" --rpccorsdomain "http://localhost:8000"`

Then visit http://localhost:8000 in your browser of choice after you npm start the explorer

The theme is based off Bootstrap V3 for responsive design. You can easily change from a dark or light theme.

There is a basic API implemented now as well as well as a Ethereum Blockchain Information page

Tons of new features such as a realtime price ticker and current global hashrate

Address Pages are integrated with Shapeshift to easily send a payment to an address.
