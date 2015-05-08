

var Restfy = require('../../lib/restful');
var Game = require('./model');

var gameApi = new Restfy({
    path: '/games',
    model: Game,
    qFields: ['developer']
});



module.exports = gameApi;