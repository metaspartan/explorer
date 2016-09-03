// int64-buffer.js

/*jshint -W018 */ // Confusing use of '!'.
/*jshint -W030 */ // Expected an assignment or function call and instead saw an expression.
/*jshint -W093 */ // Did you mean to return a conditional instead of an assignment?

var Uint64BE, Int64BE;

!function(exports) {
  // constructors

  var U = exports.Uint64BE = Uint64BE = function(buffer, offset, value, raddix) {
    if (!(this instanceof Uint64BE)) return new Uint64BE(buffer, offset, value, raddix);
    return init(this, buffer, offset, value, raddix);
  };

  var I = exports.Int64BE = Int64BE = function(buffer, offset, value, raddix) {
    if (!(this instanceof Int64BE)) return new Int64BE(buffer, offset, value, raddix);
    return init(this, buffer, offset, value, raddix);
  };

  // member methods

  var UPROTO = U.prototype;
  var IPROTO = I.prototype;

  // constants

  var UNDEFIND = "undefined";
  var BUFFER = (UNDEFIND !== typeof Buffer) && Buffer;
  var UINT8ARRAY = (UNDEFIND !== typeof Uint8Array) && Uint8Array;
  var ARRAYBUFFER = (UNDEFIND !== typeof ArrayBuffer) && ArrayBuffer;
  var ZERO = [0, 0, 0, 0, 0, 0, 0, 0];
  var isArray = Array.isArray || _isArray;
  var BIT32 = 4294967296;
  var BIT24 = 16777216;

  // storage class

  var storage; // Array;

  // initializer

  function init(that, buffer, offset, value, raddix) {
    if (UINT8ARRAY && ARRAYBUFFER) {
      if (buffer instanceof ARRAYBUFFER) buffer = new UINT8ARRAY(buffer);
      if (value instanceof ARRAYBUFFER) value = new UINT8ARRAY(value);
    }

    // Int64BE() style
    if (!buffer && !offset && !value && !storage) {
      // shortcut to initialize with zero
      that.buffer = newArray(ZERO, 0);
      return;
    }

    // Int64BE(value, raddix) style
    if (!isValidBuffer(buffer, offset)) {
      var _storage = storage || Array;
      raddix = offset;
      value = buffer;
      offset = 0;
      buffer = new _storage(8);
    }

    that.buffer = buffer;
    that.offset = offset |= 0;

    // Int64BE(buffer, offset) style
    if ("undefined" === typeof value) return;

    // Int64BE(buffer, offset, value, raddix) style
    if ("string" === typeof value) {
      fromString(buffer, offset, value, raddix || 10);
    } else if (isValidBuffer(value, raddix)) {
      fromArray(buffer, offset, value, raddix);
    } else if ("number" === typeof raddix) {
      writeUInt32BE(buffer, offset, value); // high
      writeUInt32BE(buffer, offset + 4, raddix); // low
    } else if (value > 0) {
      fromPositive(buffer, offset, value); // positive
    } else if (value < 0) {
      fromNegative(buffer, offset, value); // negative
    } else {
      fromArray(buffer, offset, ZERO, 0); // zero, NaN and others
    }
  }

  UPROTO.buffer = IPROTO.buffer = void 0;

  UPROTO.offset = IPROTO.offset = 0;

  UPROTO._isUint64BE = IPROTO._isInt64BE = true;

  U.isUint64BE = function(b) {
    return !!(b && b._isUint64BE);
  };

  I.isInt64BE = function(b) {
    return !!(b && b._isInt64BE);
  };

  UPROTO.toNumber = function() {
    var buffer = this.buffer;
    var offset = this.offset;
    var high = readUInt32BE(buffer, offset);
    var low = readUInt32BE(buffer, offset + 4);
    return high ? (high * BIT32 + low) : low;
  };

  IPROTO.toNumber = function() {
    var buffer = this.buffer;
    var offset = this.offset;
    var high = readUInt32BE(buffer, offset) | 0; // a trick to get signed
    var low = readUInt32BE(buffer, offset + 4);
    return high ? (high * BIT32 + low) : low;
  };

  UPROTO.toArray = IPROTO.toArray = function(raw) {
    var buffer = this.buffer;
    var offset = this.offset;
    storage = null; // Array
    if (raw !== false && offset === 0 && buffer.length === 8 && isArray(buffer)) return buffer;
    return newArray(buffer, offset);
  };

  // add .toBuffer() method only when Buffer available

  if (BUFFER) {
    UPROTO.toBuffer = IPROTO.toBuffer = function(raw) {
      var buffer = this.buffer;
      var offset = this.offset;
      storage = BUFFER;
      if (raw !== false && offset === 0 && buffer.length === 8 && Buffer.isBuffer(buffer)) return buffer;
      var dest = new BUFFER(8);
      fromArray(dest, 0, buffer, offset);
      return dest;
    };
  }

  // add .toArrayBuffer() method only when Uint8Array available

  if (UINT8ARRAY) {
    UPROTO.toArrayBuffer = IPROTO.toArrayBuffer = function(raw) {
      var buffer = this.buffer;
      var offset = this.offset;
      var arrbuf = buffer.buffer;
      storage = UINT8ARRAY;
      if (raw !== false && offset === 0 && (arrbuf instanceof ARRAYBUFFER) && arrbuf.byteLength === 8) return arrbuf;
      var dest = new UINT8ARRAY(8);
      fromArray(dest, 0, buffer, offset);
      return dest.buffer;
    };
  }

  IPROTO.toString = function(radix) {
    return toString(this.buffer, this.offset, radix, true);
  };

  UPROTO.toString = function(radix) {
    return toString(this.buffer, this.offset, radix, false);
  };

  UPROTO.toJSON = UPROTO.toNumber;
  IPROTO.toJSON = IPROTO.toNumber;

  // private methods

  function isValidBuffer(buffer, offset) {
    var len = buffer && buffer.length;
    offset |= 0;
    return len && (offset + 8 <= len) && ("string" !== typeof buffer[offset]);
  }

  function fromArray(destbuf, destoff, srcbuf, srcoff) {
    destoff |= 0;
    srcoff |= 0;
    for (var i = 0; i < 8; i++) {
      destbuf[destoff++] = srcbuf[srcoff++] & 255;
    }
  }

  function fromString(buffer, offset, str, raddix) {
    var pos = 0;
    var len = str.length;
    var high = 0;
    var low = 0;
    if (str[0] === "-") pos++;
    var sign = pos;
    while (pos < len) {
      var chr = parseInt(str[pos++], raddix);
      if (!(chr >= 0)) break; // NaN
      low = low * raddix + chr;
      high = high * raddix + Math.floor(low / BIT32);
      low %= BIT32;
    }
    if (sign) {
      high = ~high;
      if (low) {
        low = BIT32 - low;
      } else {
        high++;
      }
    }
    writeUInt32BE(buffer, offset, high);
    writeUInt32BE(buffer, offset + 4, low);
  }

  function toString(buffer, offset, radix, signed) {
    var str = "";
    var high = readUInt32BE(buffer, offset);
    var low = readUInt32BE(buffer, offset + 4);
    var sign = signed && (high & 0x80000000);
    if (sign) {
      high = ~high;
      low = BIT32 - low;
    }
    radix = radix || 10;
    while (1) {
      var mod = (high % radix) * BIT32 + low;
      high = Math.floor(high / radix);
      low = Math.floor(mod / radix);
      str = (mod % radix).toString(radix) + str;
      if (!high && !low) break;
    }
    if (sign) {
      str = "-" + str;
    }
    return str;
  }

  function newArray(buffer, offset) {
    return Array.prototype.slice.call(buffer, offset, offset + 8);
  }

  function readUInt32BE(buffer, offset) {
    return (buffer[offset++] * BIT24) + (buffer[offset++] << 16) + (buffer[offset++] << 8) + buffer[offset];
  }

  function writeUInt32BE(buffer, offset, value) {
    buffer[offset + 3] = value & 255;
    value = value >> 8;
    buffer[offset + 2] = value & 255;
    value = value >> 8;
    buffer[offset + 1] = value & 255;
    value = value >> 8;
    buffer[offset] = value & 255;
  }

  function fromPositive(buffer, offset, value) {
    for (var i = offset + 7; i >= offset; i--) {
      buffer[i] = value & 255;
      value /= 256;
    }
  }

  function fromNegative(buffer, offset, value) {
    value++;
    for (var i = offset + 7; i >= offset; i--) {
      buffer[i] = ((-value) & 255) ^ 255;
      value /= 256;
    }
  }

  // https://github.com/retrofox/is-array
  function _isArray(val) {
    return !!val && "[object Array]" == Object.prototype.toString.call(val);
  }

}(typeof exports === 'object' && typeof exports.nodeName !== 'string' ? exports : (this || {}));
