'use strict';

var BaseAction = require('./action');
var ACTIONS = require('./constants').ACTIONS;


class SelectOne extends BaseAction{
    constructor(controller) {
        super(controller);
    }

    execute(req, res, next) {
        req.actionType = ACTIONS.SELECTONE;

        // begin request
        return this.controller.beginAsync(req, res)
            // build filter from req and fire on before select event
            .then(() => {
                var filter = this.parseRequest(req);
                // override query filter
                filter.query = { _id: req.params.id };
                return this.controller.onBeforeSelectOneAsync(req, filter);
            })
            // build query pipe from filter and fire `onQueryPipe` event
            .then(filter => {
                let query = this.selectOneQuery(filter);

                let promise = new Promise((resolve, reject) => {
                    // execute query pipe
                    this.controller.onQueryPipe(req, query, (err, q) => {

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
            .then(doc => {
                return this.controller.onAfterSelectOneAsync(req, doc);
            })
            .then(doc => {
                if (!doc)
                    return res.json(404, doc);
                return res.json(doc);
            })
            .catch(err => {
                this.controller.onError(req, res, err);
            })
            .then(() => {
                return this.controller.endAsync(req, res);
            });
    }
};

module.exports = SelectOne;