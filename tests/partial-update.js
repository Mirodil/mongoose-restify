// Template based on the Mocha testing Framework from http://visionmedia.github.io/mocha/
// Syntax based on the Should.js BDD style testing from https://github.com/visionmedia/should.js

var request = require('supertest');
var express = require('express');
var should = require('should');
var Promise = require('bluebird');

var app = require('./api/app');
var generation = require('./api/generation');

// Asynchronous Code
describe('PARTIAL UPDATE', function () {
    
    before(function (done) {
        generation.install(done);
    });
    
    var record = null;
    
    it('should return one record from db', function (done) {
        var query = 'limit=1';
        request(app)
        .get('/api/games?' + query)
        .expect(200)
        .expect(function (res) {
            res.body.should.be.array;
            (res.body.length === 1).should.be.ok;
            record = res.body[0];
        })
        .end(done);
    });
    
    it('should update a field', function (done) {
        request(app)
        .patch('/api/games/' + record._id)
        .send({
            $set : { name: 'hello world' }
        })
        .expect(200)
        .end(done);
    });
    
    it('check updated a field', function (done) {
        request(app)
        .get('/api/games/' + record._id)
        .expect(200)
        .expect(function (res) {
            res.body.should.be.an.Object.and.have.property('name', 'hello world');
        })
        .end(done);
    });
    
    it('shoud be status 200 and update all fields', function (done) {
        request(app)
        .patch('/api/games/' + record._id)
        .send({
            $set: {
                name: record.name,
                developer: record.developer,
                released: record.released
            }
        })
        .expect(200)
        .end(done);
    });
    
    it('check updaed fields', function (done) {
        request(app)
        .get('/api/games/' + record._id)
        .expect(200)
        .expect(function (res) {
            res.body.should.be.an.Object.and.have.properties({
                name: record.name,
                developer: record.developer,
                released: record.released
            });
            console.log(res.body);
        })
        .end(done);
    });
    
    it('should be 404', function (done) {
        request(app)
        .put('/api/games/000000000000000000000000')
        .send({})
        .expect(404)
        .end(done);
    });
    
    after(function (done) {
        generation.uninstall(done);
    });
});
