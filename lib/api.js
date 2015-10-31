'use strict';

var _ = require('lodash');
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
			this[name + 'Async'] = utils.promisify(this[name], this);
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
	onAfterCreate(req, doc, next) {
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
	onAfterUpdate(req, doc, next) {
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
	onAfterPartialUpdate(req, doc, numAffected, next) {
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
			return res.status(err.httpStatus).json({ message: err.message });
		}
    
		// send internal server error
		return res.status(500).json({ message: 'internal server error' });
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

		let param = utils.retriveVal(req, 'q');
		if (!_.isEmpty(param) && this.qFields && this.qFields.length > 0) {
			param = _.escapeRegExp(param);
			let rx = new RegExp(param, 'i');
			this.qFields.forEach(function (key) {
				options.query[key] = rx;
			});
		}

		param = utils.retriveVal(req, 'query');
		if (!_.isEmpty(param)) {
			options.query = _.extend(options.query, param);
			// TODO: convert path or use default
		}

		param = utils.retriveVal(req, 'fields');
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
		param = utils.retriveVal(req, 'sort');
		if (!_.isEmpty(param)) {
			options.sort = param || this.sort;
		}
		param = utils.retriveVal(req, 'limit');
		if (!_.isEmpty(param)) {
			options.limit = parseFloat(param) || options.limit;
		}
		param = utils.retriveVal(req, 'skip');
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

		this.beginAsync(req, res)
		// build filter from req and fire on before select event
			.then(() => {
				var filter = this._parseRequest(req);
				return this.onBeforeSelectAsync(req, filter);
			})
		// build query pipe from filter and fire `onQueryPipe` event
			.then(filter => {
				let query = this.selectQuery(filter);

				let promise = new Promise((resolve, reject) => {
					// execute query pipe
					this.onQueryPipe(req, query, (err, q) => {

						if (err)
							return reject(err);

						if (this.lean)
							q.lean();

						return resolve(q.exec());

					});
				});

				return promise;
			})
		// gets reponse from db and fire `onAfterSelect` event
			.then(docs => {
				return this.onAfterSelectAsync(req, docs);
			})
			.then(docs => {
				return res.json(docs);
			})
			.catch(err => {
				this.onError(req, res, err);
			})
			.then(() => {
				return this.endAsync(req, res);
			});
	}
	
	/**
	 * select document by id
	 * */
	selectOne(req, res, next) {
		this.actionType = ACTIONS.SELECTONE;
		
		// begin request
		return this.beginAsync(req, res)
		// build filter from req and fire on before select event
			.then(() => {
				var filter = this._parseRequest(req);
				// override query filter
				filter.query = { _id: req.params.id };
				return this.onBeforeSelectOneAsync(req, filter);
			})
		// build query pipe from filter and fire `onQueryPipe` event
			.then(filter => {
				let query = this.selectOneQuery(filter);

				let promise = new Promise((resolve, reject) => {
					// execute query pipe
					this.onQueryPipe(req, query, (err, q) => {

						if (err)
							return reject(err);

						if (this.lean)
							q.lean();

						return resolve(q.exec());

					});
				});

				return promise;
			})
		// gets reponse from db and fire `onAfterSelect` event
			.then(doc=> {
				return this.onAfterSelectOneAsync(req, doc);
			})
			.then(doc=> {
				if (!doc)
					return res.json(404, doc);
				return res.json(doc);
			})
			.catch(err=> {
				this.onError(req, res, err);
			})
			.then(() => {
				return this.endAsync(req, res);
			});
	}
	
	/**
	 * calc count
	 */
	count(req, res, next) {
		this.actionType = ACTIONS.COUNT;
		
		// begin request
		return this.beginAsync(req, res)
		// build filter from req and fire on before select event
			.then(() => {
				let filter = this._parseRequest(req);
				return this.onBeforeCountAsync(req, filter);
			})
		// build query from filter and execute it
			.then(filter=> {
				return this.Model.count(filter.query).exec();
			})
		// gets reponse from db and fire `onAfterSelect` event
			.then(count=> {
				return this.onAfterCountAsync(req, count);
			})
			.then(count=> {
				return res.json({ count: count });
			})
			.catch(err=> {
				this.onError(req, res, err);
			})
			.then(() => {
				return this.endAsync(req, res);
			});
	}
	
	/**
	 * create a new elemt
	 */
	create(req, res, next) {
		this.actionType = ACTIONS.CREATE;
		var doc = null;
		
		// begin request
		return this.beginAsync(req, res)
			.then(() => {
				let body = utils.prepareBody(req, this.sFields);
				return this.onBeforeCreateAsync(req, body);
			})
			.then(body => {

				doc = new this.Model(body);
				if (!doc.saveAsync) {
					doc.saveAsync = utils.promisify(doc.save, doc);
				}
				return doc.saveAsync();
			})
			.then(arr => {
				let doc = null;
				if (Array.isArray(arr)) {
					doc = arr[0];
				} else {
					doc = arr;
				}
				return this.onAfterCreateAsync(req, doc);
			})
			.then(doc => {
				if (this.queryPipe && _.isFunction(this.queryPipe)) {
					this.queryPipe.call(this, doc);
				}
				return this.onQueryPipeAsync(req, doc);
			})
			.then(doc => {
				if (doc.execPopulate) {
					return doc.execPopulate();
				} else {
					let exec = utils.promisify(doc.populate, doc);
					return exec();
				}
			})
			.then(doc => {
				doc = doc.toObject();
				res.status(201).json(doc);
			})
			.catch(err => {
				this.onError(req, res, err);
			})
		// end request
			.then(() => {
				doc = null;
				return this.endAsync(req, res);
			});
	}
	
	/**
	 * update document fields
	 */
	update(req, res, next) {
		this.actionType = ACTIONS.UPDATE;
		
		// begin request
		return this.beginAsync(req, res)
			.then(() => {
				return this.Model.findById(req.params.id).exec();
			})
			.then(doc => {
				if (!doc) {
					throw new utils.HttpError(404, 'resource not found');
				}

				var body = utils.prepareBody(req, this.sFields);
				return this.onBeforeUpdateAsync(req, doc, body);
			})
			.then(arr=> {
				let doc = arr[0];
				let body = arr[1];

				return utils.assignFields(doc, body);
			})
			.then(doc => {
				if (!doc.saveAsync) {
					doc.saveAsync = utils.promisify(doc.save, doc);
				}
				return doc.saveAsync();
			})
			.then(arr => {
				let doc = Array.isArray(arr) ? arr[0] : arr;
				return this.onAfterUpdateAsync(req, doc);
			})
			.then(doc => {
				if (this.queryPipe && _.isFunction(this.queryPipe)) {
					this.queryPipe.call(this, doc);
				}
				return this.onQueryPipeAsync(req, doc);
			})
			.then(doc=> {
				if (doc.execPopulate) {
					return doc.execPopulate();
				} else {
					var exec = utils.promisify(doc.populate, doc);
					return exec();
				}
			})
			.then(doc => {
				doc = doc.toObject();
				res.status(200).json(doc);
			})
			.catch(err => {
				this.onError(req, res, err);
			})
		// end request
			.then(() => {
				return this.endAsync(req, res);
			});
	}
	
	/**
	 * partial update document using native mongo fields update operators
	 **/
	partialUpdate(req, res, next) {
		this.actionType = ACTIONS.PARTIALUPDATE;
		
		// begin request
		return this.beginAsync(req, res)
			.then(() => {
				return this.Model.findById(req.params.id).exec();
			})
			.then((doc) => {
				if (!doc) {
					throw new utils.HttpError(404, 'resource not found');
				}

				var data = _.pick(req.body, this.partialOps);
				return this.onBeforePartialUpdateAsync(req, doc, data);
			})
			.then((arr) => {
				// TODO: needs integrate validation by path
				let doc = arr[0];
				let data = arr[1];
				return doc.update(data, { multi: false, upsert: false }).exec();
			})
			.then(numAffected => {
				return this.Model.findById(req.params.id).exec()
					.then(doc=> {
						return [doc, numAffected];
					});
			})
			.then((arr) => {
				let doc = arr[0];
				let numAffected = arr[1];
				return this.onAfterPartialUpdateAsync(req, doc, numAffected);
			})
			.then(doc => {
				if (!doc) {
					doc = doc.toObject();
					doc = _.pick(doc, this.sFields);
				}
				res.status(200).json(doc);
			})
			.catch((err) => {
				this.onError(req, res, err);
			})
		// end request
			.then(() => {
				return this.endAsync(req, res);
			});
	}
	
	/**
	 * delete doc by id
	 **/
	delete(req, res, next) {
		this.actionType = ACTIONS.DELETE;
		
		// begin request
		return this.beginAsync(req, res)
			.then(() => {
				return this.Model.findById(req.params.id).exec();
			})
			.then((doc) => {
				if (!doc) {
					throw new utils.HttpError(404, 'resource not found');
				}

				return this.onBeforeDeleteAsync(req, doc);
			})
			.then((doc) => {
				if (!doc.removeAsync)
					doc.removeAsync = utils.promisify(doc.remove, doc);

				return doc.removeAsync();
			})
			.then((doc) => {
				return this.onAfterDeleteAsync(req, doc);
			})
			.then((doc) => {
				doc = doc.toObject();
				res.status(200).json(doc);
				doc = null;
			})
			.catch((err) => {
				this.onError(req, res, err);
			})
		// end request
			.then(() => {
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