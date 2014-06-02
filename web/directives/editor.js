angular.module('league').directive('editor', function() {
	return {
		restrict: 'AE',
		templateUrl: 'directives/editor.html',
		scpoe: {'model': '&'}
	};
}); 