'use strict';

var _ = require('lodash');

/**
 * allowed partial update operators
 **/
var PartialOps = [
/// Field Update Operators
    '$inc',             //Increments the value of the field by the specified amount
    '$mul',	            //Multiplies the value of the field by the specified amount
    '$setOnInsert',     //Sets the value of a field if an update results in an insert of a document. Has no effect on update operations that modify existing documents
    '$set',             //Sets the value of a field in a document
    '$min',	            //Only updates the field if the specified value is less than the existing field value
    '$max',	            //Only updates the field if the specified value is greater than the existing field value
    '$currentDate',	    //Sets the value of a field to current date, either as a Date or a Timestamp
	
/// Array Update Operators
    '$addToSet',        // Adds elements to an array only if they do not already exist in the set
    '$pop',             //Removes the first or last item of an array
    '$pullAll',         //Removes all matching values from an array
    '$pull',            //Removes all array elements that match a specified query
    '$push',            //Adds an item to an array
	
/// Bitwise Update Operator
    '$bit'              // Performs bitwise AND, OR, and XOR updates of integer values
];

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

module.exports = {
    PartialOps: PartialOps,
    prepareBody: prepareBody,
    assignFields: assignFields,
    HttpError: HttpError
};