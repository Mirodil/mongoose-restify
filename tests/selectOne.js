// Template based on the Mocha testing Framework from http://visionmedia.github.io/mocha/
// Syntax based on the Should.js BDD style testing from https://github.com/visionmedia/should.js

var request = require('supertest');
var express = require('express');
var should = require('should');

var app = require('./api/app');
var generation = require('./api/generation');

// Asynchronous Code
describe('SELECT ONE', function () {
       
    before(function (done) {
        generation.install(done);
    });
    
    var data = [];
    
    it('get all', function (done) {
        request(app)
        .get('/api/games?fields=_id')
        .expect(200)
        .expect(function (res) {
            res.body.should.be.Array();
            (res.body.length > 0).should.be.ok;
            data = res.body;
        })
        .end(done);
    });
    
    it('should be 404 not found', function (done) {
        request(app)
        .get('/api/games/5542285124380a4c26892bf4')
        .expect(404)        
        .end(done);
    });
    
    it('should be 200 and found document', function (done) {
        request(app)
        .get('/api/games/'+ data[0]._id)
        .expect(200)
        .expect(function (res) { 
            res.body.should.be.an.Object().and.have.property('_id');
        })
        .end(done);
    });
    
    after(function (done) {
        generation.uninstall(done);
    });
});
