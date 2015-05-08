/* jshint undef: true, unused: true, nonew: true, node: true */
/* global require */
'use strict';
//var router = require('express').Router();
var Bluebird = require('bluebird');
var _ = require('lodash');

/**
 * allowed partial update operators
 **/
var PartialOps = [
	/// Field Update Operators
    '$inc',             //Increments the value of the field by the specified amount
    '$mul',	            //Multiplies the value of the field by the specified amount
    '$setOnInsert',     //Sets the value of a field if an update results in an insert of a document. Has no effect on update operations that modify existing documents
    '$set',             //Sets the value of a field in a document
    '$min',	            //Only updates the field if the specified value is less than the existing field value
    '$max',	            //Only updates the field if the specified value is greater than the existing field value
    '$currentDate',	    //Sets the value of a field to current date, either as a Date or a Timestamp
	
	/// Array Update Operators
    '$addToSet',        // Adds elements to an array only if they do not already exist in the set
    '$pop',             //Removes the first or last item of an array
    '$pullAll',         //Removes all matching values from an array
    '$pull',            //Removes all array elements that match a specified query
    '$push',            //Adds an item to an array
	
	/// Bitwise Update Operator
    '$bit'              // Performs bitwise AND, OR, and XOR updates of integer values
];

function ApiController(ops) {
    ops = ops || {};
    /**
     * request path
     */
    this.path = ops.path || '';
    /**
     * mongoose model
     */
    this.model = ops.model || null;
    /**
     * allowed query fields
     */
    this.qFields = ops.qFields || [];
    /**
     * allowed fields
     */
    this.fields = ops.fields || '';
    /**
     * allowed query fields
     */
    this.sFields = ops.sFields || '';
    /**
     * default sort option
     */
    this.sort = ops.sort || null;//default sort option
    /**
     * fields splitter
     */
    this.split = ops.sort || /\s|,|;/;
    /**
     * allowed mongo modificators
     */
    this.partialOps = ops.partialOps || PartialOps;
    /**
     * default query pipe
     **/
    this.queryPipe = ops.queryPipe || null;
    
    /**
     * create async methods for
     **/
    // for req begin->end
    this.beginAsync = Bluebird.promisify(ops.begin || this.begin, this);
    this.endAsync = Bluebird.promisify(ops.end || this.end, this);
    // for select docs begin->end
    this.onBeforeSelectAsync = Bluebird.promisify(ops.onBeforeSelect || this.onBeforeSelect, this);
    this.onAfterSelectAsync = Bluebird.promisify(ops.onAfterSelect || this.onAfterSelect, this);
    // for select a doc begin->end
    this.onBeforeSelectOneAsync = Bluebird.promisify(ops.onBeforeSelectOne || this.onBeforeSelectOne, this);
    this.onAfterSelectOneAsync = Bluebird.promisify(ops.onAfterSelectOne || this.onAfterSelectOne, this);
    // for count begin->end
    this.onBeforeCountAsync = Bluebird.promisify(ops.onBeforeCount || this.onBeforeCount, this);
    this.onAfterCountAsync = Bluebird.promisify(ops.onAfterCount || this.onAfterCount, this);
    // for create doc begin->end
    this.onBeforeCreateAsync = Bluebird.promisify(ops.onBeforeCreate || this.onBeforeCreate, this);
    this.onAfterCreateAsync = Bluebird.promisify(ops.onAfterCreate || this.onAfterCreate, this);
    // for update doc begin->end
    this.onBeforeUpdateAsync = Bluebird.promisify(ops.onBeforeUpdate || this.onBeforeUpdate, this);
    this.onAfterUpdateAsync = Bluebird.promisify(ops.onAfterUpdate || this.onAfterUpdate, this);
    // for partial update doc begin->end
    this.onBeforePatchAsync = Bluebird.promisify(ops.onBeforePartialUpdate || this.onBeforePartialUpdate, this);
    this.onAfterPatchAsync = Bluebird.promisify(ops.onAfterPartialUpdate || this.onAfterPartialUpdate, this);
    // for delete doc begin->end
    this.onBeforeDeleteAsync = Bluebird.promisify(ops.onBeforeDelete || this.onBeforeDelete, this);
    this.onAfterDeleteAsync = Bluebird.promisify(ops.onAfterDelete || this.onAfterDelete, this);
    
    // // //this.onFilterAsync = Bluebird.promisify(this.onFilter, this);
    this.onQueryPipeAsync = Bluebird.promisify(ops.onAfterSelectOne || this.onQueryPipe, this);
}

// request start
ApiController.prototype.begin = function (req, res, next) { next(); };
// request end but before send response
ApiController.prototype.end = function (req, res, next) { next(); };

// request start
ApiController.prototype.onBeforeSelect = function (req, filter, next) { next(null, filter); };
// request end but before send response
ApiController.prototype.onAfterSelect = function (req, docs, next) { next(null, docs); };
// request start
ApiController.prototype.onBeforeSelectOne = function (req, filter, next) { next(null, filter); };
// request end but before send response
ApiController.prototype.onAfterSelectOne = function (req, docs, next) { next(null, docs); };
// request start
ApiController.prototype.onBeforeCount = function (req, filter, next) { next(null, filter); };
// request end but before send response
ApiController.prototype.onAfterCount = function (req, docs, next) { next(null, docs); };
// start create request
ApiController.prototype.onBeforeCreate = function (req, body, next) { next(null, body); };
// request end but before send response
ApiController.prototype.onAfterCreate = function (req, doc, numAffected, next) { next(null, doc); };
// start update request
ApiController.prototype.onBeforeUpdate = function (req, doc, data, next) { next(null, doc, data); };
// request end but before send response
ApiController.prototype.onAfterUpdate = function (req, doc, numAffected, next) { next(null, doc); };
// start partial update request
ApiController.prototype.onBeforePartialUpdate = function (req, doc, data, next) { next(null, doc, data); };
// request end but before send response
ApiController.prototype.onAfterPartialUpdate = function (req, doc, next) { next(null, doc); };
// start update request
ApiController.prototype.onBeforeDelete = function (req, doc, next) { next(null, doc); };
// request end but before send response
ApiController.prototype.onAfterDelete = function (req, doc, next) { next(null, doc); };

// // //// after filter req parsed
// // ////ApiController.prototype.onFilter = function(req, filter, next){ next(null, filter); };
// on query build
ApiController.prototype.onQueryPipe = function (req, queryPipe, next) { next(null, queryPipe); };


ApiController.prototype.onError = function (req, res, err) {
    if (err.httpStatus) {
        return res.json(err.httpStatus, { message: err.message });
    }
    
    // send internal server error
    return res.json(500, { message: 'internal server error' });
};

ApiController.prototype.parseRequest = function (req) {
    var options = {
        query: {},
        fields: this.fields,
        sort: this.sort,
        limit: 15,
        skip: 0,
        lean: false
    };
    var param = req.param('q');
    if (!_.isEmpty(param) && this.qFields && this.qFields.length > 0) {
        param = _.escapeRegExp(param);
        var rx = new RegExp(param, 'i');
        this.qFields.forEach(function (key) {
            options.query[key] = rx;
        });
    }

    param = req.param('query');
    if (!_.isEmpty(param)) {
        options.query = _.extend(options.query, param);
    }
    
    param = req.param('fields');
    if (!_.isEmpty(param)) {
        var ia = param.split(this.split);
        var da = this.fields.split(this.split);
        if (!_.isEmpty(this.fields)) {
            options.fields = _.intersection(da, ia).join(' ');
        } else {
            options.fields = ia.join(' ');
        }
        ia = null;
        da = null;
    }
    param = req.param('sort');
    if (!_.isEmpty(param)) {
        options.sort = param || null;
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
};

ApiController.prototype.selectQuery = function (filter) {
    var query = this.model.find(filter.query, filter.fields, { skip: filter.skip, limit: filter.limit, sort: filter.sort });
    if (this.queryPipe && _.isFunction(this.queryPipe)) {
        this.queryPipe.call(this, query);
    }
    return query;
};

ApiController.prototype.selectOneQuery = function (filter) {
    var query = this.model.findOne(filter.query, filter.fields, { sort: filter.sort });
    if (this.queryPipe && _.isFunction(this.queryPipe)) {
        this.queryPipe.call(this, query);
    }
    return query;
};

/**
 * prepare posted body
 */
ApiController.prototype.prepareBody = function (req) {
    var body = req.body;
    if (!_.isEmpty(this.fields)) {
        var fields = this.fields.split(this.split);
        //body = _.pick(body, fields);
        body = this.pickObject(body, fields);
        fields = null;
    }
    return body;
};

/**
 * pick object keys pinted in source array
 * @param {Object} obj
 * @param {Array} source 
 * @return {Object} new object
 *
 * @example:
 * ->pickObject({ a:1,b:2,c:3, d:{ a:11, b:22, c:33 } }, 'a b d.b d.c') //-> {a:1, b:2, d:{ b:22, c:33 }}
 */
ApiController.prototype.pickObject = function (obj, source) {
    
    if (!Array.isArray(source)) {
        source = source.split(/\s+|;|,/g).filter(function (i) { return i; });
    }
    var aobj = {};
    source.forEach(function (key) {
        
        if (key.indexOf('.') > 0) {
            var path1 = key.substring(0, key.indexOf('.'));
            var path2 = key.substring(key.indexOf('.') + 1);
            if (obj[path1]) {
                var rootObj = aobj[path1] || {};
                var subObj = pick(obj[path1], path2);
                var keys = Object.keys(subObj);
                for (var i = 0; i < keys.length; i++) {
                    var subKey = keys[0];
                    rootObj[subKey] = subObj[subKey];
                }
                aobj[path1] = rootObj;
            }
            return;
        }
        
        if (obj[key] !== undefined) {
            aobj[key] = obj[key];
        }
    });
    return aobj;
}

/**
 * assign fields from obj to doc
 * @param {Object} dest
 * @param {Object} src
 * @return {Object} changed dest object
 * @example:
 * assignFields({a:1,b:2, c:{a:11, b:22, c:44}}, {a:10, c:{c:33}}) //-> {a:10, b:2, c:{a:11, b:22, c:33}}
 **/
ApiController.prototype.assignFields = function (dest, src, rKey) {
    //_.forEach(src, function (val, key) {
    //    if (_.isObject(val)) {
    //        this.assignFields(dest[key], val);
    //    } else {
    //        dest[key] = val;
    //    }
    //}, this);
    
    rKey = rKey || '';
    _.forEach(src, function (val, key) {
        if (_.isObject(val)) {
            this.assignFields(dest, val, key);
        } else {
            key = rKey ? rKey + '.' + key : key;
            dest.set(key, val);
        }
    }, this);
    return dest;
    
    return dest;
};



//ApiController.prototype.toJSON = function ( str, def ) {
//	str += '';
//	try {
//		return JSON.parse( str );
//	} catch ( e ) {
//		console.error( e );
//	}
//	return def;
//};

module.exports = ApiController;