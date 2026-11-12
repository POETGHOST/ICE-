var app = angular.module('ICE', []);

app.controller('mainController', ['$scope', function($scope) {
  var socket = io.connect();

  $scope.send = function() {
    if (!$scope.message || !$scope.message.trim()) {
      return;
    }

    socket.emit('chat message', $scope.message.trim());
    $scope.message = '';
  };

  socket.on('chat message', function(msg) {
    var list = document.getElementById('messages');
    if (!list) {
      return;
    }

    var li = document.createElement('li');
    li.appendChild(document.createTextNode(msg));
    list.appendChild(li);
  });
}]);
