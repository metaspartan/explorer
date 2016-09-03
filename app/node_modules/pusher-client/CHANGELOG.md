# Changelog

## 1.1.0 (2016-02-12)

[FIXED] Removed references to Pusher.instances to avoid memory leaks (kudos enginoid)

## 1.0.0 (2016-01-14)

[NEW] 1.0.0 release! (identical to 0.2.5)

## 0.2.5 (2016-01-14)

[FIXED] Fix crash for auth errors without response body (kudos jbcpollak)

## 0.2.4 (2015-11-24)

[FIXED] Have sendEvent return boolean to comply with JS lib

## 0.2.3 (2015-01-08)

[FIXED] Force UTF-8 encoding for generating signatue (kudos arnihermann)

## 0.2.2 (2014-06-17)

[FIXED] Crash while trying to ping non-existent connection (kudos shimondoodkin)

## 0.2.1 (2013-12-19)

[CHANGED] Updated to Pusher protocol 7
[CHANGED] Using activity_timeout provided by connection handshake

## 0.2.0 (2013-12-09)

[NEW] Implemented channel_data for presence channels (kudos pauliusuza)

## 0.1.4 (2013-11-27)

[NEW] Implemented pusher.allChannels
[CHANGED] Retry connection explicitly after activity timeout

## 0.1.3 (2013-08-06)

[TEST] Added test suite (incomplete)

## 0.1.2 (2013-07-31)

[NEW] Implemented better ping/pong handling
[NEW] Implemented more reliable connection strategy

## 0.1.0 (2013-07-30)

First release!
