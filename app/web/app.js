
angular.module('app', ['league', 'users', 'contenteditable', 'ngRoute','myapp-main','templates' ])
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
				html = html.replace(/\</g, '&lt;');
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

(function(exports) {

	var opnames = ['STOP_CODE', 'POP_TOP', 'ROT_TWO', 'ROT_THREE', 'DUP_TOP', 'ROT_FOUR', '<6>', '<7>', '<8>', 'NOP', 'UNARY_POSITIVE', 'UNARY_NEGATIVE', 'UNARY_NOT', 'UNARY_CONVERT', '<14>', 'UNARY_INVERT', '<16>', '<17>', '<18>', 'BINARY_POWER', 'BINARY_MULTIPLY', 'BINARY_DIVIDE', 'BINARY_MODULO', 'BINARY_ADD', 'BINARY_SUBTRACT', 'BINARY_SUBSCR', 'BINARY_FLOOR_DIVIDE', 'BINARY_TRUE_DIVIDE', 'INPLACE_FLOOR_DIVIDE', 'INPLACE_TRUE_DIVIDE', 'SLICE+0', 'SLICE+1', 'SLICE+2', 'SLICE+3', '<34>', '<35>', '<36>', '<37>', '<38>', '<39>', 'STORE_SLICE+0', 'STORE_SLICE+1', 'STORE_SLICE+2', 'STORE_SLICE+3', '<44>', '<45>', '<46>', '<47>', '<48>', '<49>', 'DELETE_SLICE+0', 'DELETE_SLICE+1', 'DELETE_SLICE+2', 'DELETE_SLICE+3', 'STORE_MAP', 'INPLACE_ADD', 'INPLACE_SUBTRACT', 'INPLACE_MULTIPLY', 'INPLACE_DIVIDE', 'INPLACE_MODULO', 'STORE_SUBSCR', 'DELETE_SUBSCR', 'BINARY_LSHIFT', 'BINARY_RSHIFT', 'BINARY_AND', 'BINARY_XOR', 'BINARY_OR', 'INPLACE_POWER', 'GET_ITER', '<69>', 'PRINT_EXPR', 'PRINT_ITEM', 'PRINT_NEWLINE', 'PRINT_ITEM_TO', 'PRINT_NEWLINE_TO', 'INPLACE_LSHIFT', 'INPLACE_RSHIFT', 'INPLACE_AND', 'INPLACE_XOR', 'INPLACE_OR', 'BREAK_LOOP', 'WITH_CLEANUP', 'LOAD_LOCALS', 'RETURN_VALUE', 'IMPORT_STAR', 'EXEC_STMT', 'YIELD_VALUE', 'POP_BLOCK', 'END_FINALLY', 'BUILD_CLASS', 'STORE_NAME', 'DELETE_NAME', 'UNPACK_SEQUENCE', 'FOR_ITER', 'LIST_APPEND', 'STORE_ATTR', 'DELETE_ATTR', 'STORE_GLOBAL', 'DELETE_GLOBAL', 'DUP_TOPX', 'LOAD_CONST', 'LOAD_NAME', 'BUILD_TUPLE', 'BUILD_LIST', 'BUILD_SET', 'BUILD_MAP', 'LOAD_ATTR', 'COMPARE_OP', 'IMPORT_NAME', 'IMPORT_FROM', 'JUMP_FORWARD', 'JUMP_IF_FALSE_OR_POP', 'JUMP_IF_TRUE_OR_POP', 'JUMP_ABSOLUTE', 'POP_JUMP_IF_FALSE', 'POP_JUMP_IF_TRUE', 'LOAD_GLOBAL', '<117>', '<118>', 'CONTINUE_LOOP', 'SETUP_LOOP', 'SETUP_EXCEPT', 'SETUP_FINALLY', '<123>', 'LOAD_FAST', 'STORE_FAST', 'DELETE_FAST', '<127>', '<128>', '<129>', 'RAISE_VARARGS', 'CALL_FUNCTION', 'MAKE_FUNCTION', 'BUILD_SLICE', 'MAKE_CLOSURE', 'LOAD_CLOSURE', 'LOAD_DEREF', 'STORE_DEREF', '<138>', '<139>', 'CALL_FUNCTION_VAR', 'CALL_FUNCTION_KW', 'CALL_FUNCTION_VAR_KW', 'SETUP_WITH', '<144>', 'EXTENDED_ARG', 'SET_ADD', 'MAP_ADD', '<148>', '<149>', '<150>', '<151>', '<152>', '<153>', '<154>', '<155>', '<156>', '<157>', '<158>', '<159>', '<160>', '<161>', '<162>', '<163>', '<164>', '<165>', '<166>', '<167>', '<168>', '<169>', '<170>', '<171>', '<172>', '<173>', '<174>', '<175>', '<176>', '<177>', '<178>', '<179>', '<180>', '<181>', '<182>', '<183>', '<184>', '<185>', '<186>', '<187>', '<188>', '<189>', '<190>', '<191>', '<192>', '<193>', '<194>', '<195>', '<196>', '<197>', '<198>', '<199>', '<200>', '<201>', '<202>', '<203>', '<204>', '<205>', '<206>', '<207>', '<208>', '<209>', '<210>', '<211>', '<212>', '<213>', '<214>', '<215>', '<216>', '<217>', '<218>', '<219>', '<220>', '<221>', '<222>', '<223>', '<224>', '<225>', '<226>', '<227>', '<228>', '<229>', '<230>', '<231>', '<232>', '<233>', '<234>', '<235>', '<236>', '<237>', '<238>', '<239>', '<240>', '<241>', '<242>', '<243>', '<244>', '<245>', '<246>', '<247>', '<248>', '<249>', '<250>', '<251>', '<252>', '<253>', '<254>', '<255>'];
	var comparators = ['<', '<=', '==', '!=', '>', '>=', 'in', 'not in', 'is', 'is not', 'exception match', 'BAD'];
	var have_argument = 90;
	
	var isInt = function(x) {
		return typeof x === 'number' && x % 1 === 0;
	};
	
	var truthy = function(x) {
		if (typeof x === 'number') return x != 0;
		if (typeof x === 'boolean') return x;
		// TODO: other types
		return false;
	};
	
	var iter = function(x) {
		//TODO: dict iter
		return [0, x];
	};
	
	var VM = function(binary){
		var fun = binary;
		var code = binary.co_code;

		var pos = 0;

		var stack = [];
		var env = {};
		var global_env = env;
		var blocks = [];
		var calls = [];
		var stdout = function(item) { console.log('PRINT', item); };
		
		this.setPrinter = function(new_stdout) {
			stdout = new_stdout;
		};

		this.step = function() {
			var code = fun.co_code;
			var instruction = code.charCodeAt(pos);
			var argument = null;
			pos += 1;
			if (instruction >= have_argument) {
				argument = code.charCodeAt(pos + 1) * 65536 + code.charCodeAt(pos);
				pos += 2;
			}
			var name = opnames[instruction];
			console.log('OPERATION', name, argument);
			var handler = operations[name];
			if (handler === undefined) {
				throw 'Unsupported instruction: ' + name + ' (' + instruction + ')';
			}
			handler(argument);
			console.log('STACK: ', stack, '. ENV: ', env, '. BLOCK: ' + blocks, '. CALLS: ', calls);
			return pos >= 0;
		};

		var operations = {};
		
		operations['STOP_CODE'] = function() {
			pos = -1;
		};

		operations['POP_TOP'] = function() {
			stack.pop();
		};

		operations['LOAD_CONST'] = function(arg) {
			stack.push(fun.co_consts[arg]);
		};

		operations['PRINT_ITEM'] = function() {
			stdout(stack.pop());
		};

		operations['PRINT_NEWLINE'] = function() {
			stdout('\n');
		};
		
		operations['SETUP_LOOP'] = function(arg) {
			blocks.push([pos, pos + arg]);
		};

		operations['GET_ITER'] = function() {
			// TODO: check type
			var a = stack.pop();
			stack.push(iter(a));
		};

		operations['FOR_ITER'] = function(arg) {
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

		operations['POP_BLOCK'] = function(arg) {
			blocks.pop();
		};
		
		operations['MAKE_FUNCTION'] = function(arg) {
			var fun = stack.pop();
			var default_args = [];
			for (var i = 0; i < arg; i++) {
				default_args.push(stack.pop());
			}
			stack.push([fun, default_args]);
		};

		operations['CALL_FUNCTION'] = function(arg) {
			var args_count = arg % 65536;
			var kwargs_count = Math.floor(arg / 65536);
			var args = [];
			var kwargs = {};
			for (var i = 0; i < kwargs_count; i++) {
				var value = stack.pop();
				var key = stack.pop();
				kwargs[key] = value;
			}
			for (var i = 0; i < args_count; i++) {
				var value = stack.pop();
				args.push(value);
			}
			var fun_data = stack.pop();
			var f = fun_data[0];
			var default_args = fun_data[1];
			calls.push([fun, pos, env, blocks]);
			fun = f;
			pos = 0;
			env = kwargs;
			blocks = [];
			for (var i = 0; i < fun.co_varnames.length; i++) {
				if (env[fun.co_varnames[i]] !== undefined) continue;
				env[fun.co_varnames[i]] = i < args.length ? args[args.length - i - 1] : default_args[default_args.length - i - 1];
			}
		};

		operations['RETURN_VALUE'] = function() {
			if (calls.length == 0) {
				pos = -1;
				return;
			}
			var last_call = calls.pop();
			fun = last_call[0];
			pos = last_call[1];
			env = last_call[2];
			blocks = last_call[3];
		};

		operations['LOAD_GLOBAL'] = function(arg) {
			stack.push(global_env[fun.co_names[arg]]);
		};

		operations['LOAD_FAST'] = function(arg) {
			stack.push(env[fun.co_varnames[arg]]);
		};

		operations['STORE_NAME'] = function(arg) {
			var name = fun.co_names[arg];
			env[name] = stack.pop();
		};

		operations['STORE_MAP'] = function(arg) {
			var key = stack.pop();
			var value = stack.pop();
			var dict = stack.pop();
			dict[key] = value;
			stack.push(dict);
		};
		
		operations['STORE_SUBSCR'] = function(arg) {
			var key = stack.pop();
			var obj = stack.pop();
			var value = stack.pop();
			// TODO: other types!
			obj[key] = value;
			stack.push(obj);
		};

		operations['LOAD_NAME'] = function(arg) {
			var name = fun.co_names[arg];
			stack.push(env[name]);
		};

		operations['LOAD_ATTR'] = function(arg) {
			var name = fun.co_names[arg];
			stack.push(stack.pop()[env[name]]);
		};

		// jumps

		operations['POP_JUMP_IF_TRUE'] = function(arg) {
			var a = stack.pop();
			if (truthy(a)) pos = arg;
		};
		
		operations['POP_JUMP_IF_FALSE'] = function(arg) {
			var a = stack.pop();
			if (!truthy(a)) pos = arg;
		};
		
		operations['JUMP_FORWARD'] = function(arg) {
			pos += arg;
		};
		
		operations['JUMP_ABSOLUTE'] = function(arg) {
			pos = arg;
		};
		
		// bulders 
		
		operations['BUILD_LIST'] = function(arg) {
			var a = [];
			for (var i = 0; i < arg; i++) {
				a[arg - i - 1] = stack.pop();
			}
			stack.push(a);
		};
		
		operations['BUILD_MAP'] = function(arg) {
			stack.push({});
		};
		
		// UNARY

		operations['UNARY_POSITIVE'] = function() {
			// TODO: check type
			var a = stack.pop();
			stack.push(+a);
		};
		
		operations['UNARY_NEGATIVE'] = function() {
			// TODO: check type
			var a = stack.pop();
			stack.push(-a);
		};
		
		operations['UNARY_CONVERT'] = function() {
			// TODO: check type
			var a = stack.pop();
			stack.push('' + a);
		};
		
		operations['UNARY_INVERT'] = function() {
			// TODO: check type
			var a = stack.pop();
			stack.push(~a);
		};
		
		// compare

		operations['COMPARE_OP'] = function(arg) {
			// TODO: check types
			// var comparators = ['<', '<=', '==', '!=', '>', '>=', 'in', 'not in', 'is', 'is not', 'exception match', 'BAD'];
			var a1 = stack.pop();
			var a2 = stack.pop();
			if (arg === 0) {
				stack.push(a2 < a1);
				return;
			}
			if (arg === 1) {
				stack.push(a2 <= a1);
				return;
			}
			if (arg === 2) {
				stack.push(a2 == a1);
				return;
			}
			if (arg === 3) {
				stack.push(a2 != a1);
				return;
			}
			if (arg === 4) {
				stack.push(a2 > a1);
				return;
			}
			if (arg === 5) {
				stack.push(a2 >= a1);
				return;
			}
			if (arg === 6) {
				// TODO!
				stack.push(a2 in a1);
				return;
			}
			if (arg === 6) {
				// TODO!
				stack.push(!a2 in a1);
				return;
			}
			log.warning('Unknown comparator: ' + arg);
			stack.push(false);
		};

		// BINARY

		operations['BINARY_POWER'] = function() {
			// TODO: check types
			var a1 = stack.pop();
			var a2 = stack.pop();
			stack.push(Math.pow(a2, a1));
		};

		operations['BINARY_MULTIPLY'] = function() {
			// TODO: check types
			// TODO: implement for strings, lists, etc.
			var a1 = stack.pop();
			var a2 = stack.pop();
			stack.push(a2 * a1);
		};

		operations['BINARY_DIVIDE'] = function() {
			// TODO: check types
			var a1 = stack.pop();
			var a2 = stack.pop();
			var r = a2 / a1;
			if (isInt(a1) && isInt(a2)) r = Math.floor(r); 
			stack.push(r);
		};

		operations['BINARY_FLOOR_DIVIDE'] = function() {
			// TODO: check types
			var a1 = stack.pop();
			var a2 = stack.pop();
			stack.push(Math.floor(a2 / a1));
		};

		operations['BINARY_TRUE_DIVIDE'] = function() {
			// TODO: check types
			var a1 = stack.pop();
			var a2 = stack.pop();
			stack.push(a2 / a1);
		};

		operations['BINARY_MODULO'] = function() {
			// TODO: check types
			var a1 = stack.pop();
			var a2 = stack.pop();
			stack.push(a2 % a1);
		};

		operations['BINARY_ADD'] = function() {
			// TODO: check types
			var a1 = stack.pop();
			var a2 = stack.pop();
			stack.push(a2 + a1);
		};

		operations['BINARY_SUBTRACT'] = function() {
			// TODO: check types
			var a1 = stack.pop();
			var a2 = stack.pop();
			stack.push(a2 - a1);
		};

		operations['BINARY_SUBSCR'] = function() {
			// TODO: check types
			var a1 = stack.pop();
			var a2 = stack.pop();
			stack.push(a2[a1]);
		};

		operations['BINARY_LSHIFT'] = function() {
			// TODO: check types
			var a1 = stack.pop();
			var a2 = stack.pop();
			stack.push(a2 << a1);
		};

		operations['BINARY_RSHIFT'] = function() {
			// TODO: check types
			var a1 = stack.pop();
			var a2 = stack.pop();
			stack.push(a2 >> a1);
		};

		operations['BINARY_AND'] = function() {
			// TODO: check types
			var a1 = stack.pop();
			var a2 = stack.pop();
			stack.push(a2 && a1);
		};

		operations['BINARY_OR'] = function() {
			// TODO: check types
			var a1 = stack.pop();
			var a2 = stack.pop();
			stack.push(a2 || a1);
		};

		operations['BINARY_OR'] = function() {
			// TODO: check types
			var a1 = stack.pop();
			var a2 = stack.pop();
			stack.push(a2 ? !a1 : a1);
		};
		
		// inplace
		
		operations['INPLACE_POWER'] = operations['BINARY_POWER'];
		operations['INPLACE_MULTIPLY'] = operations['BINARY_MULTIPLY'];
		operations['INPLACE_DIVIDE'] = operations['BINARY_DIVIDE'];
		operations['INPLACE_FLOOR_DIVIDE'] = operations['BINARY_FLOOR_DIVIDE'];
		operations['INPLACE_TRUE_DIVIDE'] = operations['BINARY_TRUE_DIVIDE'];
		operations['INPLACE_MODULO'] = operations['BINARY_MODULO'];
		operations['INPLACE_ADD'] = operations['BINARY_ADD'];
		operations['INPLACE_SUBTRACT'] = operations['BINARY_SUBTRACT'];
		operations['INPLACE_LSHIFT'] = operations['BINARY_LSHIFT'];
		operations['INPLACE_RSHIFT'] = operations['BINARY_RSHIFT'];
		operations['INPLACE_AND'] = operations['BINARY_AND'];
		operations['INPLACE_XOR'] = operations['BINARY_XOR'];
		operations['INPLACE_OR'] = operations['BINARY_OR'];
		

	};
	
	exports.VM = VM;
})(window);


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
