
var module = angular.module('league');

module.controller('OIXGameBoardController', function($scope) {
	
	var program = $scope.program;
	
	var OIXCode = function(binary, board) {
		var self = this;
		var stopped = true;
		this.board = board;
		this.output = '';
		this.step = function() {
			return self.vm.step();
		};

		var move = function(x, y) {
			if (x.__class__ !== 'int' || y.__class__ !== 'int') {
				throw 'Function "move" arguments must be int. ';
			}
			self.board.set(x.value, y.value, 1);
		};

		this.vm = new window.PythonVM.VM(binary);
		this.vm.setPrinter(function(item) { self.output += item; });
		this.vm.addBuiltin('id', new window.PythonVM.PyInt(157));
		this.vm.addBuiltin('move', new window.PythonVM.PyBuiltinFunction(move));
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
	var breakRun = false;
	
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
			code1.vm.addBuiltin('debugger', new window.PythonVM.PyBuiltinFunction(pdb));
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

	var pdb = function() {
		breakRun = true;
		return new window.PythonVM.PyInt(0);
	};

	$scope.run = function() {
		breakRun = false;
		do {
			$scope.step();
		} while ($scope.is_running && !breakRun);
	};

});
