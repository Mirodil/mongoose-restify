'use strict';

const ACTIONS = {
    UNKNOW: 0,
    SELECT: 1,
    SELECTONE: 2,
    COUNT: 3,
    CREATE: 4,
    UPDATE: 5,
    PARTIALUPDATE: 6,
    DELETE: 7
};

/**
 * allowed partial update operators
 **/
const PartialOps = [
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

module.exports = {
    ACTIONS,
    PartialOps
};