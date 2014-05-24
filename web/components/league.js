// TODO: remove
var cached = function(f) {
	var cache = [];
	return function() {
		if (cache.length > 0)
			return cache[0];
		var ret = f();
		cache[0] = ret;
		return ret;
	};
};

angular.module('league', ['ngRoute', 'db', 'ngResource'])
.config(function($routeProvider) {

	$routeProvider.when('/game/:id', {
		templateUrl : 'components/game.html',
		controller : 'GamePageCtrl'
	}).when('/program/:id', {
		templateUrl : 'components/program.html',
		controller : 'ProgramPageCtrl'
	}).when('/program/:id/edit', {
		templateUrl : 'components/program_edit.html',
		controller : 'ProgramEditPageCtrl'
	});

}).run(function(db, $resource) {

	var games = {
		'oix' : {
			'id' : 'oix',
			'name' : 'O and X'
		}
	};
	var GameClass = {
		'create' : function(id, meta) {
			var ret = games[id];
			ret.programsByScore = cached(function() {
				return db.list('program', {
					'game' : id,
					'order' : 'score-'
				});
			});
			return ret;
		},
		'load' : function(meta) {
			meta.update(games[meta.id]);
		}
	};

	var resource = $resource('/league/program', {
		id : '@id'
	});
	var ProgramClass = {
		'create': function(id, meta) {
			return {
				'id': id, 
				'meta': meta, 
				'author': function() {
					var ret = db.meta('user', meta.data.author);
					return ret;
				}};
		},
		'load': function(meta) {
			var data = resource.query({
				'id' : meta.id
			}, function() {
				meta.update(data[0]);
			});
		},
		'list': function(list, spec) {
			resource.query(spec, function(response) {
				list.updateObjects(response);
			});
		}
	};

	db.declare('game', GameClass);
	db.declare('program', ProgramClass);

}).controller('GamePageCtrl', function($scope, $routeParams, db) {

	var id = $routeParams.id;
	$scope.game = db.meta('game', id);

}).controller('ProgramPageCtrl', function($scope, $routeParams, db) {

	var id = $routeParams.id;
	$scope.program = db.meta('program', id);

}).controller('ProgramCreateForm', function($scope, $routeParams, $rootScope, $location, db, $resource) {

	var Resource = $resource('/league/program/:id', {
		'id' : '@id'
	});
	var resource = null;
	
	var clear = function() {
		resource = new Resource();
		resource.game = $scope.game.id;
		$scope.program = resource;
	};
	clear();

	$rootScope.message = null; 
	$scope.create = function() {
		resource.$save(function(data) { 
			clear();
			$rootScope.message = 'Saved!';
			$location.path('/program/' + data.id + '/edit');
		}, function (error) {
			$rootScope.message = 'Failed!'; 			
		});
	};

}).controller('ProgramEditPageCtrl', function($scope, $routeParams, db) {

	var id = $routeParams.id;
	$scope.program = db.meta('program', id);

}).controller('ProgramEditForm', function($scope, $routeParams, $rootScope, $location, db, $resource) {

	$scope.update = function() {
		var Resource = $resource('/league/program/:id', {
			'id' : '@id'
		});
		Resource.save({'id': $scope.program.id}, {'data': $scope.program.data.data}, 
		function(data) { 
			$rootScope.message = 'Saved!';
		}, function (error) {
			$rootScope.message = 'Failed!'; 			
		});

	};

	$scope.compile = function() {
		var Resource = $resource('/league/program/:id/compile', {'id' : '@id'});
		Resource.save({'id': $scope.program.id}, {'data': $scope.program.data.data}, 
		function(data) {
			$rootScope.message = 'Compiled! ';
			$scope.program.data.binary = data.binary;
		}, function (error) {
			var data = error.data;
			$rootScope.message = data[0] + ' ' + data[1].value; 			
		});

	};

});
