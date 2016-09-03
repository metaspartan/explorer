var expect = require('expect.js');
var sinon = require('sinon');
var PublicChannel = require('../lib/channels/public');
var PusherMock = require('./mocks/pusher');

describe('PublicChannel', function(){

    var channel, pusher;
    beforeEach(function(){
        pusher = new PusherMock();
        channel = new PublicChannel('test', pusher);
    });

    describe('after construction', function(){
        it('#subscribed should be false', function(){
            expect(channel.subscribed).to.be(false);
        });
    });

    describe('#authorize', function(){
        it('should call back with false, {} immediately', function(){
            var callback = sinon.spy();
            channel.authorize('socket123', callback);
            expect(callback.calledWithExactly(false, {})).to.be(true);
        });
    });

    describe('#trigger', function(){
        it('should call sendEvent on connection', function(){
            sinon.spy(pusher, 'sendEvent');
            channel.trigger('test_event', { k: 'v'});
            expect(pusher.sendEvent.calledWithExactly('test_event', { k: 'v'}, 'test')).to.be(true);
        });

        it('should return true if connection sent the event', function(){
            sinon.stub(pusher, 'sendEvent').returns(true);
            expect(channel.trigger('t', {})).to.be(true);
        });

        it('should return false if connection didn\t send the event', function(){
            sinon.stub(pusher, 'sendEvent').returns(false);
            expect(channel.trigger('t', {})).to.be(false);
        });
    });

    describe('#disconnect', function(){
        it('should set subscribed to false', function(){
            channel.handleEvent('pusher_internal:subscription_succeeded');
            channel.disconnect();
            expect(channel.subscribed).to.be(false);
        });
    });

    describe('#handleEvent', function(){
        it('should not emit pusher_internal:* events', function(){
            var callback = sinon.spy();
            channel.bind('pusher_internal:test', callback);
            channel.handleEvent('pusher_internal:test');
            expect(callback.called).to.be(false);
        });

        describe('on pusher_internal:subscription_succeeded', function(){
            it('should emit pusher:subscription_succeeded', function(){
                var callback = sinon.spy();
                channel.bind('pusher:subscription_succeeded', callback);
                channel.handleEvent('pusher_internal:subscription_succeeded');
                expect(callback.called).to.be(true);
            });

            it('should set #subscribed to true', function(){
                expect(channel.subscribed).to.be(false);
                channel.handleEvent('pusher_internal:subscription_succeeded');
                expect(channel.subscribed).to.be(true);
            });
        });

        describe('on other events', function(){
            it('should emit the event', function(){
                var callback = sinon.spy();
                channel.bind('something', callback);
                channel.handleEvent('something', 9);
                expect(callback.calledWithExactly(9)).to.be(true);
            });

            it('should emit the event even if it\'s named like JS build-in', function(){
                var callback = sinon.spy();
                channel.bind('toString', callback);
                channel.handleEvent('toString', 'works');
                expect(callback.calledWithExactly('works')).to.be(true);
            });
        });
    });
});