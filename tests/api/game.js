

var Restfy = require('../../lib/restful');
var Game = require('./model');

var gameApi = new Restfy({
    path: '/games',
    model: Game
});



module.exports = gameApi;