'use strict';

var _ = require('lodash');
var utils = require('./utils');

class BaseAction {
    constructor(controller) {
        this.controller = controller;
    }
    /**
     * create query for select
     */
    selectQuery(filter) {
        let query = this.controller.Model.find(filter.query, filter.fields, { skip: filter.skip, limit: filter.limit, sort: filter.sort });
        if (this.controller.queryPipe && _.isFunction(this.controller.queryPipe)) {
            this.controller.queryPipe.call(this.controller, query);
        }
        return query;
    }

    /**
     * create Query for select
     */
    selectOneQuery(filter) {
        let query = this.controller.Model.findOne(filter.query, filter.fields, { sort: filter.sort });
        if (this.queryPipe && _.isFunction(this.queryPipe)) {
            this.queryPipe.call(this, query);
        }
        return query;
    }

    /**
	 * parse incoming request and extract the following fields from it:
	 * 	`q` - free text search mapped to `qFields`
	 * 	`query` - filer query
	 * 	`fields` - select fields, mapped to `sFields`
	 * 	`sort` - sort result, mapped to default `sort`
	 * 	`limit` - number of documents
	 * 	`skip` - number of documents
	 */
    parseRequest(req) {
        let controller = this.controller;

        let options = {
            query: {},
            fields: controller.sFields.join(' '),
            sort: controller.sort,
            limit: 15,
            skip: 0,
            lean: false
        };

        let param = utils.retriveVal(req, 'q');
        if (!_.isEmpty(param) && controller.qFields && controller.qFields.length > 0) {
            param = _.escapeRegExp(param);
            let rx = new RegExp(param, 'i');
            controller.qFields.forEach(function(key) {
                options.query[key] = rx;
            });
        }

        param = utils.retriveVal(req, 'query');
        if (!_.isEmpty(param)) {
            options.query = _.extend(options.query, param);
            // TODO: convert path or use default
        }

        param = utils.retriveVal(req, 'fields');
        if (!_.isEmpty(param)) {
            let ia = param.split(controller.split);
            let da = controller.sFields;
            if (!_.isEmpty(controller.sFields)) {
                options.fields = _.intersection(da, ia).join(' ');
            } else {
                options.fields = ia.join(' ');
            }
            ia = null;
            da = null;
        }
        param = utils.retriveVal(req, 'sort');
        if (!_.isEmpty(param)) {
            options.sort = param || controller.sort;
        }
        param = utils.retriveVal(req, 'limit');
        if (!_.isEmpty(param)) {
            options.limit = parseFloat(param) || options.limit;
        }
        param = utils.retriveVal(req, 'skip');
        if (!_.isEmpty(param)) {
            options.skip = parseFloat(param) || options.skip;
        }
        return options;
    }
    /**
     * prepare posted body
     */
    prepareBody(req, fields) {
        let body = req.body;
        if (!_.isEmpty(fields)) {
            //var fields = this.fields.split(this.split);
            //body = _.pick(body, fields);
            body = utils.pickObject(body, fields);
            fields = null;
        }
        return body;
    }
};

module.exports = BaseAction;