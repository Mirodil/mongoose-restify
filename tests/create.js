// Template based on the Mocha testing Framework from http://visionmedia.github.io/mocha/
// Syntax based on the Should.js BDD style testing from https://github.com/visionmedia/should.js

var request = require('supertest');
var express = require('express');
var should = require('should');

var app = require('./api/app');
var generation = require('./api/generation');

// Asynchronous Code
describe('CREATE', function () {
       
    before(function (done) {
        generation.install(done);
    });
    
    var data = {
        name: 'Some Name'
        , developer: 'Dev007'
        , released: 'November 17, 2005'
    };
    
    it('should create a new docuemnt', function (done) {
        request(app)
        .post('/api/games')
        .send(data)
        .expect(201)
        .expect(function (res) {
            res.body.should.be.an.Object().and.have.property('_id');
            res.body.should.have.property('name', data.name);
            res.body.should.have.property('developer', data.developer);            
        })
        .end(done);
    });
    
    
    after(function (done) {
        generation.uninstall(done);
    });
});
