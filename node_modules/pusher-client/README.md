# Pusher Node.js Client

This library is an open source client that allows Node.js applications to connect to the
[Pusher webservice](http://pusherapp.com/). It aims to be fully compatible and up-to-date with Pusher's
official [JavaScript client](https://github.com/pusher/pusher-js/)

The largest part of this documentation is a direct copy of the [Pusher JavaScript](https://github.com/pusher/pusher-js/blob/master/README.markdown)
readme with some specific changes.

## Usage overview

The following topics are covered:

* Configuration
* Connection
* Socket ids
* Subscribing to channels (public and private)
* Binding to events
  * Globally
  * Per-channel
* Default events

## Configuration

There are a number of configuration parameters which can be set for the Pusher client, which can be passed as an object to the Pusher constructor, i.e.:

    var Pusher = require('pusher-client');
    var pusher = new Pusher(API_KEY, {
        authEndpoint: "http://example.com/pusher/auth"
    });

For most users, there is little need to change these.
See [client API guide](http://pusher.com/docs/client_api_guide/client_connect) for more details.

#### `encrypted` (Boolean)

Forces the connection to use encrypted transports.

#### `secret` (String)

Contrary to the JavaScript client, this library is able to generate an authentication signature itself.
When you provide the secret key (found under your app's access tokens on pusher.com) it will skip requests to the
authentication endpoint and locally sign subscribe requests to private- and presence channels.

#### `channel_data` (Object)

When using a secret with a presence- channel, you might want to also provide a channel_data object containing identifiable information about the client.

    var pusher = new Pusher('app_key', {
      secret: 'app_secret', 
      channel_data: {
        user_id: 'unique_user_id', 
        user_info: {
          name: 'User Name'
        }
      }
    });

#### `authEndpoint` (String)

Endpoint on your server that will return the authentication signature needed for private channels.

#### `auth` (Object)

The auth option lets you send additional information with the authentication request. Only used when `secret`
is omitted.
    
`auth.params` (Object)

Additional POST parameters to be sent when the channel authentication endpoint is called. 

    var username = 'user123';
    var password = 'password456';
    var pusher = new Pusher('app_key', {
      auth: {
        params: {
          username: username,
          password: password
        }
      }
    });

`auth.headers` (Object)

Provides the ability to pass additional HTTP Headers to the channel authentication endpoint when authenticating a channel.

    var username = 'user123';
    var password = 'password456';
    var pusher = new Pusher('app_key', {
      auth: {
        headers: {
          'Authorization': 'Basic ' + new Buffer(username + ':' + password).toString('base64')
        }
      }
    });
    
`auth.username` and `auth.password` (String)

When both username and password are provided, the correct authorization headers will be sent when authenticating a channel (HTTP Basic Authorization)

#### `cluster` (String)

Allows connecting to a different datacenter by setting up correct hostnames and ports for the connection.

    // will connect to the 'eu' cluster
    var pusher = new Pusher(API_KEY, { cluster: "eu" });

#### `host`, `wsPort`, `wssPort`

These can be changed to point to alternative Pusher URLs (used internally for our staging server).


## Connection

A websocket connection is established by providing your API key to the constructor function:

    var socket = new Pusher(API_KEY);

This returns a socket object which can then be used to subscribe to channels.

### Socket IDs

Making a connection provides the client with a new `socket_id` that is assigned by the server.
This can be used to distinguish the client's own events. A change of state might otherwise be
duplicated in the client. More information on this pattern is available
[here](http://pusherapp.com/docs/duplicates).

It is also stored within the socket, and used as a token for generating signatures for private channels.

## Subscribing to channels

### Public channels

The default method for subscribing to a channel involves invoking the `subscribe` method of your socket object:

    var my_channel = socket.subscribe('my-channel');

This returns a Channel object which events can be bound to.

### Private channels

Private channels are created in exactly the same way as normal channels, except that they reside in the 'private-' namespace. This means prefixing the channel name:

    var my_channel = socket.subscribe('private-my-channel');

It is possible to access channels by name, through the `channel` function:

    channel = socket.channel('private-my-channel');

## Binding to events

Events can be bound to at 2 levels, the global, and per channel. They take a very similar form to the way events are handled in jQuery.

### Global events

You can attach behaviour to these events regardless of the channel the event is broadcast to. The following is an example of an app that binds to new comments from any channel:

    var socket = new Pusher('MY_API_KEY');
    var my_channel = socket.subscribe('my-channel');
    socket.bind('new-comment',
      function(data) {
        // add comment into page
      }
    );

### Per-channel events

These are bound to a specific channel, and mean that you can reuse event names in different parts of you client application. The following might be an example of a stock tracking app where several channels are opened for different companies:

    var socket = new Pusher('MY_API_KEY');
    var channel = socket.subscribe('APPL');
    channel.bind('new-price',
      function(data) {
        // add new price into the APPL widget
      }
    );

### Binding to everything

It is possible to bind to all events at either the global or channel level by using the method `bind_all`.
This is used for debugging, but may have other utilities.

### Getting all channels

It is possible to retrieve a list of all channels you subscribed to or are subscribing to:

    var channels = socket.allChannels();

## Default events

There are a number of events which are used internally, but can also be of use elsewhere:

* connection_established
* subscribe

## Developing

The library is published to NPM and can be installed with the following command:

    $ npm install pusher-client

## Testing

Navigate to this module's repository and make sure you have the development modules installed:

    $ npm install


Run the tests:

    $ npm test

About 70% of code has been covered so far. Most tests are a direct port of JavaScript tests. Use the [original Pusher tests](https://github.com/pusher/pusher-js/blob/master/README.markdown#testing) as a starting point.
