/* jshint undef: true, unused: true, nonew: true, node: true */
/* global require */
var Bluebird = require('bluebird');
var _ = require('lodash');
var PublicAPI = require('./apicontroller');

var ACTIONS = {
    UNKNOW: 0,
    SELECT: 1,
    SELECTONE: 2,
    COUNT: 3,
    CREATE: 4,
    UPDATE: 5,
    PARTIALUPDATE: 6,
    DELETE: 7
};

function RestfulController(ops) {
    // call public api constructor
    PublicAPI.prototype.constructor.call(this);
    // validation requried fields
    if (_.isEmpty(ops.path) || !_.isString(ops.path))
        throw new Error('argument exception "path"');
    
    if (_.isEmpty(ops.model) || !_.isObject(ops.model))
        throw new Error('argument exception "model"');
    
    this.options = ops;
    this.init();
}

// inhert from public api
RestfulController.prototype = new PublicAPI();
RestfulController.prototype.constructor = RestfulController;

RestfulController.prototype.init = function () {
    // extend from options
    _.extend(this, this.options);
    this.actionType = ACTIONS.UNKNOW;
};

RestfulController.prototype.install = function (router) {
    
    router.get(this.path, this.select.bind(this));
    router.get(this.path + '/count', this.count.bind(this));
    router.get(this.path + '/:id', this.selectOne.bind(this));
    router.post(this.path, this.create.bind(this));
    router.put(this.path + '/:id', this.update.bind(this));
    router.patch(this.path + '/:id', this.partialUpdate.bind(this));
    router.delete(this.path + '/:id', this.delete.bind(this));
        
    return router;
};

/**
 * select documents
 * */
RestfulController.prototype.select = function (req, res, next) {
    this.actionType = ACTIONS.SELECT;
    
    Bluebird.bind(this)
    // begin request
    .then(function () {
        return this.beginAsync(req, res);
    })
    // build filter from req and fire on before select event
    .then(function () {
        var filter = this.parseRequest(req);
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
};

/**
 * select document by id
 * */
RestfulController.prototype.selectOne = function (req, res, next) {
    this.actionType = ACTIONS.SELECTONE;
    
    Bluebird.bind(this)
    // begin request
    .then(function () {
        return this.beginAsync(req, res);
    })
    // build filter from req and fire on before select event
    .then(function () {
        var filter = this.parseRequest(req);
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
};

/**
 * calc count
 */
RestfulController.prototype.count = function (req, res, next) {
    this.actionType = ACTIONS.COUNT;
    
    Bluebird.bind(this)
    // begin request
    .then(function () {
        return this.beginAsync(req, res);
    })
    // build filter from req and fire on before select event
    .then(function () {
        var filter = this.parseRequest(req);
        return this.onBeforeCountAsync(req, filter);
    })
    // build query from filter and execute it
    .then(function (filter) {
        var query = this.model.count(filter.query);
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
};

/**
 * create a new elemt
 */
RestfulController.prototype.create = function (req, res, next) {
    this.actionType = ACTIONS.CREATE;
    var doc = null;
    
    Bluebird.bind(this)
    // begin request
    .then(function () {
        return this.beginAsync(req, res);
    })
    .then(function () {
        var body = this.prepareBody(req);
        return this.onBeforeCreateAsync(req, body);
    })
    .then(function (body) {
        doc = new this.model(body);
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
        doc = doc.toObject();
        res.json(201, doc);
        doc = null;
    })
    .catch(function (err) {
        console.log(err);
        this.onError(req, res, err);
    })
    // end request
    .finally(function () {
        doc = null;
        return this.endAsync(req, res);
    });
};

/**
 * update document fields
 */
RestfulController.prototype.update = function (req, res, next) {
    this.actionType = ACTIONS.UPDATE;
    
    Bluebird.bind(this)
    // begin request
    .then(function () {
        return this.beginAsync(req, res);
    })
    .then(function () {
        return this.model.findById(req.params.id).exec();
    })
    .then(function (doc) {
        if (!doc) {
            throw new HttpError('resource not found', 404);
        }
        
        var body = this.prepareBody(req);
        return this.onBeforeUpdateAsync(req, doc, body).bind(this)
        .spread(function (doc, body) {
            return this.assignFields(doc, body);
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
        doc = doc.toObject();
        res.json(200, doc);
        doc = null;
    })
    .catch(function (err) {
        console.log(err);
        this.onError(req, res, err);
    })
    // end request
    .finally(function () {
        return this.endAsync(req, res);
    });
};

/**
 * partial update document using native mongo fields update operators
 **/
RestfulController.prototype.partialUpdate = function (req, res, next) {
    this.actionType = ACTIONS.PARTIALUPDATE;
    
    Bluebird.bind(this)
    // begin request
    .then(function () {
        return this.beginAsync(req, res);
    })
    .then(function () {
        return this.model.findById(req.params.id).exec();
    })
    .then(function (doc) {
        if (!doc) {
            throw new HttpError('resource not found', 404);
        }
        
        var data = _.pick(req.body, this.partialOps);
        return this.onBeforePatchAsync(req, doc, data);
    })
    .spread(function (doc, data) {
        return doc.update(data, { multi: false, upsert: false }).exec();
    })
    .then(function (numAffected) {
        return this.onAfterPatchAsync(req, numAffected);
    })
    .then(function (numAffected) {
        res.json(200, {});
    })
    .catch(function (err) {
        console.log(err);
        this.onError(req, res, err);
    })
    // end request
    .finally(function () {
        return this.endAsync(req, res);
    });
};

/**
 * delete doc by id
 **/
RestfulController.prototype.delete = function (req, res, next) {
    this.actionType = ACTIONS.DELETE;
    
    Bluebird.bind(this)
    // begin request
    .then(function () {
        return this.beginAsync(req, res);
    })
    .then(function () {
        return this.model.findById(req.params.id).exec();
    })
    .then(function (doc) {
        if (!doc) {
            throw new HttpError('resource not found', 404);
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
        console.log(err);
        this.onError(req, res, err);
    })
    // end request
    .finally(function () {
        return this.endAsync(req, res);
    });
};

/**
 * check is this request for select documents
 * */
RestfulController.prototype.isSelect = function () {
    return this.actionType === ACTIONS.SELECT;
};

/**
 * check is this request for count the documents
 * */
RestfulController.prototype.isCount = function () {
    return this.actionType === ACTIONS.COUNT;
};

/**
 * check is this request for select document by id
 * */
RestfulController.prototype.isSelectOne = function () {
    return this.actionType === ACTIONS.SELECTONE;
};

/**
 * check is this request for creation a new document
 * */
RestfulController.prototype.isCreate = function () {
    return this.actionType === ACTIONS.CREATE;
};

/**
 * check is this request for update document
 * */
RestfulController.prototype.isUpdate = function () {
    return this.actionType === ACTIONS.UPDATE;
};

/**
 * check is this request for partion update
 * */
RestfulController.prototype.isPartialUpdate = function () {
    return this.actionType === ACTIONS.PARTIALUPDATE;
};
RestfulController.prototype.isPartial = RestfulController.prototype.isPartialUpdate;

/**
 * check is this request for delete document by id
 * */
RestfulController.prototype.isDelete = function () {
    return this.actionType === ACTIONS.DELETE;
};

function HttpError(msg, code) {
    Error.captureStackTrace(this, HttpError); //super helper method to include stack trace in error object
    this.name = this.constructor.name;
    this.message = msg || '';
    this.httpStatus = code;
}

module.exports = RestfulController;
module.exports.HttpError = HttpError;

