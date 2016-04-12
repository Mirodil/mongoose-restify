'use strict';
var _ = require('lodash');
var BaseAction = require('./action');
var ACTIONS = require('./constants').ACTIONS;
var PartialOps = require('./constants').PartialOps;
var utils = require('./utils');

/**
 * partial update document using native mongo fields update operators
 * */
class PartialUpdate extends BaseAction{
    constructor(controller) {
        super(controller);
    }

    execute(req, res, next) {
        req.actionType = ACTIONS.PARTIALUPDATE;

        // begin request
        return this.controller.beginAsync(req, res)
            .then(() => {
                return this.controller.Model.findById(req.params.id).exec();
            })
            .then((doc) => {
                if (!doc) {
                    throw new utils.HttpError(404, 'resource not found');
                }

                var data = _.pick(req.body, this.controller.partialOps);
                return this.controller.onBeforePartialUpdateAsync(req, doc, data);
            })
            .then((arr) => {
                // TODO: needs integrate validation by path
                let doc = arr[0];
                let data = arr[1];
                return doc.update(data, { multi: false, upsert: false }).exec();
            })
            .then(numAffected => {
                return this.controller.Model.findById(req.params.id).exec()
                    .then(doc => {
                        return [doc, numAffected];
                    });
            })
            .then((arr) => {
                let doc = arr[0];
                let numAffected = arr[1];
                return this.controller.onAfterPartialUpdateAsync(req, doc, numAffected);
            })
            .then(doc => {
                if (!doc) {
                    doc = doc.toObject();
                    doc = _.pick(doc, this.controller.sFields);
                }
                res.status(200).json(doc);
            })
            .catch((err) => {
                this.controller.onError(req, res, err);
            })
            // end request
            .then(() => {
                return this.controller.endAsync(req, res);
            });
    }
};

module.exports = PartialUpdate;