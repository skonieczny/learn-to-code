
var module = angular.module('league');

module.controller('OIXGameBoardController', function($scope, $resource, $timeout, $rootScope) {
	
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
	
	var newBoard = function() {
		return new Board(variant.rows, variant.cols);		
	};

	var variant = new OIXVariant('small', 3, 3, 3);
	var board = newBoard();
	var code1 = null;
	var compiled_code_text = null;
	var breakRun = false;
	
	$scope.variant = variant;
	$scope.board = board;
	$scope.is_running = false;

	var compile = function(onSuccess, onError) {
		$scope.compiling = true;
		var Resource = $resource('/league/program/:id/compile', {'id' : '@id'});
		Resource.save({'id': $scope.program.id}, {'data': $scope.program.data.data}, 
		function(data) {
			$scope.compiling = false;
			$rootScope.message = 'Compiled! ';
			$scope.program.data.binary = data.binary;
			compiled_code_text = program.data.data;
			onSuccess();
		}, function (error) {
			$scope.compiling = false;
			var data = error.data;
			$rootScope.message = data[0] + ' ' + data[1].value;
			onError();		
		});
		// TODO: zero $scope.program.data.binary on data change
	};

	$scope.reset = function() {
		$scope.output = '';
		$scope.is_running = false;
		code1 = null;
		board = newBoard();
		$scope.board = board;
		breakRun = true;
	};

	var ensureCompiled = function(afterCompiled) {
		if (compiled_code_text === program.data.data) {
			afterCompiled();
			return;
		}
		compile(afterCompiled, function(){});
	};

	var _step = function() {
		if (code1 === null) {
			$scope.is_running = true;
			code1 = new OIXCode(program.data.binary, board);
			code1.vm.addBuiltin('debugger', new window.PythonVM.PyBuiltinFunction(pdb));
		}
		code1.step();
		if (!code1.vm.is_running) {
			$scope.is_running = false;
			$scope.output = code1.output;		
			code1 = null;
			return;
		}
		$scope.output = code1.output;		
	};

	$scope.step = function() { ensureCompiled(_step); };

	var pdb = function() {
		breakRun = true;
		return new window.PythonVM.PyInt(0);
	};

	var _run = function() {
		_step();
		if ($scope.is_running && !breakRun) {
			$timeout(_run, 0);
		}
	};

	$scope.run = function() { 
		if (breakRun) {
			breakRun = false;
			ensureCompiled(_run);
		} else {
			breakRun = true;			
		}
	};

});
