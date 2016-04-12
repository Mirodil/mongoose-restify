'use strict';
var _ = require('lodash');
var BaseAction = require('./action');
var ACTIONS = require('./constants').ACTIONS;

/**
 * create a new documen
 * */
class Create extends BaseAction {
    constructor(controller) {
        super(controller);
    }

    execute(req, res, next) {
        req.actionType = ACTIONS.CREATE;

        let doc = null;
        let promise = null;

        // begin request
        return this.controller.beginAsync(req, res)
            .then(() => {
                let body = this.prepareBody(req, this.controller.sFields);
                return this.controller.onBeforeCreateAsync(req, body);
            })
            .then(body => {

                doc = new this.controller.Model(body);
                promise = new Promise((resolve, reject) => {
                    doc.save((err, doc) => {

                        if (err)
                            return reject(err);

                        resolve(doc);

                    });
                });

                return promise;
            })
            .then(doc => {
                return this.controller.onAfterCreateAsync(req, doc);
            })
            .then(doc => {
                if (this.controller.queryPipe && _.isFunction(this.controller.queryPipe)) {
                    this.controller.queryPipe.call(this.controller, doc);
                }
                return this.controller.onQueryPipeAsync(req, doc);
            })
            .then(doc => {
                // if (doc.execPopulate) {
                //     return doc.execPopulate();
                // } else {
                promise = null;
                promise = new Promise((resolve, reject) => {
                    doc.populate((err, doc) => {
                        if (err)
                            return reject(err);
                        resolve(doc);
                    });
                });
                return promise;
                // }
            })
            .then(doc => {
                doc = doc.toObject();
                res.status(201).json(doc);
            })
            .catch(err => {
                this.controller.onError(req, res, err);
            })
            // end request
            .then(() => {
                doc = null;
                promise = null;
                return this.controller.endAsync(req, res);
            });
    }
};

module.exports = Create;