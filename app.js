var app=angular.module('ICE',[]);

app.controller('mainController',['$scope',function($scope){
 var socket = io.connect();
 $scope.send = function(){
  socket.emit('chat message', $scope.message);
  $scope.message="";
 }
 socket.on('chat message', function(msg){
  var li=document.createElement("li");
  li.appendChild(document.createTextNode(msg));
  document.getElementById("messages").appendChild(li);
 });
}]);