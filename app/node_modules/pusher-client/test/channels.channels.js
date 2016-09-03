var expect = require('expect.js');
var sinon = require('sinon');
var Channels = require('../lib/channels/channels');
var PublicChannel = require('../lib/channels/public');
var PrivateChannel = require('../lib/channels/private');
var PresenceChannel = require('../lib/channels/presence');

describe('Channels', function(){

    var channels;
    beforeEach(function(){
        channels = new Channels();
    });

    describe('#add', function(){
        it('should create two different channels for different names', function(){
            var channel1 = channels.add('test1', {});
            var channel2 = channels.add('test2', {});
            expect(channel1).not.to.be(channel2);
        });

        it('should create a channel only once', function(){
            var channel = channels.add('test', {});
            expect(channels.add('test', {})).to.be(channel);
        });

        it('should create a public channel when name doesn\'t have known prefix', function(){
            expect(channels.add('test', {})).to.be.a(PublicChannel);
        });

        it('should create a private channel when name doesn\'t have known prefix', function(){
            expect(channels.add('private-test', {})).to.be.a(PrivateChannel);
        });

        it('should create a presence channel when name doesn\'t have known prefix', function(){
            expect(channels.add('presence-test', {})).to.be.a(PresenceChannel);
        });
    });

    describe('#find', function(){
        it('should return previously inserted channels', function(){
            var channel1 = channels.add('test1', {});
            var channel2 = channels.add('test2', {});
            expect(channels.find('test1')).to.be(channel1);
            expect(channels.find('test2')).to.be(channel2);
        });

        it('should return undefined if channel doesn\'t exist', function(){
            expect(channels.find('idontexist')).to.be(undefined);
        });
    });

    describe('#list', function(){
        it('should return empty array on init', function(){
            var list = channels.list();
            expect(list).to.be.an(Array);
            expect(list).to.have.length(0);
        });

        it('should return all inserted channels', function(){
            var channel1 = channels.add('test1', {});
            var channel2 = channels.add('test2', {});
            var list = channels.list();
            expect(list).to.be.an(Array);
            expect(list).to.have.length(2);
            expect(list).to.contain(channel1);
            expect(list).to.contain(channel2);
        });
    });

    describe('#remove', function(){
        it('should remove previously inserted channel', function(){
            channels.add('test1', {});
            var channel2 = channels.add('test2', {});
            channels.remove('test1');
            expect(channels.find('test1')).to.be(undefined);
            expect(channels.find('test2')).to.be(channel2);
        });
    });

    describe('#disconnect', function(){
        it('should call disconnect on all channels', function(){
            var channel1 = channels.add('test1', {});
            var channel2 = channels.add('test2', {});
            sinon.spy(channel1, 'disconnect');
            sinon.spy(channel2, 'disconnect');
            channels.disconnect();
            expect(channel1.disconnect.called).to.be.ok();
            expect(channel1.disconnect.called).to.be.ok();
        });
    });
});