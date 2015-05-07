var mongoose = require( 'mongoose' );
var Schema = mongoose.Schema;

/**
 * Game schema
 */
var gameSchema = Schema( {
    name: String
    , developer: String
    , released: Date
} );

var Game = mongoose.model( 'Game', gameSchema );


module.exports = Game;