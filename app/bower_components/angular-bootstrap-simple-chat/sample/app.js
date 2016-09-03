(function() {
  'use strict';

  angular.module('app', ['irontec.simpleChat']);

  angular.module('app').controller('Shell', Shell);

  function Shell() {

    var vm = this;

    vm.messages = [
      {
        'username': 'Matt',
        'content': 'Hi!'
      },
      {
        'username': 'Elisa',
        'content': 'Whats up?'
      },
      {
        'username': 'Matt',
        'content': 'I found this nice AngularJS Directive'
      },
      {
        'username': 'Elisa',
        'content': 'Looks Great!'
      }
    ];

    vm.username = 'Matt';

    vm.sendMessage = function(message, username) {
      if(message && message !== '' && username) {
        vm.messages.push({
          'username': username,
          'content': message
        });
      }
    };

  }

})();
