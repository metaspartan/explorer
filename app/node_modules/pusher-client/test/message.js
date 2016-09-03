var expect = require('expect.js');
var Message = require('../lib/message');

describe('Message', function(){
    describe('#decodeMessage', function(){
        it('should parse a single-encoded message with an object', function(){
            var message = JSON.stringify({
                event: 'random',
                data: { foo: 'bar' }
            });

            expect(Message.decodeMessage(message)).to.eql({
                event: 'random',
                data: { foo: 'bar' }
            });
        });

        it('should parse a single-encoded message with a string', function(){
            var message = JSON.stringify({
                event: 'raw',
                data: 'just a string'
            });

            expect(Message.decodeMessage(message)).to.eql({
                event: 'raw',
                data: 'just a string'
            });
        });

        it('should parse a double-encoded message', function(){
            var message = JSON.stringify({
                event: 'double',
                data: JSON.stringify({ x: 'y', z: 1 })
            });

            expect(Message.decodeMessage(message)).to.eql({
                event: 'double',
                data: { x: 'y', z: 1 }
            });
        });

        it('should throw an exception if message is malformed', function(){
            var message = 'this is not JSON';
            try{
                Message.decodeMessage(message);
                throw 'Should not reach this line';
            }catch(e){
                expect(e.type).to.be('MessageParseError');
                expect(e.error).to.be.a(SyntaxError);
                expect(e.data).to.be('this is not JSON');
            }
        });
    });

    describe('#prepare', function(){
        it('should encode a message so that it can be JSON-decoded back', function() {
            var message = {
                event: 'test',
                data: { x: 1, y: 0.25, z: 'foo' },
                channel: 'test_channel'
            };
            var encoded = Message.prepare(message.event, message.data, message.channel);
            expect(JSON.parse(encoded)).to.be.eql(message);
        });
    });
});