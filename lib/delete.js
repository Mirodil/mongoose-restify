'use strict';
var BaseAction = require('./action');
var ACTIONS = require('./constants').ACTIONS;
var utils = require('./utils');

/**
 * delete doc by id
 * */
class DeleteDocument extends BaseAction{
    constructor(controller) {
        super(controller);
    }

    execute(req, res, next) {
        req.actionType = ACTIONS.DELETE;

        // begin request
        return this.controller.beginAsync(req, res)
            .then(() => {
                return this.controller.Model.findById(req.params.id).exec();
            })
            .then((doc) => {
                if (!doc) {
                    throw new utils.HttpError(404, 'resource not found');
                }

                return this.controller.onBeforeDeleteAsync(req, doc);
            })
            .then((doc) => {
                if (!doc.removeAsync)
                    doc.removeAsync = utils.promisify(doc.remove, doc);

                return doc.removeAsync();
            })
            .then((doc) => {
                return this.controller.onAfterDeleteAsync(req, doc);
            })
            .then((doc) => {
                doc = doc.toObject();
                res.status(200).json(doc);
                doc = null;
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

module.exports = DeleteDocument;