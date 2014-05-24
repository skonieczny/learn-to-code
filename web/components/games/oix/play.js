
var module = angular.module('league');

module.controller('OIXGameBoardController', function($scope) {
	
	var program = $scope.program;
	
	var OIXCode = function(binary, board) {
		var self = this;
		this.board = board;
		this.vm = new window.VM(binary);
		this.output = '';
		this.vm.setPrinter(function(item) { self.output += item; });
		this.step = function() {
			return self.vm.step();
		};
	};
	
	var EMPTY = 0;
	
	var OIXVariant = function(type, rows, cols, in_row) {
		this.type = type;
		this.rows = rows;
		this.cols = cols;
		this.in_row = in_row;
	};
	
	var Board = function(w, h) {
		var self = this;
		this.rows = [];
		for (var j = 0; j < h; j++) {
			var row = [];
			this.rows.push(row);
			for (var i = 0; i < w; i++) {
				row.push(EMPTY);
			}	
		}
		
		this.get = function(x, y) {
			return this.rows[y][x];
		};

		this.set = function(x, y, v) {
			this.rows[y][x] = v;
		};
	};

	var variant = new OIXVariant('small', 3, 3, 3);
	var board = new Board(variant.rows, variant.cols);
	var code1 = null;
	
	$scope.variant = variant;
	$scope.board = board;
	$scope.is_running = false;

	$scope.reset = function() {
		$scope.output = '';
		$scope.is_running = false;
		code1 = null;
	};

	$scope.step = function() {
		if (code1 === null) {
			code1 = new OIXCode(program.data.binary, board);
			$scope.output = code1.output;
			$scope.is_running = true;
			return;
		}
		if (!code1.step()) {
			$scope.is_running = false;
			$scope.output = code1.output;		
			code1 = null;
			return;
		}
		$scope.output = code1.output;		
	};

	$scope.run = function() {
		do {
			$scope.step();
		} while ($scope.is_running);
	};

});
