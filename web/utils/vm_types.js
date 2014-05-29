
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
	};
	exports.PyNone = PyNone;
	
	var PyBool = function(value) {
		var self = this;
		this.__class__ = 'bool';
		this.value = value;
		this.__str__ = function() { return value ? 'True' : 'False'; };
		this.immutable = true;
		this.eq = function(o) { return o.__class__ === self.__class && o.value === self.value; };
	};
	exports.PyBool = PyBool;
	
	var PyInt = function(value) {
		var self = this;
		this.__class__ = 'int';
		this.value = value;
		this.isNumber = true;
		this.__str__ = function() { return value; };
		this.immutable = true;
		this.eq = function(o) { return o.__class__ === self.__class && o.value === self.value; };
	};
	exports.PyInt = PyInt;
	
	var PyFloat = function(value) {
		var self = this;
		this.__class__ = 'float';
		this.value = value;
		this.isNumber = true;
		this.__str__ = function() { return value; };
		this.immutable = true;
		this.eq = function(o) { return o.__class__ === self.__class && o.value === self.value; };
	};
	exports.PyFloat = PyFloat;

	var PyUnicode = function(value) {
		var self = this;
		this.__class__ = 'unicode';
		this.value = value;
		this.__str__ = function() { return value; };
		this.immutable = true;
		this.eq = function(o) { return o.__class__ === self.__class__ && o.value === self.value; };
	};
	exports.PyUnicode = PyUnicode;

	var PyList = function(value) {
		var self = this;
		this.__class__ = 'list';
		this.value = value;
		this.__str__ = function() { return value; };
		//TODO: eq
		this.eq = function(o) { return o.__class__ === self.__class && o === self; };
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
		this.__str__ = function() { return 'dict(' + self.value + ')'; };
		//TODO: eq
		this.eq = function(o) { return o.__class__ === self.__class && o === self; };
	};
	exports.PyDict = PyDict;

	var PyFunction = function(value, default_kwargs) {
		var self = this;
		this.__class__ = 'function';
		this.value = value;
		this.default_kwargs = default_kwargs;
		this.__str__ = function() { return '<function>'; };
		this.eq = function(o) { return o.__class__ === self.__class && o === self; };
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
						// TODO: throw PyException
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
		this.eq = function(o) { return o.__class__ === self.__class && o === self; };
	};	
	exports.PyBuiltinFunction = PyBuiltinFunction;

	var nativeToInternal = function(value) {
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
			return new PyList(value);
		}
		if (Object.prototype.toString.call(value) === '[object Object]') {
			return value;
		}
		throw 'Unknown native: "' + typeof value + '"';
	};
	exports.nativeToInternal = nativeToInternal;

})(window.PythonVM);
