var expect = require('expect.js');
var sinon = require('sinon');
var PresenceChannel = require('../lib/channels/presence');
var Members = require('../lib/channels/members');
var Authorizer = require('../lib/channels/authorizer');
var PusherMock = require('./mocks/pusher');
var AuthorizerMock = require('./mocks/channels/authorizer');

describe('PresenceChannel', function(){

    var channel, pusher;
    beforeEach(function(){
        pusher = new PusherMock({ foo: 'bar' });
        channel = new PresenceChannel('presence-test', pusher);
    });

    describe('after construction', function(){
        it('#subscribed should be false', function(){
            expect(channel.subscribed).to.be(false);
        });

        it('#me should be undefined', function(){
            expect(channel.me).to.be(undefined);
        });

        it('#members should be created', function(){
            expect(channel.members).to.be.a(Members);
        });

        it('#members should be empty', function(){
            var callback = sinon.spy();
            expect(channel.members.count).to.be(0);
            channel.members.each(callback);
            expect(callback.called).to.be(false);
        });
    });

    describe('#authorize', function(){
        var authorizer;
        beforeEach(function(){
            authorizer = new AuthorizerMock();
            sinon.stub(Authorizer.prototype, 'initialize').returns(authorizer);
        });

        afterEach(function(){
            Authorizer.prototype.initialize.restore();
        });

        it('should create and call an authorizer', function(){
            channel.authorize('socket123', function(){});
            expect(Authorizer.prototype.initialize.calledOnce).to.be(true);
            expect(Authorizer.prototype.initialize.calledWithExactly(channel, pusher)).to.be(true);
        });

        it('should call back on success with authorization data', function(){
            var callback = sinon.spy();
            channel.authorize('socket123', callback);
            expect(callback.called).to.be(false);
            authorizer._authorizeCallback(false, {
                foo: 'bar',
                channel_data: JSON.stringify({ user_id: 'U' })
            });

            expect(callback.calledWithExactly(false, {
                foo: 'bar',
                channel_data: JSON.stringify({ user_id: 'U' })
            })).to.be(true);
        });

        it('should call back on failure', function(){
            var callback = sinon.spy();
            channel.authorize('socket123', callback);
            authorizer._authorizeCallback(true);
            expect(callback.calledWithExactly(true, undefined)).to.be(true);
        });
    });

    describe('after authorizing', function(){
        var authorizer;
        beforeEach(function(){
            authorizer = new AuthorizerMock();
            sinon.stub(Authorizer.prototype, 'initialize').returns(authorizer);
            channel.authorize('socket123', function(){});
            authorizer._authorizeCallback(false, {
                foo: 'bar',
                channel_data: JSON.stringify({ user_id: 'U' })
            });
        });

        afterEach(function(){
            Authorizer.prototype.initialize.restore();
        });

        describe('#handleEvent', function(){
            it('should not emit pusher_internal:* events', function(){
                var callback = sinon.spy();
                channel.bind('pusher_internal:test', callback);
                channel.handleEvent('pusher_internal:test');
                expect(callback.called).to.be(false);
            });

            describe('on pusher_internal:subscription_succeeded', function(){
                it('should emit pusher:subscription_succeeded with members', function(){
                    var callback = sinon.spy();
                    channel.bind('pusher:subscription_succeeded', callback);
                    channel.handleEvent('pusher_internal:subscription_succeeded', {
                        presence: {
                            hash: { 'U': 'me' },
                            count: 1
                        }
                    });
                    expect(callback.getCall(0).args[0]).to.be.a(Members);
                });

                it('should set #subscribed to true', function(){
                    expect(channel.subscribed).to.be(false);
                    channel.handleEvent('pusher_internal:subscription_succeeded', {
                        presence: {
                            hash: {},
                            count: 0
                        }
                    });
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
            });
        });

        describe('after subscribing', function(){
            var members;
            beforeEach(function(){
                var callback = sinon.spy();
                channel.bind('pusher:subscription_succeeded', callback);
                channel.handleEvent('pusher_internal:subscription_succeeded', {
                    presence: {
                        hash: {
                            'A': 'user A',
                            'B': 'user B',
                            'U': 'me'
                        },
                        count: 3
                    }
                });
                members = callback.getCall(0).args[0];
            });

            it('members should store correct data', function(){
                var callback = sinon.spy();

                expect(members.get('A')).to.eql({ id: 'A', info: 'user A' });
                expect(members.get('B')).to.eql({ id: 'B', info: 'user B' });
                expect(members.get('U')).to.eql({ id: 'U', info: 'me' });

                members.each(callback);

                expect(callback.callCount).to.be(3);
                expect(callback.calledWithExactly({ id: 'A', info: 'user A' })).to.be(true);
                expect(callback.calledWithExactly({ id: 'B', info: 'user B' })).to.be(true);
                expect(callback.calledWithExactly({ id: 'U', info: 'me' })).to.be(true);
            });

            it('members should have correct count', function(){
                expect(members.count).to.be(3);
            });

            it('#me should contain correct data', function(){
                expect(members.me).to.eql({ id: 'U', info: 'me' });
            });

            describe('on pusher_internal:member_added', function(){
                it('should add a new member', function(){
                    channel.handleEvent('pusher_internal:member_added', {
                        user_id: 'C',
                        user_info: 'user C'
                    });
                    expect(members.get('C')).to.eql({ id: 'C', info: 'user C' });
                });

                it('should increment member count after adding a new member', function(){
                    channel.handleEvent('pusher_internal:member_added', {
                        user_id: 'C',
                        user_info: 'user C'
                    });
                    expect(members.count).to.be(4);
                });

                it('should emit pusher:member_added with new member\'s data', function(){
                    var callback = sinon.spy();
                    channel.bind('pusher:member_added', callback);

                    channel.handleEvent('pusher_internal:member_added', {
                        user_id: 'C',
                        user_info: 'user C'
                    });

                    expect(callback.calledWithExactly({ id: 'C', info: 'user C' })).to.be(true);
                });

                it('should update an existing member', function(){
                    channel.handleEvent('pusher_internal:member_added', {
                        user_id: 'B',
                        user_info: 'updated B'
                    });
                    expect(members.get('B')).to.be.eql({ id: 'B', info: 'updated B' });
                });

                it('should not increment member count after updating a member', function(){
                    channel.handleEvent('pusher_internal:member_added', {
                        user_id: 'B',
                        user_info: 'updated B'
                    });
                    expect(members.count).to.be(3);
                });

                it('should emit pusher:member_added with updated member\'s data', function(){
                    var callback = sinon.spy();
                    channel.bind('pusher:member_added', callback);

                    channel.handleEvent('pusher_internal:member_added', {
                        user_id: 'B',
                        user_info: 'updated B'
                    });

                    expect(callback.calledWithExactly({ id: 'B', info: 'updated B' })).to.be(true);
                });
            });

            describe('on pusher_internal:member_removed', function(){
                it('should remove an existing member', function(){
                    channel.handleEvent('pusher_internal:member_removed', {
                        user_id: 'B'
                    });
                    expect(members.get('B')).to.be(undefined);
                });

                it('should emit pusher:member_removed with removed member\'s data', function(){
                    var callback = sinon.spy();
                    channel.bind('pusher:member_removed', callback);

                    channel.handleEvent('pusher_internal:member_removed', { user_id: 'B' });

                    expect(callback.calledWithExactly({ id: 'B', info: 'user B' })).to.be(true);
                });

                it('should decrement member count after removing a member', function(){
                    channel.handleEvent('pusher_internal:member_removed', { user_id: 'B' });
                    expect(members.count).to.be(2);
                });

                it('should not emit pusher:member_removed if removed member didn\'t exist', function(){
                    var callback = sinon.spy();
                    channel.bind('pusher:member_removed', callback);

                    channel.handleEvent('pusher_internal:member_removed', { user_id: 'C' });

                    expect(callback.called).to.be(false);
                });

                it('should not decrement member count if member was not removed', function(){
                    channel.handleEvent('pusher_internal:member_removed', { user_id: 'C' });
                    expect(members.count).to.be(3);
                });
            });

            describe('and disconnecting', function(){
                beforeEach(function(){
                    channel.disconnect();
                });

                it('#subscribed should be false', function() {
                    expect(channel.subscribed).to.be(false);
                });

                it('#me should be undefined', function() {
                    expect(channel.me).to.be(undefined);
                });

                it('#members should be the same object', function() {
                    expect(channel.members).to.be(members);
                });

                it('#members should be empty', function() {
                    var callback = sinon.spy();
                    expect(channel.members.count).to.be(0);
                    channel.members.each(callback);
                    expect(callback.called).to.be(false);
                });
            });
        });
    });
});