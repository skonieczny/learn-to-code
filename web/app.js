
angular.module('app', ['league', 'users', 'contenteditable', 'ngRoute','myapp-main','templates', 'ui.bootstrap'])
  .config(function ($routeProvider) {
    $routeProvider
      .otherwise({
        redirectTo: '/'
      });
  });
