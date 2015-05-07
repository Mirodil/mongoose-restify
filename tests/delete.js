// Template based on the Mocha testing Framework from http://visionmedia.github.io/mocha/
// Syntax based on the Should.js BDD style testing from https://github.com/visionmedia/should.js

var request = require('supertest');
var express = require('express');
var should = require('should');
var Promise = require('bluebird');

var app = require('./api/app');
var generation = require('./api/generation');

// Asynchronous Code
describe('DELETE', function () {
    
    before(function (done) {
        generation.install(done);
    });
    
    var record = {
        name: 'Some Name'
        , developer: 'Dev007'
        , released: 'November 17, 2005'
    };
    
    it('should create a new docuemnt', function (done) {
        request(app)
        .post('/api/games')
        .send(record)
        .expect(201)
        .expect(function (res) {
            res.body.should.be.an.Object.and.have.property('_id');
            res.body.should.have.property('name', record.name);
            res.body.should.have.property('developer', record.developer);
            record = res.body;
        })
        .end(done);
    });
    
    it('should be 200 and delete document', function (done) {
        request(app)
        .delete('/api/games/' + record._id)
        .expect(200)
        .expect(function (res) {
            res.body.should.be.an.Object.and.have.property('_id');
            res.body.should.have.property('name', record.name);
            res.body.should.have.property('developer', record.developer);
        })
        .end(done);
    });
    
    it('should be 404', function (done) {
        request(app)
        .delete('/api/games/' + record._id)
        .expect(404)
        .end(done);
    });
    
    after(function (done) {
        generation.uninstall(done);
    });
});
