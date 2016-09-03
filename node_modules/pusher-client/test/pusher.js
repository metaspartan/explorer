var expect = require('expect.js');
var sinon = require('sinon');
var defaultOptions = require('../lib/options/default');
var Pusher = require('../lib/pusher');
var Connection = require('../lib/connection');
var ConnectionMock = require('./mocks/connection');
var PublicChannel = require('../lib/channels/public');
var PublicChannelMock = require('./mocks/channels/public');

var expectValidSubscriptions = function(connection, channels){
    var channel, channelName;
    for (channelName in channels) {
        channel = channels[channelName];

        expect(channel.authorize.called).to.be(true);
        channel.authorize.getCall(0).args[1](null, {
            auth: { auth: channelName },
            channel_data: { data: channelName }
        });

        expect(connection.sendEvent.calledWithExactly(
            'pusher:subscribe',
            {
                channel: channelName,
                auth: { auth: channelName },
                channel_data: { data: channelName }
            },
            undefined
        )).to.be(true);
    }
};

describe('Pusher', function(){

    var pusher, _autoConnect, connection;
    beforeEach(function(){
        _autoConnect = Pusher.autoConnect;

        Pusher.autoConnect = false;

        connection = new ConnectionMock();
        sinon.stub(Connection.prototype, 'initialize').returns(connection);

        sinon.stub(PublicChannel.prototype, 'initialize', function(name){
            return new PublicChannelMock(name);
        });

        sinon.stub(Pusher, 'warn');
        pusher = new Pusher('foo');
    });

    afterEach(function(){
        Pusher.autoConnect = _autoConnect;
        Connection.prototype.initialize.restore();
        PublicChannel.prototype.initialize.restore();
        Pusher.warn.restore();
    });

    it('should find subscribed channels', function(){
        var channel = pusher.subscribe('channel1');
        expect(pusher.channel('channel1')).to.be(channel);
    });

    it('should not find unsubscribed channels', function(){
        expect(pusher.channel('channel1')).to.be(undefined);
        pusher.subscribe('channel1');
        pusher.unsubscribe('channel1');
        expect(pusher.channel('channel1')).to.be(undefined);
    });

    it('should return all subscribed channels', function(){
        var channel1 = pusher.subscribe('channel1');
        var channel2 = pusher.subscribe('channel2');
        var list = pusher.allChannels();
        expect(list).to.be.an(Array);
        expect(list).to.have.length(2);
        expect(list).to.contain(channel1);
        expect(list).to.contain(channel2);
    });

    describe('encryption', function(){
        it('should be off by default', function(){
            expect(pusher.isEncrypted()).to.be(false);
        });

        it('should be on when "encrypted" parameter is passed', function(){
            var pusher = new Pusher('foo', { encrypted: true });
            expect(pusher.isEncrypted()).to.be(true);
        });
    });

    describe('app key validation', function(){
        it('should allow a hex key', function(){
            new Pusher('1234567890abcdef');
            expect(Pusher.warn.called).to.be(false);
        });

        it('should warn on a null key', function(){
            new Pusher(null);
            expect(Pusher.warn.called).to.be(true);
        });

        it('should allow an undefined key', function(){
            new Pusher();
            expect(Pusher.warn.called).to.be(true);
        });
    });

    describe('on instance', function(){
        beforeEach(function(){
            Pusher.autoConnect = true;
        });

        afterEach(function(){
            Pusher.autoConnect = _autoConnect;
        });

        it('should start a connection attempt', function(){
            sinon.spy(Pusher.prototype, 'connect'); // not that nice right?
            expect(Pusher.prototype.connect.called).to.be(false);
            new Pusher();
            expect(Pusher.prototype.connect.called).to.be(true);
            Pusher.prototype.connect.restore();
        });
    });

    describe('on connection construction', function(){
        it('should pass the key', function(){
            expect(Connection.prototype.initialize.getCall(0).args[0]).to.be('foo');
        });

        it('should pass default host', function(){
            var options = Connection.prototype.initialize.getCall(0).args[1] || {};
            expect(options.host).to.be('ws.pusherapp.com');
        });

        it('should pass custom host based on cluster', function(){
            new Pusher('foo', {
                cluster: 'lorem'
            });
            var options = Connection.prototype.initialize.getCall(1).args[1] || {}; // first call is from beforeEach
            expect(options.host).to.be('ws-lorem.pusher.com');
        });

        it('should pass default timeout', function(){
            var options = Connection.prototype.initialize.getCall(0).args[1] || {};
            expect(options.activityTimeout).to.be(defaultOptions.activityTimeout);
            expect(options.pongTimeout).to.be(defaultOptions.pongTimeout);
            expect(options.unavailableTimeout).to.be(defaultOptions.unavailableTimeout);
        });

        it('should pass user-specified timeouts', function(){
            new Pusher('foo', {
                activityTimeout: 123,
                pongTimeout: 456,
                unavailableTimeout: 789
            });
            var options = Connection.prototype.initialize.getCall(1).args[1] || {}; // first call is from beforeEach
            expect(options.activityTimeout).to.be(123);
            expect(options.pongTimeout).to.be(456);
            expect(options.unavailableTimeout).to.be(789);
        });

        it('should respect the "encrypted" option', function(){
            new Pusher('foo', { encrypted: true });
            expect(Connection.prototype.initialize.getCall(0).args[1].encrypted).to.be(undefined);
            expect(Connection.prototype.initialize.getCall(1).args[1].encrypted).to.be(true);
        });
    });

    describe('on connected', function(){
        it('should subscribe to all channels', function(){
            var subscribedChannels = {
                channel1: pusher.subscribe('channel1'),
                channel2: pusher.subscribe('channel2')
            };
            expect(subscribedChannels.channel1.authorize.called).to.be(false);
            expect(subscribedChannels.channel2.authorize.called).to.be(false);

            pusher.connect();
            connection.state = 'connected';
            connection.emit('connected');

            expectValidSubscriptions(connection, subscribedChannels);
        });
    });

    describe('after connected', function() {

        beforeEach(function(){
            pusher.connect();
            connection.state = 'connected';
            connection.emit('connected');
        });

        it('should send events to connection manager', function(){
            pusher.sendEvent('event', { key: 'value' }, 'channel');
            expect(connection.sendEvent.calledWithExactly('event', { key: 'value' }, 'channel')).to.be(true);
        });

        describe('on subscribe', function(){
            it('should return the same channel object for subsequent calls', function() {
                var channel = pusher.subscribe('xxx');
                expect(channel.name).to.be('xxx');
                expect(pusher.subscribe('xxx')).to.be(channel);
            });

            it('should authorize and send a subscribe event', function(){
                var channel = pusher.subscribe('xxx');
                expectValidSubscriptions(connection, { 'xxx' : channel });
            });

            it('should pass pusher:subscription_error event after auth error', function(){
                var channel = pusher.subscribe('wrong');
                channel.authorize.firstCall.args[1](true, 'ERROR');
                expect(channel.handleEvent.calledWithExactly('pusher:subscription_error', 'ERROR')).to.be(true);
            });
        });

        describe('on unsubscribe', function(){
            it('should send a unsubscribe event', function(){
                pusher.subscribe('yyy');
                pusher.unsubscribe('yyy');
                expect(connection.sendEvent.calledWithExactly('pusher:unsubscribe', { channel: 'yyy' }, undefined)).to.be(true);
            });
        });
    });

    describe('on message', function(){
        it('should pass events to their channels', function(){
            var channel = pusher.subscribe('chan');
            connection.emit('message', {
                channel: 'chan',
                event: 'event',
                data: { key: 'value' }
            });
            expect(channel.handleEvent.calledWithExactly('event', { key: 'value' })).to.be(true);
        });

        it('should not publish events to other channels', function(){
            var channel = pusher.subscribe('chan');
            var handler = sinon.spy();
            channel.bind('event', handler);
            connection.emit('message', {
                channel: 'different',
                event: 'event',
                data: {}
            });
            expect(handler.called).to.be(false);
        });

        it('should not publish internal events', function(){
            var handler = sinon.spy();
            pusher.bind('pusher_internal:test', handler);
            connection.emit('message', {
                event: 'pusher_internal:test',
                data: 'data'
            });
            expect(handler.called).to.be(false);
        });
    });

    describe('on disconnect', function(){
        beforeEach(function(){
            pusher.disconnect();
        });

        it('should call disconnect on connection', function(){
            expect(connection.disconnect.called).to.be(true);
        });
    });

    describe('on disconnected', function(){
        it('should disconnect channels', function(){
            var channel1 = pusher.subscribe('channel1');
            var channel2 = pusher.subscribe('channel2');
            connection.state = 'disconnected';
            connection.emit('disconnected');
            expect(channel1.disconnect.called).to.be(true);
            expect(channel2.disconnect.called).to.be(true);
        });
    });

    describe('on error', function() {
        it('should log a warning to console', function(){
            connection.emit('error', 'something');
            expect(Pusher.warn.calledWithExactly('Error', 'something')).to.be(true);
        });
    });
});
