// Template based on the Mocha testing Framework from http://visionmedia.github.io/mocha/
// Syntax based on the Should.js BDD style testing from https://github.com/visionmedia/should.js

var request = require( 'supertest' );
var express = require( 'express' );
var should = require( 'should' );
var Promise = require( 'bluebird' );

var app = require( './api/app' );
var generation = require( './api/generation' );

// Asynchronous Code
describe( 'SELECT', function () {
    //describe('#save()', function () {
    //    it('should save without error', function (done) {
    //        var user = new User('Luna');
    //        user.save(done);
    //    })
    //})
    
    before( function ( done ) {
        generation.install( done );
    } );
    
    
    it( 'empty', function ( done ) {
        request( app )
        .get( '/api/games' )
        .expect( 200 )
        .expect(function (res) {
            res.body.should.be.array;
            (res.body.length > 0).should.be.ok;            
        } )
        .end( done );
    });
    
    it('with query', function (done) {
        var query = 'q[developer]=Nintendo';
        request(app)
        .get('/api/games?'+ query)
        .expect(200)
        .expect(function (res) {
            res.body.should.be.array;
            (res.body.length > 0).should.be.ok;
        })
        .end(done);
    });
    
    it('with limit', function (done) {
        var query = 'limit=1';
        request(app)
        .get('/api/games?' + query)
        .expect(200)
        .expect(function (res) {
            res.body.should.be.array;
            (res.body.length === 1).should.be.ok;
        })
        .end(done);
    });
    
    it('with skip', function (done) {
        var query = 'skip=1';
        request(app)
        .get('/api/games?' + query)
        .expect(200)
        .expect(function (res) {
            res.body.should.be.array;
            (res.body.length > 0).should.be.ok;
        })
        .end(done);
    });

    it('with sort', function (done) {
        var query = 'sort[name]=1';
        request(app)
        .get('/api/games?' + query)
        .expect(200)
        .expect(function (res) {
            res.body.should.be.array;
            (res.body.length > 0).should.be.ok;
        })
        .end(done);
    });
    
    it('with fields', function (done) {
        var query = 'fields=name,developer,-_id';
        request(app)
        .get('/api/games?' + query)
        .expect(200)
        .expect(function (res) {
            res.body.should.be.array;
            (res.body.length > 0).should.be.ok;
            res.body[0].should.have.properties('name', 'developer');
            console.log(res.body[0]);
        })
        .end(done);
    });
    
    after( function ( done ) {
        generation.uninstall( done );
    } );
} );

// Run a specific Test Case

//describe('Array', function () {
//    describe('#indexOf()', function () {
//        it.only('should return -1 unless present', function () {

//        })

//        it('should return the index when present', function () {

//        })
//    })
//})

// Skip a Specific Test case

//describe('Array', function () {
//    describe('#indexOf()', function () {
//        it.skip('should return -1 unless present', function () {

//        })

//        it('should return the index when present', function () {

//        })
//    })
//})
