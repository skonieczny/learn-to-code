angular.module('users', ['ngRoute', 'db', 'ngResource'])
.config(function($routeProvider) {

	$routeProvider
	.when('/users/:id', {
		templateUrl : 'components/user.html',
		controller : 'UserPageCtrl'
	})
	.when('/register', {
		templateUrl : 'components/register.html',
		controller : 'RegisterPageCtrl'
	});

}).run(function(db, $resource) {

	var resource = $resource('/users/user', {
		id : '@id'
	});

	var UserClass = {
		'create' : function(id, meta) {
			return {
				'id': id, 
				'meta': meta,
			};
		},
		'load' : function(meta) {
			var data = resource.query({
				'id' : meta.id
			}, function() {
				meta.update(data[0]);
			});
		},
		'list' : function(list, spec) {
			resource.query(spec, function(response) {
				list.updateObjects(response);
			});
		}
	};

	db.declare('user', UserClass);

}).controller('UserPageCtrl', function($scope, $routeParams, db) {

	var id = $routeParams.id;
	$scope.user = db.model('user', id);

}).controller('RegisterPageCtrl', function($scope, $routeParams, db) {

}).controller('UserCreateForm', function($scope, $routeParams, db, $resource) {

	var Resource = $resource('/users/user', {
		'id' : '@id'
	});
	var resource = new Resource();

	$scope.user = resource;
	$scope.create = function() {
		resource.$save();
	};

});
