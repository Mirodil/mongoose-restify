'use strict';
var _ = require('lodash');
var BaseAction = require('./action');
var ACTIONS = require('./constants').ACTIONS;
var utils = require('./utils');

/**
 * select documents
 * */
class Update extends BaseAction {
    constructor(controller) {
        super(controller);
    }

    execute(req, res, next) {
        req.actionType = ACTIONS.UPDATE;

        let promise = null;

        // begin request
        return this.controller.beginAsync(req, res)
            .then(() => {
                return this.controller.Model.findById(req.params.id).exec();
            })
            .then(doc => {
                if (!doc) {
                    throw new utils.HttpError(404, 'resource not found');
                }

                var body = this.prepareBody(req, this.controller.sFields);
                return this.controller.onBeforeUpdateAsync(req, doc, body);
            })
            .then(arr => {
                let doc = arr[0];
                let body = arr[1];

                return utils.assignFields(doc, body);
            })
            .then(doc => {
                promise = new Promise((resolve, reject) => {
                    doc.save((err, doc) => {

                        if (err)
                            return reject(err);

                        resolve(doc);

                    });
                });
                return promise;
                // if (!doc.saveAsync) {
                //     doc.saveAsync = utils.promisify(doc.save, doc);
                // }
                // return doc.saveAsync();
            })
            .then(doc => {
                return this.controller.onAfterUpdateAsync(req, doc);
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
                //     var exec = utils.promisify(doc.populate, doc);
                //     return exec();
                // }
                promise = null;
                promise = new Promise((resolve, reject) => {
                    doc.populate((err, doc) => {
                        if (err)
                            return reject(err);
                        resolve(doc);
                    });
                });
                return promise;
            })
            .then(doc => {
                doc = doc.toObject();
                res.status(200).json(doc);
            })
            .catch(err => {
                this.controller.onError(req, res, err);
            })
            // end request
            .then(() => {
                promise = null;
                this.controller.endAsync(req, res);
            });
    }
};

module.exports = Update;