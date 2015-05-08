// Template based on the Mocha testing Framework from http://visionmedia.github.io/mocha/
// Syntax based on the Should.js BDD style testing from https://github.com/visionmedia/should.js

var request = require('supertest');
var express = require('express');
var should = require('should');
var Promise = require('bluebird');

var app = require('./api/app');
var generation = require('./api/generation');

// Asynchronous Code
describe('COUNT', function () {
       
    before(function (done) {
        generation.install(done);
    });
    
    var data = [];
    
    it('should get total count and be 3', function (done) {
        request(app)
        .get('/api/games/count')
        .expect(200)
        .expect(function (res) {
            res.body.should.be.an.Object.and.have.property('count', 3);
        })
        .end(done);
    });
    
    it('should be count 2', function (done) {
        var query = 'query[developer]=Nintendo';
        request(app)
        .get('/api/games/count?'+ query)
        .expect(200)
        .expect(function (res) {
            res.body.should.be.an.Object.and.have.property('count', 2);
        })
        .end(done);
    });
    
    it('should be count 1', function (done) {
        var query = 'query[developer]=Rare';
        request(app)
        .get('/api/games/count?' + query)
        .expect(200)
        .expect(function (res) {
            res.body.should.be.an.Object.and.have.property('count', 1);
        })
        .end(done);
    });
    
    after(function (done) {
        generation.uninstall(done);
    });
});
