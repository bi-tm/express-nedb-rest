var express = require('express');
var bodyParser = require("body-parser");
var nedb = require('nedb');
var filter = require('./filter');
var order = require('./order');

function expressNedbRest() {
    var router = express.Router();

    // initialize configuration object (no collections yet)
    router.cfg = { collections:[] };

    // parse body of request
    router.use(bodyParser.json());
    
    // add configuration to each request 
    router.use(function (req, res, next) {
        req.cfg = router.cfg;
        next();
    });

    // call validator function, if configured
    if (router.cfg.validator) {
        router.use(router.cfg.validator);
    }

    // find datastore of collection and add it to request object
    router.param('collection', function collectionParam(req, res, next, collection) {
        req.collection = collection;
        req.nedb = req.cfg.collections[collection];
        if (!req.nedb) {
            throw { status: 404, 
                    message: "unknown collection " + req.collection }; // Bad Request
        }
        req.$filter = filter(req.query.$filter);
        next();
    });

    // add object id from uri to request 
    router.param('id', function (req, res, next, id) {
        req.id = id;
        next();
    });

    // register methods for GET, POST, ...
    addRestMethods(router);

    // send json result at last
    router.use(function(req, res, next){
        if (res.locals.json) {
            res.json(res.locals.json);
        }
        else if (res.locals.err) {
            res.status(400);
            res.send(res.locals.err);
            next();
        }
        else {
            next();
        }        
    });

    // declare method to add datastore
    router.addDatastore = function(collection, store) {
        this.cfg.collections[collection] = store;
    };

    // declare method to set validator callback function
    router.setValidator = function(f) {
        if (typeof(f) == "function") {
            this.cfg.validator = f;
        }
        else {
            this.cfg.validator = null;
        }
    };

    // return router
    return router;
};


function fullUrl(req) {
    return req.protocol + '://' + req.get('host') + req.originalUrl
}

function addRestMethods(router) {
    
    //--------------------------------------------------------------------------
    router.get('/', function (req, res, next) {
        res.locals.json = [];
        for(var name in req.cfg.collections) {
            res.locals.json.push({
                "name": name, 
                "link": fullUrl(req) + name
            });    
        }
        res.append('X-Total-Count', res.locals.json.length);
        next();
    });

    //--------------------------------------------------------------------------
    router.get('/:collection', function (req, res, next) {
        var query = req.nedb.find(req.$filter);
        var $order = order(req.query.$orderby);
        if ($order) query.sort($order);
        if (!isNaN(req.query.$skip)) query.skip(parseInt(req.query.$skip));
        if (!isNaN(req.query.$limit)) query.limit(parseInt(req.query.$limit));
        query.exec(function(err, docs) {
            if (err) {
                return next(err);
            }
            else {
                res.append('X-Total-Count', docs.length);
                res.locals.json = docs;
                next();
            }
        });
    });

    //--------------------------------------------------------------------------
    router.get('/:collection/:id', function (req, res, next) {
        req.nedb.findOne({ _id: req.id }, function (err, doc) {
            if (err) {
                return next(err);
            }
            if (!doc) {
                res.status(404) // Not Found
            }
            res.locals.json = doc
            next();
        })
    });


    //--------------------------------------------------------------------------
    router.post('/:collection', function (req, res, next) {
        if (!req.body || req.body == "") {
            throw { status: 400, message: 'No Request Body' }; // Bad Request
        }
        req.nedb.insert(req.body, function (err, doc) { 
            if (err) {
                return next(err);
            }
            res.append('Location', fullUrl(req) + '/' + doc._id)
            res.status(201); // Created
            res.locals.json = doc;
            next();
        });
    });
    

    //--------------------------------------------------------------------------
    router.delete('/:collection/:id', function (req, res, next) {
        req.nedb.remove({ _id: req.id}, { multi: false }, function (err, count) {
            if (err) {
                return next(err);
            }
            if (count != 1) {
                res.status(404) // Not Found
            }
            else {
                res.status(204).send("deleted entries: "+count); 
            }
        })
    });


    //--------------------------------------------------------------------------
    router.delete('/:collection', function (req, res, next) {
        if (!req.$filter || Object.keys(req.$filter).length == 0) {
            res.status(405).send(); // Method Not Allowed
        }
        req.nedb.remove(req.$filter, { multi: true }, function (err, count) {
            if (err) {
                return next(err);
            }
            if (count == 0) {
                res.status(404) // Not Found
            }
            else {
                res.status(204).send("deleted entries: "+count);
            }
        })
    });
    
    //--------------------------------------------------------------------------
    router.put('/:collection/:id', function (req, res, next) {
        if (!req.body || req.body == "") {
            throw { status: 400, message: 'No Request Body' }; // Bad Request
        }
        req.nedb.update(req.$filter, req.body, {multi:true}, function (err, count, doc) {
            if (err) {
                return next(err);
            }
            if (count != 1) {
                res.status(404);// Not Found
            }
            else {
                res.locals.json = doc;
                next();
            }
        });
    });

    //--------------------------------------------------------------------------
    router.put('/:collection', function (req, res, next) {
        if (!req.body || req.body == "") {
            throw { status: 400, message: 'No Request Body' }; // Bad Request
        }
        req.nedb.update(req.$filter, req.body, {multi:false}, function (err, count, doc) {
            if (err) {
                return next(err);
            }
            if (count != 1) {
                res.status(404);// Not Found
            }
            else {
                res.locals.json = doc;
                next();
            }
        });
    });
    
    //--------------------------------------------------------------------------
    router.patch('/:collection', function (req, res, next) {
        res.status(405).send(); // Method Not Allowed
    });

    //--------------------------------------------------------------------------
    router.delete('/:collection', function (req, res, next) {
        res.status(405).send(); // Method Not Allowed
    });

    //--------------------------------------------------------------------------
    router.post('/:collection/:id', function (req, res, next) {
        res.status(405).send(); // Method Not Allowed
    });
    
}


module.exports = expressNedbRest;
