var express = require( 'express' );
var logger = require( 'morgan' );
var mongoose = require( 'mongoose' );
var cookieParser = require( 'cookie-parser' );
var bodyParser = require( 'body-parser' );
var router = express.Router( );

var app = express( );

// view engine setup
app.use( logger( 'dev' ) );
app.use( bodyParser.json( ) );
app.use( bodyParser.urlencoded( ) );
app.use( cookieParser( ) );

/**
 * Connect to the console database on localhost with
 * the default port (27017)
 * mongodb://localhost/games
 */
mongoose.connect( 'mongodb://localhost/games', function ( err ) {
    // if we failed to connect, abort
    if ( err ) throw err;    
} );


require( './game' ).install( router );
app.use( '/api', router );

app.use( '/', function ( req, res ) { 
    res.send( 'Hello World' );
} );
app.set( 'port', process.env.PORT || 3000 );
//var server = app.listen( app.get( 'port' ), function () {    
//    console.log( 'Express server listening on port ' + server.address( ).port );
//} );


module.exports = app;