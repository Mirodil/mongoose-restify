'use strict';
var BaseAction = require('./action');
var ACTIONS = require('./constants').ACTIONS;


/**
 * select documents
 * */
class Select extends BaseAction {
    constructor(controller) {
        super(controller);
    }
    /**
     * handler particular request
     * @param req {IncomingRequest}
     * @param res {ServerResponse}
     * @param next {Function}
     */
    execute(req, res, next) {
        req.actionType = ACTIONS.SELECT;
        let promise = null;

        this.controller.beginAsync(req, res)
            // build filter from req and fire on before select event
            .then(() => {
                var filter = this.parseRequest(req);
                return this.controller.onBeforeSelectAsync(req, filter);
            })
            // build query pipe from filter and fire `onQueryPipe` event
            .then(filter => {
                let query = this.selectQuery(filter);

                promise = new Promise((resolve, reject) => {
                    // execute query pipe
                    this.controller.onQueryPipe(req, query, (err, q) => {

                        if (err)
                            return reject(err);

                        if (this.controller.lean)
                            q.lean();

                        return resolve(q.exec());

                    });
                });

                return promise;
            })
            // gets reponse from db and fire `onAfterSelect` event
            .then(docs => {
                return this.controller.onAfterSelectAsync(req, docs);
            })
            .then(docs => {
                return res.json(docs);
            })
            .catch(err => {
                this.controller.onError(req, res, err);
            })
            .then(() => {
                this.controller.endAsync(req, res);
            });
    }
};

module.exports = Select;