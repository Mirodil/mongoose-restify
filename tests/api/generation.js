var Game = require( './model' );


var data = [
    {
        name: 'Legend of Zelda: Ocarina of Time'
        , developer: 'Nintendo'
        , released: 'November 21, 1998'
    }, {
        name: 'Mario Kart'
        , developer: 'Nintendo'
        , released: 'September 1, 1992'
    }, {
        name: 'Perfect Dark Zero'
        , developer: 'Rare'
        , released: 'November 17, 2005'
    }
];

module.exports = {
    install: function ( done ) {
        /**
         * Data generation
         */
        console.log('Test data generation');
        Game.create(data, function (err, docs) {            
            done(err);
        });
    },
    uninstall: function (done) {
        console.log('Remove test data');
        Game.remove( {}, done );
    }
};