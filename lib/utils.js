'use strict';

var _ = require('lodash');

/**
 * prepare posted body
 */
function prepareBody(req, fields) {
    let body = req.body;
    if (!_.isEmpty(this.fields)) {
        //var fields = this.fields.split(this.split);
        //body = _.pick(body, fields);
        body = pickObject(body, fields);
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
function pickObject(obj, source) {

    if (!Array.isArray(source)) {
        source = source.split(/\s+|;|,/g).filter(function (i) { return i; });
    }
    let aobj = {};
    source.forEach(function (key) {

        if (key.indexOf('.') > 0) {
            let path1 = key.substring(0, key.indexOf('.'));
            let path2 = key.substring(key.indexOf('.') + 1);
            if (obj[path1]) {
                let rootObj = aobj[path1] || {};
                let subObj = pickObject(obj[path1], path2);
                let keys = Object.keys(subObj);
                for (let i = 0; i < keys.length; i++) {
                    let subKey = keys[0];
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
};

/**
 * assign fields from obj to doc
 * @param {Object} dest
 * @param {Object} src
 * @return {Object} changed dest object
 * @example:
 * assignFields({a:1,b:2, c:{a:11, b:22, c:44}}, {a:10, c:{c:33}}) //-> {a:10, b:2, c:{a:11, b:22, c:33}}
 **/
function assignFields(dest, src, rKey) {

    rKey = rKey || '';
    _.forEach(src, function (val, key) {
        // TODO: needs to exclude ObjectId(should be direct assign)
        if (_.isObject(val) && !_.isArray(val)) {
            assignFields(dest, val, key);
        } else {
            key = rKey ? rKey + '.' + key : key;
            dest.set(key, val);
        }
    });
    return dest;
};

function HttpError(code, msg) {
    Error.captureStackTrace(this, HttpError); //super helper method to include stack trace in error object
    this.name = this.constructor.name;
    this.message = msg || '';
    this.httpStatus = code;
}

function retriveVal(req, name, defaultValue) {

    if (null != req.params[name] && req.params.hasOwnProperty(name)) return req.params[name];
    if (null != req.body[name]) return req.body[name];
    if (null != req.query[name]) return req.query[name];

    return defaultValue;
}

function promisify(fn, receiver) {
    return function () {
        let args = Array.prototype.slice.call(arguments);

        var promise = new Promise(function (resolve, reject) {

            args[args.length] = function () {
                if (arguments[0])
                    return reject(arguments[0]);
                let args = Array.prototype.slice.call(arguments, 1);

                if (args.length > 1) {
                    resolve(args);
                } else {
                    resolve(args[0] || null);
                }
            };

            fn.apply(receiver, args)
        });

        return promise;
    };
}

const RXUTC = /\d{4}\-\d{2}\-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z/i;
const RXGMT = /\w+,\s\d{2}\s\w+\s\d{4}\s\d{2}:\d{2}:\d{2}\sGMT/i;

function convertValueTo(val, datatype) {
    switch (datatype) {
        case Number:
            return val ? Number(val) : val;
        case Date:
            if (/\d+{13}/.test(val + ''))
                return new Date(Number(val));
            else if (/\d+{10}/.test(val + ''))
                return new Date(Number(val) * 1000);
            //2015-10-31T19:04:51.123Z || Sat, 31 Oct 2015 19:04:51 GMT
            else if (RXUTC.test(val) || RXUTC.test(val))
                return new Date(val);
            else
                return val;
        default:
            return val ? val + '' : val;
    }
}

module.exports = {
    prepareBody: prepareBody,
    assignFields: assignFields,
    HttpError: HttpError,
    retriveVal: retriveVal,
    promisify: promisify,
    pickObject
};