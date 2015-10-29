'use strict';

var API = require('../../lib/api');
var Game = require('./model');

// var gameApi = new Restfy({
//     path: '/games',
//     model: Game,
//     qFields: ['developer']
// });

class GameAPI extends API {
    constructor(ops) {
        super(ops);
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
}

var gameApi = new GameAPI({
    path: '/games',
    model: Game,
    qFields: ['developer']
});

module.exports = gameApi;