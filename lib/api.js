'use strict';

var _ = require('lodash');
var Bluebird = require('bluebird');
var utils = require('./utils');


const PUBLIC_METHODS = ['begin', 'end', 'onBeforeSelect', 'onAfterSelect', 'onBeforeSelectOne', 'onAfterSelectOne', 'onBeforeCount', 'onAfterCount',
	'onBeforeCreate', 'onAfterCreate', 'onBeforeUpdate', 'onAfterUpdate', 'onBeforePartialUpdate', 'onAfterPartialUpdate',
	'onBeforeDelete', 'onAfterDelete', 'onQueryPipe'];

const ACTIONS = {
    UNKNOW: 0,
    SELECT: 1,
    SELECTONE: 2,
    COUNT: 3,
    CREATE: 4,
    UPDATE: 5,
    PARTIALUPDATE: 6,
    DELETE: 7
};

const METHODS = {
	select: {
		path: '',
		method: 'get'
	},
	count: {
		path: '/count',
		method: 'get'
	},
	selectOne: {
		path: '/:id',
		method: 'get'
	},
	create: {
		path: '',
		method: 'post'
	},
	update: {
		path: '/:id',
		method: 'put'
	},
	partialUpdate: {
		path: '/:id',
		method: 'patch'
	},
	delete: {
		path: '/:id',
		method: 'delete'
	}
};

class ApiController {

	constructor(ops) {
		ops = ops || {};
		
		// validation requried fields
		if (_.isEmpty(ops.path) || !_.isString(ops.path))
			throw new Error('argument exception "path"');

		if (_.isEmpty(ops.model) || !_.isObject(ops.model))
			throw new Error('argument exception "model"');
		/**
		 * fields splitter
		 */
		this.split = ops.split || /\s|,|;/;
		/**
		 * request path
		 */
		this.path = ops.path || '';
		/**
		 * mongoose Model
		 */
		this.Model = ops.model || null;
		/**
		 * allowed query fields
		 */
		this.qFields = ops.qFields || [];
		/**
		 * allowed fields
		 */
		//this.fields = ops.fields || '';
		/**
		 * allowed query fields
		 */
		this.sFields = ops.sFields ? (Array.isArray(ops.sFields) ? ops.sFields : ops.sFields.split(this.split)) : [];
		/**
		 * default sort option
		 */
		this.sort = ops.sort || null; //default sort option
		
		/**
		 * allowed mongo modificators
		 */
		this.partialOps = ops.partialOps || utils.PartialOps;
		/**
		 * default query pipe
		 **/
		this.queryPipe = ops.queryPipe || null;
		
		/**
		 * request handlers 
		 */
		this.methods = _.defaults(ops.methods || {}, METHODS);

		/**
		* create async methods for 
		* @example: beginAsync			
		**/
		PUBLIC_METHODS.forEach(function (name) {
			this[name + 'Async'] = Bluebird.promisify(this[name], this);
		}, this);

		this.actionType = ACTIONS.UNKNOW;

		if (!this.sFields || this.sFields.length === 0) {
			this.sFields = [];

			this.Model.schema.eachPath((key) => {
				if (!/_id|_v|__v/gi.test(key))
					this.sFields.push(key);
			});
		}
	}
	
	/**
	 * request start
	 */
	begin(req, res, next) {
		next();
	}
	
	/**
	 * request end but before send response
	 * */
	end(req, res, next) {
		next();
	}

	/**
	 * request start
	 * */
	onBeforeSelect(req, filter, next) {
		next(null, filter);
	}
	
	/**
	 * request end but before send response
	 */
	onAfterSelect(req, docs, next) {
		next(null, docs);
	}
	
	/**
	 * request start
	 */
	onBeforeSelectOne(req, filter, next) {
		next(null, filter);
	}
	
	/**
	 * request end but before send response
	 */
	onAfterSelectOne(req, docs, next) {
		next(null, docs);
	}
	
	/**
	 * request start
	 */
	onBeforeCount(req, filter, next) {
		next(null, filter);
	}
	
	/**
	 * request end but before send response
	 */
	onAfterCount(req, docs, next) {
		next(null, docs);
	}
	
	/**
	 * start create request
	 */
	onBeforeCreate(req, body, next) {
		next(null, body);
	}
	
	/**
	 * request end but before send response
	 */
	onAfterCreate(req, doc, numAffected, next) {
		next(null, doc);
	}
	
	/**
	 * start update request
	 */
	onBeforeUpdate(req, doc, data, next) {
		next(null, doc, data);
	}
	
	/**
	 * request end but before send response
	 */
	onAfterUpdate(req, doc, numAffected, next) {
		next(null, doc);
	}
	
	/**
	 * start partial update request
	 */
	onBeforePartialUpdate(req, doc, data, next) {
		next(null, doc, data);
	}
	
	/**
	 * request end but before send response
	 */
	onAfterPartialUpdate(req, doc, next) {
		next(null, doc);
	}
	
	/**
	 * start update request
	 */
	onBeforeDelete(req, doc, next) {
		next(null, doc);
	}
	
	/**
	 * request end but before send response
	 */
	onAfterDelete(req, doc, next) {
		next(null, doc);
	}
	
	/**
	 * on query build
	 * */
	onQueryPipe(req, queryPipe, next) {
		next(null, queryPipe);
	}

	onError(req, res, err) {
		if (err.httpStatus) {
			return res.json(err.httpStatus, { message: err.message });
		}
    
		// send internal server error
		return res.json(500, { message: 'internal server error' });
	}

	/**
	 * parse incoming request and extract the following fields from it:
	 * 	`q` - free text search mapped to `qFields`
	 * 	`query` - filer query
	 * 	`fields` - select fields, mapped to `sFields`
	 * 	`sort` - sort result, mapped to default `sort`
	 * 	`limit` - number of documents
	 * 	`skip` - number of documents
	 */
	_parseRequest(req) {
		let options = {
			query: {},
			fields: this.sFields.join(' '),
			sort: this.sort,
			limit: 15,
			skip: 0,
			lean: false
		};
		let param = req.param('q');
		if (!_.isEmpty(param) && this.qFields && this.qFields.length > 0) {
			param = _.escapeRegExp(param);
			let rx = new RegExp(param, 'i');
			this.qFields.forEach(function (key) {
				options.query[key] = rx;
			});
		}

		param = req.param('query');
		if (!_.isEmpty(param)) {
			options.query = _.extend(options.query, param);
			// TODO: convert path or use default
		}

		param = req.param('fields');
		if (!_.isEmpty(param)) {
			let ia = param.split(this.split);
			let da = this.sFields;
			if (!_.isEmpty(this.sFields)) {
				options.fields = _.intersection(da, ia).join(' ');
			} else {
				options.fields = ia.join(' ');
			}
			ia = null;
			da = null;
		}
		param = req.param('sort');
		if (!_.isEmpty(param)) {
			options.sort = param || this.sort;
		}
		param = req.param('limit');
		if (!_.isEmpty(param)) {
			options.limit = parseFloat(param) || options.limit;
		}
		param = req.param('skip');
		if (!_.isEmpty(param)) {
			options.skip = parseFloat(param) || options.skip;
		}
		return options;
	}

	/**
	 * create Query for select
	 */
	selectQuery(filter) {
		let query = this.Model.find(filter.query, filter.fields, { skip: filter.skip, limit: filter.limit, sort: filter.sort });
		if (this.queryPipe && _.isFunction(this.queryPipe)) {
			this.queryPipe.call(this, query);
		}
		return query;
	}

	/**
	 * create Query for select
	 */
	selectOneQuery(filter) {
		let query = this.Model.findOne(filter.query, filter.fields, { sort: filter.sort });
		if (this.queryPipe && _.isFunction(this.queryPipe)) {
			this.queryPipe.call(this, query);
		}
		return query;
	}

	install(router) {

		// router.get(this.path, this.select.bind(this));
		// router.get(this.path + '/count', this.count.bind(this));
		// router.get(this.path + '/:id', this.selectOne.bind(this));
		// router.post(this.path, this.create.bind(this));
		// router.put(this.path + '/:id', this.update.bind(this));
		// router.patch(this.path + '/:id', this.partialUpdate.bind(this));
		// router.delete(this.path + '/:id', this.delete.bind(this));
		Object.keys(this.methods).forEach(method=> {
			let handler = this.methods[method];
			if (_.isFunction(this[method]) && router[handler.method]) {
				router[handler.method].call(router, this.path + handler.path, this[method].bind(this));
			}
		});

		return router;
	}
	
	/**
 	 * select documents
 	 * */
	select(req, res, next) {
		this.actionType = ACTIONS.SELECT;

		Bluebird.bind(this)
		// begin request
			.then(function () {
				return this.beginAsync(req, res);
			})
		// build filter from req and fire on before select event
			.then(function () {
				var filter = this._parseRequest(req);
				return this.onBeforeSelectAsync(req, filter);
			})
		// build query pipe from filter and fire `onQueryPipe` event
			.then(function (filter) {
				var query = this.selectQuery(filter);
				return this.onQueryPipeAsync(req, query);
			})
		// execute query pipe
			.then(function (query) {
				if (this.lean)
					query.lean();
				return query.exec();
			})
		// gets reponse from db and fire `onAfterSelect` event
			.then(function (docs) {
				return this.onAfterSelectAsync(req, docs);
			})
			.then(function (docs) {
				return res.json(docs);
			})
			.catch(function (err) {
				this.onError(req, res, err);
			})
			.finally(function () {
				return this.endAsync(req, res);
			});
	}
	
	/**
	 * select document by id
	 * */
	selectOne(req, res, next) {
		this.actionType = ACTIONS.SELECTONE;

		Bluebird.bind(this)
		// begin request
			.then(function () {
				return this.beginAsync(req, res);
			})
		// build filter from req and fire on before select event
			.then(function () {
				var filter = this._parseRequest(req);
				// override query filter
				filter.query = { _id: req.params.id };
				return this.onBeforeSelectOneAsync(req, filter);
			})
		// build query pipe from filter and fire `onQueryPipe` event
			.then(function (filter) {
				var query = this.selectOneQuery(filter);
				return this.onQueryPipeAsync(req, query);
			})
		// execute query pipe
			.then(function (query) {
				if (this.lean)
					query.lean();
				return query.exec();
			})
		// gets reponse from db and fire `onAfterSelect` event
			.then(function (doc) {
				return this.onAfterSelectOneAsync(req, doc);
			})
			.then(function (doc) {
				if (!doc)
					return res.json(404, doc);
				return res.json(doc);
			})
			.catch(function (err) {
				this.onError(req, res, err);
			})
			.finally(function () {
				return this.endAsync(req, res);
			});
	}
	
	/**
	 * calc count
	 */
	count(req, res, next) {
		this.actionType = ACTIONS.COUNT;

		Bluebird.bind(this)
		// begin request
			.then(function () {
				return this.beginAsync(req, res);
			})
		// build filter from req and fire on before select event
			.then(function () {
				var filter = this._parseRequest(req);
				return this.onBeforeCountAsync(req, filter);
			})
		// build query from filter and execute it
			.then(function (filter) {
				var query = this.Model.count(filter.query);
				return query.exec();
			})
		// gets reponse from db and fire `onAfterSelect` event
			.then(function (count) {
				return this.onAfterCountAsync(req, count);
			})
			.then(function (count) {
				return res.json({ count: count });
			})
			.catch(function (err) {
				this.onError(req, res, err);
			})
			.finally(function () {
				return this.endAsync(req, res);
			});
	}
	
	/**
	 * create a new elemt
	 */
	create(req, res, next) {
		this.actionType = ACTIONS.CREATE;
		var doc = null;

		Bluebird.bind(this)
		// begin request
			.then(function () {
				return this.beginAsync(req, res);
			})
			.then(function () {
				let body = utils.prepareBody(req, this.sFields);
				return this.onBeforeCreateAsync(req, body);
			})
			.then(function (body) {
				doc = new this.Model(body);
				if (!doc.saveAsync) {
					doc.saveAsync = Bluebird.promisify(doc.save, doc);
				}
				return doc.saveAsync();
			})
			.spread(function (doc, numAffected) {
				return this.onAfterCreateAsync(req, doc, numAffected);
			})
			.then(function (doc) {
				if (this.queryPipe && _.isFunction(this.queryPipe)) {
					this.queryPipe.call(this, doc);
				}
				return this.onQueryPipeAsync(req, doc);
			})
			.then(function (doc) {
				if (doc.execPopulate) {
					return doc.execPopulate();
				} else {
					let exec = Bluebird.promisify(doc.populate, doc);
					return exec();
				}
			})
			.then(function (doc) {
				doc = doc.toObject();
				res.json(201, doc);
			})
			.catch(function (err) {
				this.onError(req, res, err);
			})
		// end request
			.finally(function () {
				doc = null;
				return this.endAsync(req, res);
			});
	}
	
	/**
	 * update document fields
	 */
	update(req, res, next) {
		this.actionType = ACTIONS.UPDATE;

		Bluebird.bind(this)
		// begin request
			.then(function () {
				return this.beginAsync(req, res);
			})
			.then(function () {
				return this.Model.findById(req.params.id).exec();
			})
			.then(function (doc) {
				if (!doc) {
					throw new utils.HttpError(404, 'resource not found');
				}

				var body = utils.prepareBody(req, this.sFields);
				return this.onBeforeUpdateAsync(req, doc, body).bind(this)
					.spread(function (doc, body) {
						return utils.assignFields(doc, body);
					});
			})
			.then(function (doc) {
				if (!doc.saveAsync) {
					doc.saveAsync = Bluebird.promisify(doc.save, doc);
				}
				return doc.saveAsync();
			})
			.spread(function (doc, numAffected) {
				return this.onAfterUpdateAsync(req, doc, numAffected);
			})
			.then(function (doc) {
				if (this.queryPipe && _.isFunction(this.queryPipe)) {
					this.queryPipe.call(this, doc);
				}
				return this.onQueryPipeAsync(req, doc);
			})
			.then(function (doc) {
				if (doc.execPopulate) {
					return doc.execPopulate();
				} else {
					var exec = Bluebird.promisify(doc.populate, doc);
					return exec();
				}
			})
			.then(function (doc) {
				doc = doc.toObject();
				res.json(200, doc);
			})
			.catch(function (err) {
				this.onError(req, res, err);
			})
		// end request
			.finally(function () {
				return this.endAsync(req, res);
			});
	}
	
	/**
	 * partial update document using native mongo fields update operators
	 **/
	partialUpdate(req, res, next) {
		this.actionType = ACTIONS.PARTIALUPDATE;

		Bluebird.bind(this)
		// begin request
			.then(function () {
				return this.beginAsync(req, res);
			})
			.then(function () {
				return this.Model.findById(req.params.id).exec();
			})
			.then(function (doc) {
				if (!doc) {
					throw new utils.HttpError(404, 'resource not found');
				}

				var data = _.pick(req.body, this.partialOps);
				return this.onBeforePartialUpdateAsync(req, doc, data);
			})
			.spread(function (doc, data) {
				return doc.update(data, { multi: false, upsert: false }).exec();
			})
			.then(function (numAffected) {
				return this.onAfterPartialUpdateAsync(req, numAffected);
			})
			.then(function (numAffected) {
				res.json(200, {});
			})
			.catch(function (err) {
				this.onError(req, res, err);
			})
		// end request
			.finally(function () {
				return this.endAsync(req, res);
			});
	}
	
	/**
	 * delete doc by id
	 **/
	delete(req, res, next) {
		this.actionType = ACTIONS.DELETE;

		Bluebird.bind(this)
		// begin request
			.then(function () {
				return this.beginAsync(req, res);
			})
			.then(function () {
				return this.Model.findById(req.params.id).exec();
			})
			.then(function (doc) {
				if (!doc) {
					throw new utils.HttpError(404, 'resource not found');
				}

				return this.onBeforeDeleteAsync(req, doc);
			})
			.then(function (doc) {
				if (!doc.removeAsync)
					doc.removeAsync = Bluebird.promisify(doc.remove, doc);

				return doc.removeAsync();
			})
			.then(function (doc) {
				return this.onAfterDeleteAsync(req, doc);
			})
			.then(function (doc) {
				doc = doc.toObject();
				res.json(200, doc);
				doc = null;
			})
			.catch(function (err) {
				this.onError(req, res, err);
			})
		// end request
			.finally(function () {
				return this.endAsync(req, res);
			});
	}
	
	/**
	 * check is this request for select documents
	 * */
	isSelect() {
		return this.actionType === ACTIONS.SELECT;
	}

	/**
	 * check is this request for count the documents
	 * */
	isCount() {
		return this.actionType === ACTIONS.COUNT;
	}

	/**
	 * check is this request for select document by id
	 * */
	isSelectOne() {
		return this.actionType === ACTIONS.SELECTONE;
	}

	/**
	 * check is this request for creation a new document
	 * */
	isCreate() {
		return this.actionType === ACTIONS.CREATE;
	}

	/**
	 * check is this request for update document
	 * */
	isUpdate() {
		return this.actionType === ACTIONS.UPDATE;
	}

	/**
	 * check is this request for partion update
	 * */
	isPartialUpdate() {
		return this.actionType === ACTIONS.PARTIALUPDATE;
	}

	isPartial() {
		return this.isPartialUpdate();
	}
	
	/**
	 * check is this request for delete document by id
	 * */
	isDelete() {
		return this.actionType === ACTIONS.DELETE;
	}
};

ApiController.HttpError = utils.HttpError;
ApiController.ACTIONS = ACTIONS;

module.exports = ApiController;