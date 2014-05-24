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