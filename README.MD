# mongoose-restify

Mongoose-Restify is a restify for mongodb collections though mongoose.

[![Build Status](https://api.travis-ci.org/Mirodil/mongoose-restify.svg?branch=master)](https://travis-ci.org/Mirodil/mongoose-restify)

# Use
We can overide methods listed in #methods and attache to expressjs router
```
var router = require('express').Router();
var API = require('mongoose-restify');
var Game = require('./model');

class GameAPI extends API {
    constructor(ops) {
        super(ops);
    }
    
    /**
	 * request start
	 */
    begin(req, res, next) {
        next();
    }
	
	/**
	 * request end but before send response
	 * */
    end(req, res, next) {
        next();
    }

	/**
	 * same as above for 
	 *  onBeforeSelect(req, filter, next) { next(null, filter); }
	 *  onAfterSelect(req, docs, next) { next(null, docs); }
	 *  onBeforeSelectOne(req, filter, next) { next(null, filter); }
	 * onAfterSelectOne(req, docs, next) { next(null, docs); }
	 *  onBeforeCount(req, filter, next) { next(null, filter); }
	 *  onAfterCount(req, docs, next) { next(null, docs); }
	 *  onBeforeCreate(req, body, next) { next(null, body); }
	 *  onAfterCreate(req, doc, numAffected, next) { next(null, doc); }
	 *  onBeforeUpdate(req, doc, data, next) { next(null, doc, data); }
	 *  onAfterUpdate(req, doc, numAffected, next) { next(null, doc); }
	 *  onBeforePartialUpdate(req, doc, data, next) { next(null, doc, data); }
	 *  onAfterPartialUpdate(req, doc, numAffected, next) { next(null, doc); }
	 *  onBeforeDelete(req, doc, next) { next(null, doc); }
	 *  onAfterDelete(req, doc, next) { next(null, doc); }
     *  onQueryPipe(req, queryPipe, next) { next(null, queryPipe); }
     * */
}

var gameApi = new GameAPI({
    path: '/games',
    model: Game
});

gameApi.install(router);

```

# API Options Fields

## path
`path` - path to api

```js

    var Game = mongoose.model('Game');

    var GameApi = new API({
        path: '/games',
        model: Game
    });
```

## model
Mongoose model

```js

    var Game = mongoose.model('Game');

    var GameApi = new API({
        path: '/games',
        model: Game
    });
```

## qFields
Allowed query fields. `qFields` is array. If you spesify query fields, it will be mapped to `q` query parameter in the request(query string). 
The request to the mongodb would be made through RegExp. It useful for autocomplition or some kind of serch.

```js

    var Game = mongoose.model('Game');

    var GameApi = new API({
        path: '/games',
        model: Game,
        // for example it will create: { developer: /ab/i }
        qFields: ['developer']
    });
```

## sFields
Allowed query fields to select. `fields` is string and you have to spesify the fields with space(` `) seperator, otherwise will be allowed all fields.
`fields` will be mapped to `fields` query parameter in the request(query string) and return only selected fields or uses defaults.

```js

    var Game = mongoose.model('Game');

    var GameApi = new API({
        path: '/games',
        model: Game,
        sFields: 'name developer released'
    });
```

## sort
Default sort option. `sort` is object and you have to spesify it as to mongoose `sort` option. By default null.
You can also override default sort option with query string parameter named `sort`

```js
    
    var Game = mongoose.model('Game');

    var GameApi = new API({
        path: '/games',
        model: Game,
        /*
            request `/api/games?sort[name]=1` will override default sort options
        */
        sort: { released:-1 }
    });
```

## partialOps
Allowed mongo partial update operators. 
`$inc`, `$mul`, `$setOnInsert`, `$set`, `$min`, `$max`, `$currentDate`,	 
`$addToSet`, `$pop`, `$pullAll`, `$pull`, `$push` and `$bit` allowed by default 
to overried those spesify this parameter as string array.

# Methods 

The methods listed bellow are allowed to overide.

## begin
Request start.

```js
    class CommentAPI extends API{
        begin: function (req, res, next) { 
            // todo some logic here
            next(); 
        }
    };
    
    var api = new CommentAPI({
        path: '/comments',
        model: Comment
    });
```

## end
Request end

```js
    class CommentAPI extends API{
         end: function (req, res, next) { 
            next(); 
        }
    };
    
    var api = new CommentAPI({
        path: '/comments',
        model: Comment
    });
```

## onBeforeSelect
Fires only for select documents with `GET` request method.

```js
    
    class CommentAPI extends API{
        onBeforeSelect: function (req, filter, next) { 
            /*
             todo some logic here
             filter is obect which hold 
              { query - select condition, 
                fields - select fields, 
                sort  - sort fields
                limit - number of documents to fetch, 
                skip - number of documents to skip
                lean - mongoose options
            */
            
            next(null, filter); 
        }
    };
    
    var api = new CommentAPI({
        path: '/comments',
        model: Comment
    });
```

## onAfterSelect
Fires only for select documents with `GET` request method after `onBeforeSelect` method.

```js

    class CommentAPI extends API{
        onAfterSelect: function (req, docs, next) { 
            // here is some logic
            next(null, docs); 
        }
    };
    
    var api = new CommentAPI({
        path: '/comments',
        model: Comment
    });
```
## onBeforeSelectOne
function (req, filter, next) { next(null, filter); };

## onAfterSelectOne
function (req, docs, next) { next(null, docs); };


## onBeforeCount
function (req, filter, next) { next(null, filter); };

## onAfterCount
function (req, docs, next) { next(null, docs); };

## onBeforeCreate
function (req, body, next) { next(null, body); };

## onAfterCreate 
function (req, doc, numAffected, next) { next(null, doc); };


## onBeforeUpdate 
function (req, doc, data, next) { next(null, doc, data); };

## onAfterUpdate 
function (req, doc, numAffected, next) { next(null, doc); };

## onBeforePartialUpdate 
function (req, doc, data, next) { next(null, doc, data); };

## onAfterPartialUpdate 
function (req, doc, numAffected, next) { next(null, doc); };

## onBeforeDelete 
function (req, doc, next) { next(null, doc); };

## onAfterDelete 
function (req, doc, next) { next(null, doc); };

## onQueryPipe 
function (req, queryPipe, next) { next(null, queryPipe); };

## queryPipe
Default query pipe. `queryPipe` should be function with query argument. You can use this method 
to spesify default population fields.

```js
    
    queryPipe (query) {
       return query.populate('user', 'name avatar');
    }
```

## onError
```
function (req, res, err) {
    if (err.httpStatus) {
        return res.json(err.httpStatus, { message: err.message });
    }
    
    // send internal server error
    return res.json(500, { message: 'internal server error' });
};
```