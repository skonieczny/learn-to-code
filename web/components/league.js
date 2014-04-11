
// TODO: remove
var cached = function(f) {
	var cache = [];
	return function() {
		if (cache.length > 0) return cache[0];
		var ret = f();
		cache[0] = ret;
		return ret;
	};
};

angular.module('league', ['ngRoute', 'db', 'ngResource'])
  .config(function ($routeProvider) {

    $routeProvider
      .when('/game/:id', {
        templateUrl: 'components/game.html',
        controller: 'GamePageCtrl'
      })
      .when('/program/:id', {
        templateUrl: 'components/program.html',
        controller: 'ProgramPageCtrl'
      });

  })
  .run(function(db, $resource) {

  	var games = {'oix': {'id': 'oix', 'name': 'O and X'}};
    var GameClass = {
    	  'create': function(id, meta) { 
            var ret = games[id];
            ret.programsByScore = cached(function() {
              return db.list('program', {'game': id, 'order': 'score-'});
            });
            return ret;
    	  },
    	  'load': function(meta) {
    	  	return;
    	  }
    };

   	var resource = $resource('/program/:id', {id:'@id'});
    var ProgramClass = {
    		'create': function(id, meta) {
    			return {};
    		},
    		'load': function(meta) {
    			var data = resource.get({'id': meta.id}, function() {
    			  meta.loading = false;
    			  meta.loaded = false;
    			});
    			angular.forEach(meta.model, function(v, k) { delete meta.model[k]; });
    			angular.forEach(data, function(v, k) { meta.model[k] = v; });
    		},
    		'list': function(spec) {
    			return resource.query(spec);
    		}
    };

    db.declare('game', GameClass);
    db.declare('program', ProgramClass);
  })
  .controller('GamePageCtrl', function ($scope, $routeParams, db) {
  	var id = $routeParams.id;
    $scope.game = db.model('game', id);
  })
  .controller('ProgramPageCtrl', function ($scope, $routeParams, db) {
  	var id = $routeParams.id;
    $scope.game = db.model('program', id);
  })
  .controller('ProgramCreateForm', function ($scope, $routeParams, db) {
    $scope.program = {};
  })
;
