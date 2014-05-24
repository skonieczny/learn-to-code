
angular.module('app', ['league', 'users', 'contenteditable', 'ngRoute','myapp-main','templates' ])
  .config(function ($routeProvider) {
    $routeProvider
      .otherwise({
        redirectTo: '/'
      });
  });
