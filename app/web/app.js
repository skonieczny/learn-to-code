
angular.module('app', ['league', 'users', 'contenteditable', 'ngRoute','myapp-main','templates', 'ui.bootstrap'])
  .config(function ($routeProvider) {
    $routeProvider
      .otherwise({
        redirectTo: '/'
      });
  });

'app controller goes here';
'common service goes here';
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

angular.module('league', ['ngRoute', 'db', 'ngResource', 'ui.ace'])
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

	$scope.edit_disabled = false;

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

});

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

angular.module('league').directive('editor', function() {
	return {
		restrict: 'AE',
		templateUrl: 'directives/editor.html',
		scpoe: {'model': '&'}
	};
}); 
var module = angular.module('db', []);

module.factory('db', function() {

	var Meta = function(db, type, id) {
		var self = this;
		self.db = db;
		self.type = type;
		self.id = id;
		self.loaded = false;
		self.loading = false;
		self.model = null;
		self.data = {'id': id};

		self.load = function() {
			if (self.loaded)
				return;
			if (self.loading)
				return;
			self.loading = true;
			db.types[type].load(self);
		};

		self.update = function(newData) {
			self.loading = false;
			self.loaded = true;
			self.data = newData;
			// TODO: trigger event
		};
	};

	var List = function(db, type, spec) {
		var self = this;
		self.db = db;
		self.type = type;
		self.spec = spec;
		self.loaded = false;
		self.loading = false;
		self.ids = [];

		self.load = function() {
			if (self.loaded)
				return;
			if (self.loading)
				return;
			self.loading = true;
			self.ids = [];
			db.types[type].list(self, self.spec);
		};

		self.items = function() {
			var ret = [];
			for (var i = 0; i < self.ids.length; i++) {
				var id = self.ids[i];
				// TODO: id?
				var meta = db.meta(type, id);
				meta.load();
				ret.push(meta);
			}
			return ret;
		};

		self.models = function() {
			var ret = [];
			var items = self.items();
			for (var i = 0; i < items.length; i++) {
				var model = items[i].model;
				ret.push(model);
			}
			return ret;
		};

		self.update = function(ids) {
			self.loading = false;
			self.loaded = true;
			self.ids = ids;
		};
		
		self.updateObjects = function(dataList) {
			var ids = [];
			for (var i = 0; i < dataList.length; i++) {
				var obj = dataList[i];
				ids.push(obj.id);
				self.db.meta(self.type, obj.id, obj);
				self.update(ids);
			}
		};

	};

	var Db = function() {
		var self = this;
		self.types = {};
		self.models = {};
		
		self.declare = function(type, cls) {
			self.types[type] = cls;
			self.models[type] = {};
		};

		self.meta = function(type, id, data) {
			if (self.models[type][id] === undefined) {
				var meta = new Meta(self, type, id);
				var model = self.types[type].create(id, meta);
				meta.model = model;
				self.models[type][id] = meta;
				if (data !== undefined)
					meta.update(data);
			}
			var ret = self.models[type][id];
// TODO: with timeoout
 			ret.load();
			return ret;
		};
		
		self.model = function(type, id) {
			return self.meta(type, id).model;
		};
		
		self.list = function(type, spec) {
			var ret = new List(self, type, spec);
			ret.load();
			return ret;
		};
		
		self.updateObject = function(type, id, newData) {
			var model = self.model(type, id);
		};
		
	};
	return new Db();
}); 

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

/**
 * @see http://docs.angularjs.org/guide/concepts
 * @see http://docs.angularjs.org/api/ng.directive:ngModel.NgModelController
 * @see https://github.com/angular/angular.js/issues/528#issuecomment-7573166
 */

angular.module('contenteditable', []).directive('contenteditable', function() {
	return {
		restrict : 'A',
		require : '?ngModel',
		link : function(scope, element, attr, ngModel) {
			if (!ngModel) {
				return;
			}
			
			ngModel.$render = function() {
				var html = ngModel.$viewValue;
				html = html.replace(/\&/g, '&amp;');
				html = html.replace(/</g, '&lt;');
				html = html.replace(/\>/g, '&gt;');
				html = html.replace(/\"/g, '&quot;');
				html = html.replace(/\n/g, '<br>');
				html = html.replace(/ /g, '&nbsp;');
				return element.html(html);
			};
			
			element.bind('blur', function() {
				if (ngModel.$viewValue !== element.html().trim()) {
					return scope.$apply(read);
				}
			});
			
			var read = function() {
				var html = element.html().trim();
				var text = html.replace(/\n/g, '').replace(/\r/g, '');
				text = text.replace(/<br>/g, '\n');
				text = text.replace(/<\/div>/g, '\n');
				text = text.replace(/<div[^>]*>/g, '\n');
				text = text.replace(/(<([^>]+)>)/g, "");
				text = text.replace(/&nbsp;/g, " ");
				text = text.replace(/&amp;/g, "&");
				text = text.replace(/&lt;/g, "<");
				text = text.replace(/&gt;/g, ">");
				text = text.replace(/&quote;/g, "\"");
				return ngModel.$setViewValue(text);
			};
			return read;
		}
	};
}); 

window.PythonVM = window.PythonVM || {};
(function(exports) {

	var opnames = ['STOP_CODE', 'POP_TOP', 'ROT_TWO', 'ROT_THREE', 'DUP_TOP', 'ROT_FOUR', '<6>', '<7>', '<8>', 'NOP', 'UNARY_POSITIVE', 'UNARY_NEGATIVE', 'UNARY_NOT', 'UNARY_CONVERT', '<14>', 'UNARY_INVERT', '<16>', '<17>', '<18>', 'BINARY_POWER', 'BINARY_MULTIPLY', 'BINARY_DIVIDE', 'BINARY_MODULO', 'BINARY_ADD', 'BINARY_SUBTRACT', 'BINARY_SUBSCR', 'BINARY_FLOOR_DIVIDE', 'BINARY_TRUE_DIVIDE', 'INPLACE_FLOOR_DIVIDE', 'INPLACE_TRUE_DIVIDE', 'SLICE+0', 'SLICE+1', 'SLICE+2', 'SLICE+3', '<34>', '<35>', '<36>', '<37>', '<38>', '<39>', 'STORE_SLICE+0', 'STORE_SLICE+1', 'STORE_SLICE+2', 'STORE_SLICE+3', '<44>', '<45>', '<46>', '<47>', '<48>', '<49>', 'DELETE_SLICE+0', 'DELETE_SLICE+1', 'DELETE_SLICE+2', 'DELETE_SLICE+3', 'STORE_MAP', 'INPLACE_ADD', 'INPLACE_SUBTRACT', 'INPLACE_MULTIPLY', 'INPLACE_DIVIDE', 'INPLACE_MODULO', 'STORE_SUBSCR', 'DELETE_SUBSCR', 'BINARY_LSHIFT', 'BINARY_RSHIFT', 'BINARY_AND', 'BINARY_XOR', 'BINARY_OR', 'INPLACE_POWER', 'GET_ITER', '<69>', 'PRINT_EXPR', 'PRINT_ITEM', 'PRINT_NEWLINE', 'PRINT_ITEM_TO', 'PRINT_NEWLINE_TO', 'INPLACE_LSHIFT', 'INPLACE_RSHIFT', 'INPLACE_AND', 'INPLACE_XOR', 'INPLACE_OR', 'BREAK_LOOP', 'WITH_CLEANUP', 'LOAD_LOCALS', 'RETURN_VALUE', 'IMPORT_STAR', 'EXEC_STMT', 'YIELD_VALUE', 'POP_BLOCK', 'END_FINALLY', 'BUILD_CLASS', 'STORE_NAME', 'DELETE_NAME', 'UNPACK_SEQUENCE', 'FOR_ITER', 'LIST_APPEND', 'STORE_ATTR', 'DELETE_ATTR', 'STORE_GLOBAL', 'DELETE_GLOBAL', 'DUP_TOPX', 'LOAD_CONST', 'LOAD_NAME', 'BUILD_TUPLE', 'BUILD_LIST', 'BUILD_SET', 'BUILD_MAP', 'LOAD_ATTR', 'COMPARE_OP', 'IMPORT_NAME', 'IMPORT_FROM', 'JUMP_FORWARD', 'JUMP_IF_FALSE_OR_POP', 'JUMP_IF_TRUE_OR_POP', 'JUMP_ABSOLUTE', 'POP_JUMP_IF_FALSE', 'POP_JUMP_IF_TRUE', 'LOAD_GLOBAL', '<117>', '<118>', 'CONTINUE_LOOP', 'SETUP_LOOP', 'SETUP_EXCEPT', 'SETUP_FINALLY', '<123>', 'LOAD_FAST', 'STORE_FAST', 'DELETE_FAST', '<127>', '<128>', '<129>', 'RAISE_VARARGS', 'CALL_FUNCTION', 'MAKE_FUNCTION', 'BUILD_SLICE', 'MAKE_CLOSURE', 'LOAD_CLOSURE', 'LOAD_DEREF', 'STORE_DEREF', '<138>', '<139>', 'CALL_FUNCTION_VAR', 'CALL_FUNCTION_KW', 'CALL_FUNCTION_VAR_KW', 'SETUP_WITH', '<144>', 'EXTENDED_ARG', 'SET_ADD', 'MAP_ADD', '<148>', '<149>', '<150>', '<151>', '<152>', '<153>', '<154>', '<155>', '<156>', '<157>', '<158>', '<159>', '<160>', '<161>', '<162>', '<163>', '<164>', '<165>', '<166>', '<167>', '<168>', '<169>', '<170>', '<171>', '<172>', '<173>', '<174>', '<175>', '<176>', '<177>', '<178>', '<179>', '<180>', '<181>', '<182>', '<183>', '<184>', '<185>', '<186>', '<187>', '<188>', '<189>', '<190>', '<191>', '<192>', '<193>', '<194>', '<195>', '<196>', '<197>', '<198>', '<199>', '<200>', '<201>', '<202>', '<203>', '<204>', '<205>', '<206>', '<207>', '<208>', '<209>', '<210>', '<211>', '<212>', '<213>', '<214>', '<215>', '<216>', '<217>', '<218>', '<219>', '<220>', '<221>', '<222>', '<223>', '<224>', '<225>', '<226>', '<227>', '<228>', '<229>', '<230>', '<231>', '<232>', '<233>', '<234>', '<235>', '<236>', '<237>', '<238>', '<239>', '<240>', '<241>', '<242>', '<243>', '<244>', '<245>', '<246>', '<247>', '<248>', '<249>', '<250>', '<251>', '<252>', '<253>', '<254>', '<255>'];
	var comparators = ['<', '<=', '==', '!=', '>', '>=', 'in', 'not in', 'is', 'is not', 'exception match', 'BAD'];
	var have_argument = 90;

	var isInt = function(jsValue) {
		return typeof jsValue === 'number' && jsValue % 1 === 0;
	};
	
	var truthy = function(x) {
		if (x.__class__ === 'None') return false;
		if (x.__class__ === 'bool') return x.value;
		if (x.__class__ === 'int') return x.value !== 0;
		if (x.__class__ === 'float') return x.value !== 0;
		if (x.__class__ === 'unicode') return x.value !== '';
		if (x.__class__ === 'list') return x.value.length >= 0;
		if (x.__class__ === 'dict') return x.keys().length >= 0;
		return false;
	};

	var iter = function(a) {
		if (a.__class__ === 'list')
			return [0, a.value];
		if (a.__class__ === 'dict')
			return [0, a.keys()];
		throw 'PyException: can not iter over ' + a.__class__;
	};

	var str = function(x) {
		if (x.__str__ !== undefined) return x.__str__();
		return '<object of type ' + x.__class__ + ' (' + x + ')>';
	};
	exports.str = str;
	
	var len = function(x) {
		if (x.__len__ !== undefined) return new exports.PyInt(x.__len__());
		throw 'PyException: can not call len with ' + x.__class__;
	};
	
	var VM = function(binary){
		var self = this;
		var fun = binary;
		var code = binary.co_code;
		var builtins = {};
		builtins.len = new exports.PyBuiltinFunction(len);

		var pos = 0;

		var stack = [];
		var env = builtins;
		var global_env = builtins;
		var blocks = [];
		var calls = [];
		
		var stdout = function(item) { console.log('PRINT', item); };
		
		this.setPrinter = function(new_stdout) {
			stdout = new_stdout;
		};

		this.addBuiltin = function(name, value) {
			builtins[name] = value;
		};
		
		this.is_running = true;

		this.step = function() {
			var code = fun.co_code;
			var instruction = code.charCodeAt(pos);
			var argument = null;
			pos += 1;
			if (instruction >= have_argument) {
				argument = code.charCodeAt(pos + 1) * 256 + code.charCodeAt(pos);
				pos += 2;
			}
			var name = opnames[instruction];
			console.log('OPERATION', name, argument);
			var handler = operations[name];
			if (handler === undefined) {
				self.is_running = false;
				throw 'Unsupported instruction: ' + name + ' (' + instruction + ')';
			}
			try {
				handler(argument);				
			} catch (e) {
				pos = -1;
				self.is_running = false;
				throw e;
			};
			console.log('STACK: ', stack, '. ENV: ', env, '. BLOCK: ' + blocks, '. CALLS: ', calls);
			if (pos < 0) self.is_running = false;
		};

		var operations = {};
		
		operations.STOP_CODE = function() {
			pos = -1;
		};

		operations.POP_TOP = function() {
			stack.pop();
		};

		operations.LOAD_CONST = function(arg) {
			var value = exports.nativeToInternal(fun.co_consts[arg]);
			stack.push(value);
		};

		operations.PRINT_ITEM = function() {
			var value = stack.pop();
			stdout(str(value));
		};

		operations.PRINT_NEWLINE = function() {
			stdout('\n');
		};
		
		operations.SETUP_LOOP = function(arg) {
			blocks.push([pos, pos + arg]);
		};

		operations.GET_ITER = function() {
			var a = stack.pop();
			stack.push(iter(a));
		};

		operations.FOR_ITER = function(arg) {
			var iter = stack.pop();
			var index = iter[0];
			var iterable = iter[1];
			if (index < iterable.length) {
				iter[0] += 1;
				stack.push(iter);
				stack.push(iterable[index]);
			} else {
				pos += arg;
			}
		};

		operations.POP_BLOCK = function(arg) {
			blocks.pop();
		};
		
		operations.MAKE_FUNCTION = function(arg) {
			var fun = stack.pop();
			var default_args = [];
			for (var i = 0; i < arg; i++) {
				default_args.push(stack.pop());
			}
			if (Object.prototype.toString.call(fun) !== '[object Object]')
				throw 'Can not create function with wrong internals. ';
			stack.push(new exports.PyFunction(fun, default_args));
		};

		operations.CALL_FUNCTION = function(arg) {
			var args_count = arg % 256;
			var kwargs_count = Math.floor(arg / 256);
			var args = [];
			var kwargs = {};
			for (var i = 0; i < kwargs_count; i++) {
				var value = stack.pop();
				var key = stack.pop();
				if (key.__class__ !== 'unicode') throw 'PyException: kwarg name must be string';
				kwargs[key.value] = value;
			}
			for (i = 0; i < args_count; i++) {
				var val = stack.pop();
				args.push(val);
			}
			var f = stack.pop();
			if (f.__class__ === 'function') {
				calls.push([fun, pos, env, blocks]);
				fun = f.value;
				pos = 0;
				env = kwargs;
				blocks = [];
				for (i = 0; i < fun.co_varnames.length; i++) {
					if (env[fun.co_varnames[i]] !== undefined) continue;
					env[fun.co_varnames[i]] = i < args.length ? args[args.length - i - 1] : f.default_kwargs[f.default_kwargs.length - i - 1];
				}
				return;
			}
			if (f.__class__ === 'builtin-function') {
				stack.push(f.apply(args, kwargs));
				return;
			}
			// TODO: raise PyException
			throw 'PyException: type "' + f.__class__ + '" is not callable. ';
		};

		operations.RETURN_VALUE = function() {
			if (calls.length === 0) {
				pos = -1;
				return;
			}
			var last_call = calls.pop();
			fun = last_call[0];
			pos = last_call[1];
			env = last_call[2];
			blocks = last_call[3];
		};

		operations.LOAD_GLOBAL = function(arg) {
			stack.push(global_env[fun.co_names[arg]]);
		};

		operations.LOAD_FAST = function(arg) {
			stack.push(env[fun.co_varnames[arg]]);
		};

		operations.STORE_NAME = function(arg) {
			var name = fun.co_names[arg];
			env[name] = stack.pop();
		};

		operations.STORE_MAP = function(arg) {
			var key = stack.pop();
			var value = stack.pop();
			var dict = stack.pop();
			if (dict.__class__ !== 'dict') throw 'PyException: Can not store key in ' + dict.__class__;
			dict.set(key, value);
			stack.push(dict);
		};
		
		operations.STORE_SUBSCR = function(arg) {
			var key = stack.pop();
			var obj = stack.pop();
			var value = stack.pop();
			var ok = false;
			if (obj.__class__ === 'list') {
				if (key.__class__ !== 'int') throw 'PyException: List index must be int';
				obj.value[key.value] = value;
				ok = true;
			}
			if (obj.__class__ === 'dict') {
				obj.set(key, value);
				ok = true;
			}
			if (!ok) throw 'PyException: Can not store key in ' + obj.__class__;
//			stack.push(obj);
		};

		operations.DELETE_SUBSCR = function(arg) {
			var key = stack.pop();
			var obj = stack.pop();
			var ok = false;
			if (obj.__class__ === 'list') {
				if (key.__class__ !== 'int') throw 'PyException: List index must be int';
				if (key.value >= obj.value.length) throw 'PyException: List index out of range';
				obj.value.splice(key.value, 1);
				ok = true;
			}
			if (obj.__class__ === 'dict') {
				obj.del(key);
				ok = true;
			}
			if (!ok) throw 'PyException: Can not store key in ' + obj.__class__;
//			stack.push(obj);
		};

		operations.LOAD_NAME = function(arg) {
			var name = fun.co_names[arg];
			stack.push(env[name]);
		};

		operations.LOAD_ATTR = function(arg) {
			var name = fun.co_names[arg];
			var obj = stack.pop();
			var attr = obj.getattr(name);
			if (attr === null) throw 'PyException: no attr ' + name;
			stack.push(attr);
		};

		// jumps

		operations.POP_JUMP_IF_TRUE = function(arg) {
			var a = stack.pop();
			if (truthy(a)) pos = arg;
		};
		
		operations.POP_JUMP_IF_FALSE = function(arg) {
			var a = stack.pop();
			if (!truthy(a)) pos = arg;
		};
		
		operations.JUMP_FORWARD = function(arg) {
			pos += arg;
		};
		
		operations.JUMP_ABSOLUTE = function(arg) {
			pos = arg;
		};
		
		// bulders 
		
		operations.BUILD_LIST = function(arg) {
			var a = [];
			for (var i = 0; i < arg; i++) {
				a[arg - i - 1] = stack.pop();
			}
			stack.push(new exports.PyList(a));
		};
		
		operations.BUILD_MAP = function(arg) {
			stack.push(new exports.PyDict({}));
		};
		
		// UNARY

		operations.UNARY_POSITIVE = function() {
			var a = stack.pop();
			stack.push(a);
		};
		
		operations.UNARY_NEGATIVE = function() {
			var a = stack.pop();
			if (a.__class__ === 'int') {
				stack.push(new exports.PyInt(-a.value));
				return;
			}
			if (a.__class__ === 'float') {
				stack.push(new exports.PyFloat(-a.value));
				return;
			}
			throw 'PyException: can not unary minus with ' + a.__class__;
		};
		
		operations.UNARY_CONVERT = function() {
			var a = stack.pop();
			stack.push(new exports.PyUnicode(str(a)));
		};

		operations.UNARY_INVERT = function() {
			var a = stack.pop();
			stack.push(new exports.PyBool(!truthy(a)));
		};
		
		// compare

		operations.COMPARE_OP = function(arg) {
			var i, ret;
			// var comparators = ['<', '<=', '==', '!=', '>', '>=', 'in', 'not in', 'is', 'is not', 'exception match', 'BAD;
			var a1 = stack.pop();
			var a2 = stack.pop();

			// in, not in
			if (arg === 6 || arg === 7) {
				ret = false;
				var ok = false;
				if (a1.__class__ === 'unicode') {
					if (a2.__class__ !== 'unicode') throw 'PyException: \'in <string>\' requires string as left operand, not ' + a2.__class__;
					ret = a1.value.indexOf(a2.value) >= 0;
					ok = true;
				}
				if (a1.__class__ === 'list') {
					for (i = 0; i < a1.value.length; i++) {
						if (a1.value[i].eq(a2)) ret = true;
					}
					ok = true;
				}
				if (a1.__class__ === 'dict') {
					var keys = a1.keys();
					for (i = 0; i < keys.length; i++) {
						if (keys[i].eq(a2)) ret = true;
					}
					ok = true;
				}
				if (!ok) throw 'PyException: Can not search in ' + a1.__class__;
				if (arg === 7) ret = !ret;
				stack.push(new exports.PyBool(ret));
				return;
			}

			// is, not is
			if (arg === 8 || arg == 9) {
				ret = false;
				if (a1.__class__ === a2.__class__) {
					if (a1.immutable && a1.value == a2.value) ret = true;
					if (!a1.immutable && a1.value === a2.value) ret = true;
				}
				if (arg === 9) ret = !ret;
				stack.push(new exports.PyBool(ret));
				return;
			}

			// eq
			if (arg === 2) {
				stack.push(new exports.PyBool(a2.eq(a1)));
				return;
			}
			// not eq
			if (arg === 3) {
				stack.push(new exports.PyBool(!a2.eq(a1)));
				return;
			}

			// compares
			var v1 = a1;
			var v2 = a2;
			if ((a1.isNumber && a2.isNumber) ||
				(a1.__class__ === 'None' && a2.__class__ === 'None') ||
				(a1.__class__ === 'bool' && a2.__class__ === 'bool') ||
				(a1.__class__ === 'unicode' && a2.__class__ === 'unicode') ||
				(a1.__class__ === 'list' && a2.__class__ === 'list')) {
				v1 = a1.value;
				v2 = a2.value;
			}
			// <
			if (arg === 0) {
				stack.push(new exports.PyBool(v2 < v1));
				return;
			}
			// <=
			if (arg === 1) {
				stack.push(new exports.PyBool(v2 < v1 || a2.eq(a1)));
				return;
			}
			// >
			if (arg === 4) {
				stack.push(new exports.PyBool(v2 > v1));
				return;
			}
			// >=
			if (arg === 5) {
				stack.push(new exports.PyBool(v2 > v1 || a2.eq(a1)));
				return;
			}
			log.warning('Unknown comparator: ' + arg);
			stack.push(new exports.PyBool(false));
		};

		// BINARY

		operations.BINARY_POWER = function() {
			// TODO: check types
			var a1 = stack.pop();
			var a2 = stack.pop();
			if (a1.isNumber && a2.isNumber) {
				if (a1.__class__ === 'float' || a2.__class__ === 'float') {
					stack.push(new exports.PyFloat(Math.pow(a1.value, a2.value)));
				} else {
					stack.push(new exports.PyInt(Math.pow(a1.value, a2.value)));
				}
				return;
			}
			throw 'PyException: can not power ' + a2.__class__ + ' and ' + a1.__class__;
		};

		operations.BINARY_MULTIPLY = function() {
			var a1 = stack.pop();
			var a2 = stack.pop();
			if (a1.isNumber && a2.isNumber) {
				if (a1.__class__ === 'float' || a2.__class__ === 'float') {
					stack.push(new exports.PyFloat(a1.value * a2.value));
				} else {
					stack.push(new exports.PyInt(a1.value * a2.value));
				}
				return;
			}
			if (a1.__class__ === 'int') {
				var tmp = a2;
				a2 = a1;
				a1 = tmp;
			}
			var ret, i;
			if (a2.__class__ === 'int') {
				if (a1.__class__ === 'unicode') {
					ret = '';
					for (i = 0; i < a2.value; i++) {
						ret += a1.value;
					}
					stack.push(new exports.PyUnicode(ret));
					return;
				}
				if (a1.__class__ === 'list') {
					ret = [];
					for (i = 0; i < a2.value; i++) {
						ret += ret.concat(a1.value);
					}
					stack.push(new exports.PyList(ret));
					return;
				}
			}
			throw 'PyException: can not multiply ' + a1.__class__ + ' and ' + a2.__class__;
		};

		operations.BINARY_DIVIDE = function() {
			var a1 = stack.pop();
			var a2 = stack.pop();
			if (a1.isNumber && a2.isNumber) {
				if (a1.__class__ === 'float' || a2.__class__ === 'float') {
					stack.push(new exports.PyFloat(a2.value / a1.value));
				} else {
					stack.push(new exports.PyInt(Math.floor(a2.value / a1.value)));
				}
				return;
			}
			throw 'PyException: can not divide ' + a2.__class__ + ' and ' + a1.__class__;
		};

		operations.BINARY_FLOOR_DIVIDE = function() {
			// TODO: check types
			var a1 = stack.pop();
			var a2 = stack.pop();
			if (a1.isNumber && a2.isNumber) {
				stack.push(new exports.PyInt(Math.floor(a2.value / a1.value)));
				return;
			}
			throw 'PyException: can not divide ' + a2.__class__ + ' and ' + a1.__class__;
		};

		operations.BINARY_TRUE_DIVIDE = function() {
			var a1 = stack.pop();
			var a2 = stack.pop();
			if (a1.isNumber && a2.isNumber) {
				stack.push(new exports.PyFloat(a2.value / a1.value));
				return;
			}
			throw 'PyException: can not divide ' + a2.__class__ + ' and ' + a1.__class__;
		};

		operations.BINARY_MODULO = function() {
			var a1 = stack.pop();
			var a2 = stack.pop();
			if (a1.isNumber && a2.isNumber) {
				stack.push(new exports.PyFloat(a2.value % a1.value));
				return;
			}
			throw 'PyException: can not modulo ' + a2.__class__ + ' and ' + a1.__class__;
		};

		operations.BINARY_ADD = function() {
			var a1 = stack.pop();
			var a2 = stack.pop();
			if (a1.isNumber && a2.isNumber) {
				if (a1.__class__ === 'float' || a2.__class__ === 'float') {
					stack.push(new exports.PyFloat(a1.value + a2.value));
				} else {
					stack.push(new exports.PyInt(a1.value + a2.value));
				}
				return;
			}
			if (a1.__class__ === 'list' && a2.__class__ === 'list') {
				stack.push(new exports.PyList(a2.value.concat(a1.value)));
				return;
			}
			if (a2.__class__ === 'unicode') {
				stack.push(new exports.PyUnicode(a2.value + str(a1)));
				return;
			}
			throw 'PyException: can not add ' + a2.__class__ + ' and ' + a1.__class__;
		};

		operations.BINARY_SUBTRACT = function() {
			var a1 = stack.pop();
			var a2 = stack.pop();
			if (a1.isNumber && a2.isNumber) {
				if (a1.__class__ === 'float' || a2.__class__ === 'float') {
					stack.push(new exports.PyFloat(a2.value - a1.value));
				} else {
					stack.push(new exports.PyInt(a2.value - a1.value));
				}
				return;
			}
			throw 'PyException: can not substract ' + a1.__class__ + ' from ' + a2.__class__;
		};

		operations.BINARY_SUBSCR = function() {
			var a1 = stack.pop();
			var a2 = stack.pop();
			if (a2.__class__ === 'list') {
				if (a1.__class__ === 'int') {
					stack.push(a2.value[a1.value]);
					return;
				}
				throw 'PyException: list index must be int. ';
			}
			if (a2.__class__ === 'dict') {
				if (a1.immutable) {
					var v = a2.get(a1);
					if (v === null) {
						// TODO: throw IndexError
						v = new exports.PyNone();
					}
					stack.push(v);
					return;
				}
				throw 'PyException: dict index must be immutable. ';
			}
			throw 'PyException: only lists and dicts are indexable, not ' + a1.__class__;
		};

		operations.BINARY_LSHIFT = function() {
			var a1 = stack.pop();
			var a2 = stack.pop();
			if (a1.__class__ === 'int' && a2.__class__ === 'int') {
				stack.push(new exports.PyInt(a2.value << a1.value));
				return;
			}
			throw 'PyException: can not lshift ' + a2.__class__ + ' and ' + a1.__class__;
		};

		operations.BINARY_RSHIFT = function() {
			var a1 = stack.pop();
			var a2 = stack.pop();
			if (a1.__class__ === 'int' && a2.__class__ === 'int') {
				stack.push(new exports.PyInt(a2.value << a1.value));
				return;
			}
			throw 'PyException: can not rshift ' + a2.__class__ + ' and ' + a1.__class__;
		};

		operations.BINARY_AND = function() {
			var a1 = stack.pop();
			var a2 = stack.pop();
			stack.push(new exports.PyBool(truthy(a2) && truthy(a1)));
		};

		operations.BINARY_OR = function() {
			var a1 = stack.pop();
			var a2 = stack.pop();
			stack.push(new exports.PyBool(truthy(a2) || truthy(a1)));
		};

		operations.BINARY_XOR = function() {
			var a1 = stack.pop();
			var a2 = stack.pop();
			stack.push(new exports.PyBool(truthy(a2) ? !truthy(a1) : truthy(a1)));
		};
		
		// inplace
		
		//TODO:
		operations.INPLACE_POWER = operations.BINARY_POWER;
		operations.INPLACE_MULTIPLY = operations.BINARY_MULTIPLY;
		operations.INPLACE_DIVIDE = operations.BINARY_DIVIDE;
		operations.INPLACE_FLOOR_DIVIDE = operations.BINARY_FLOOR_DIVIDE;
		operations.INPLACE_TRUE_DIVIDE = operations.BINARY_TRUE_DIVIDE;
		operations.INPLACE_MODULO = operations.BINARY_MODULO;
		operations.INPLACE_ADD = operations.BINARY_ADD;
		operations.INPLACE_SUBTRACT = operations.BINARY_SUBTRACT;
		operations.INPLACE_LSHIFT = operations.BINARY_LSHIFT;
		operations.INPLACE_RSHIFT = operations.BINARY_RSHIFT;
		operations.INPLACE_AND = operations.BINARY_AND;
		operations.INPLACE_XOR = operations.BINARY_XOR;
		operations.INPLACE_OR = operations.BINARY_OR;
		

	};
	
	exports.VM = VM;
})(window.PythonVM);


window.PythonVM = window.PythonVM || {};
(function(exports) {
	
	var PyClass = function() {
		this.__class__ = 'type';
	};
	exports.PyClass = PyClass;
	
	var PyNone = function() {
		var self = this;
		this.__class__ = 'None';
		this.__str__ = function() { return 'None'; };
		this.immutable = true;
		this.eq = function(o) { return o.__class__ === self.__class; };
		this.getattr = function(o) { return null; };
	};
	exports.PyNone = PyNone;
	
	var PyBool = function(value) {
		var self = this;
		this.__class__ = 'bool';
		this.value = value;
		this.__str__ = function() { return value ? 'True' : 'False'; };
		this.immutable = true;
		this.eq = function(o) { return o.__class__ === self.__class__ && o.value === self.value; };
		this.getattr = function(o) { return null; };
	};
	exports.PyBool = PyBool;
	
	var PyInt = function(value) {
		var self = this;
		this.__class__ = 'int';
		this.value = value;
		this.isNumber = true;
		this.__str__ = function() { return value; };
		this.immutable = true;
		this.eq = function(o) { return o.__class__ === self.__class__ && o.value === self.value; };
		this.getattr = function(o) { return null; };
	};
	exports.PyInt = PyInt;
	
	var PyFloat = function(value) {
		var self = this;
		this.__class__ = 'float';
		this.value = value;
		this.isNumber = true;
		this.__str__ = function() { return value; };
		this.immutable = true;
		this.eq = function(o) { return o.__class__ === self.__class__ && o.value === self.value; };
		this.getattr = function(o) { return null; };
	};
	exports.PyFloat = PyFloat;

	var PyUnicode = function(value) {
		var self = this;
		this.__class__ = 'unicode';
		this.value = value;
		this.__str__ = function() { return value; };
		this.immutable = true;
		this.__len__ = function() {
			return this.value.length;
		};
		this.eq = function(o) { return o.__class__ === self.__class__ && o.value === self.value; };
		this.getattr = function(o) { return null; };
	};
	exports.PyUnicode = PyUnicode;

	var PyList = function(value) {
		var self = this;
		this.__class__ = 'list';
		this.value = value;
		this.__str__ = function() {
			var ret = '[';
			for (var i = 0; i < self.value.length; i++) {
				ret += exports.str(self.value[i]) + ', ';
			}
			ret += ']';
			return ret; 
		};
		this.__len__ = function() {
			return this.value.length; 
		};
		this.eq = function(o) { 
			if (o.__class__ !== self.__class) return false;
			if (self.value.length != o.value.length) return false;
			for (var i = 0; i < self.value.length; i++) {
				if (!v1.eq(v2)) return false;
			}
			return true;
		};
		this.getattr = function(attrName) { return self.__dict__[attrName] || null; };
		this.__dict__ = {
			'append': new PyBuiltinFunction(function(item) { self.value.push(item); })
		};
	};
	exports.PyList = PyList;

	var PyDict = function() {
		var self = this;
		this.__class__ = 'dict';
		this.value = [];
		this.keys = function() {
			var ret = [];
			for (var i = 0; i < self.value.length; i++) {
				ret.push(this.value[i][0]);
			}
			return ret;
		};
		this.get = function(key) {
			var ret = [];
			for (var i = 0; i < self.value.length; i++) {
				if (this.value[i][0].eq(key)) return this.value[i][1];
			}
			return null;
		};
		this.del = function(key) {
			for (var i = 0; i < self.value.length; i++) {
				if (this.value[i][0].eq(key)) {
					this.value.splice(i, 0);
					return;
				}
			}
			throw 'PyException: no such index';
		};
		this.set = function(key, value) {
			var ret = [];
			for (var i = 0; i < self.value.length; i++) {
				if (this.value[i][0].eq(key)){
					this.value[i][1] = value;
					return;
				}
			}
			this.value.push([key, value]);
		};
		this.__str__ = function() {
			var ret = '{';
			for (var i = 0; i < self.value.length; i++) {
				ret += exports.str(self.value[i][0]) + ': ' + exports.str(self.value[i][1]);
			}
			ret += '}';
			return ret; 
		};
		this.__len__ = function() {
			return this.value.length; 
		};
		this.eq = function(o) {
			if (o.__class__ !== self.__class) return false;
			if (self.value.length != o.value.length) return false;
			for (var i = 0; i < self.value.length; i++) {
				var v1 = self.value[1];
				var v2 = o.get(self.value[0]);
				if (v2 === null) return false;
				if (!v1.eq(v2)) return false;
			}
			return true;
		};
		this.getattr = function(o) { return null; };
	};
	exports.PyDict = PyDict;

	var PyFunction = function(value, default_kwargs) {
		var self = this;
		this.__class__ = 'function';
		this.value = value;
		this.default_kwargs = default_kwargs;
		this.__str__ = function() { return '<function>'; };
		this.eq = function(o) { return o.__class__ === self.__class__ && o === self; };
		this.getattr = function(o) { return null; };
	};
	exports.PyFunction = PyFunction;
	
	var PyBuiltinFunction = function(value, wrapper) {
		// wrapper(args, kwargs) should return params for value
		var self = this;
		this.__class__ = 'builtin-function';
		this.value = value;

		this.__str__ = function() { return '<builtin-function>'; };
		
		this.apply = function(args, kwargs) {
			var params;
			if (wrapper === undefined) {
				for (var x in kwargs) {
					if (kwargs.hasOwnProperty(x)) {
						throw 'PyException: builtin-function does not accept kwarg "' + x + '""';
					}
				}
				args.reverse();
				params = args;
			} else {
				params = wrapper(args, kwargs);
			}
			return value.apply(null, params);
		};
		this.eq = function(o) { return o.__class__ === self.__class__ && o === self; };
		this.getattr = function(o) { return null; };
	};	
	exports.PyBuiltinFunction = PyBuiltinFunction;

	var nativeToInternal = function(value) {
		if (value === null) {
			return new PyNone();
		}
		if (typeof value === 'number' && value % 1 === 0) {
			return new PyInt(value);
		}
		if (typeof value === 'number' && value % 1 !== 0) {
			return new PyFloat(value);
		}
		if (typeof value === 'string') {
			return new PyUnicode(value);
		}
		if (Object.prototype.toString.call(value) === '[object Array]') {
			var val = [];
			for (var i = 0; i < value.length; i++) {
				val[i] = nativeToInternal(value[i]);
			}
			return new PyList(val);
		}
		if (Object.prototype.toString.call(value) === '[object Object]') {
			// code object, not a dict!
			return value;
		}
		throw 'Unknown native: "' + typeof value + '"';
	};
	exports.nativeToInternal = nativeToInternal;

})(window.PythonVM);


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
