
var module = angular.module('db', []);

module.factory('db', function () {
  	
  	var Meta = function(db, type, id) {
  	  var self = this;
  	  self.db = db;
	  self.type = type;
	  self.id = id;
	  self.loaded = false;
	  self.loading = false;
	  self.model = null;

	  self.load = function() {
	  	if (self.loaded) return;
	  	if (self.loading) return;
	  	// TODO:
	  	db.types[type].load(self.model);
	  	alert('Loading!');
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
	  	self.meta = function(type, id) {
	      if (self.models[type][id] === undefined) {
	      	var meta = new Meta(self, type, id);
	      	var model = self.types[type].create(id, meta);
	      	meta.model = model;
	      	self.models[type][id] = meta;
	      }
	      return self.models[type][id];
	  	};
	  	self.model = function(type, id) {
	      return self.meta(type, id).model;
	  	};
	  	self.list = function(type, spec) {
	  	  return self.types[type].list(spec);
	  	};
	};
  	return new Db();
  })
;