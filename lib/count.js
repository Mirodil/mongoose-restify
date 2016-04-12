'use strict';

var BaseAction = require('./action');
var ACTIONS = require('./constants').ACTIONS;


class Count extends BaseAction {
    constructor(controller) {
        super(controller);
    }

    execute(req, res, next) {
        req.actionType = ACTIONS.COUNT;

        // begin request
        return this.controller.beginAsync(req, res)
            // build filter from req and fire on before select event
            .then(() => {
                let filter = this.parseRequest(req);
                return this.controller.onBeforeCountAsync(req, filter);
            })
            // build query from filter and execute it
            .then(filter => {
                return this.controller.Model.count(filter.query).exec();
            })
            // gets reponse from db and fire `onAfterSelect` event
            .then(count => {
                return this.controller.onAfterCountAsync(req, count);
            })
            .then(count => {
                return res.json({ count: count });
            })
            .catch(err => {
                this.controller.onError(req, res, err);
            })
            .then(() => {
                return this.controller.endAsync(req, res);
            });
    }
};

module.exports = Count;