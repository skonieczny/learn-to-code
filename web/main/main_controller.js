
angular.module('myapp-main', ['ngRoute', 'db'])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'main/main.html',
        controller: 'MainCtrl'
      });
  })
  .controller('MainCtrl', function ($scope, db) {
    $scope.games = [db.model('game', 'oix')];	
  });
