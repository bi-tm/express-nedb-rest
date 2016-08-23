var express = require('express');
var bodyParser = require("body-parser");
var nedb = require('nedb');
var filter = require('./filter');
var order = require('./order');

module.exports = function expressNedbRest(cfg) {
    var router = express.Router();

    // merge default values into config object
    router.cfg = defaultConfig(cfg);
    
    // initialization of nedb
    initNetdb(router.cfg);    

//    if (!db) throw new TypeError('db required')

    // parse body data of request
    router.use(bodyParser.json());
    
    // add options to each request 
    router.use(function (req, res, next) {
        req.cfg = router.cfg;
        next();
    });

    // call validator function, if configured
    if (typeof(router.cfg.validator) == "function") {
        router.use(router.cfg.validator);
    }

    // regiuster methods for GET, POST, ...
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

    return router;
};

/**
 * add config object with default entries
 */
function defaultConfig(cfg) {
    cfg = cfg || {};
    cfg.datapath = cfg.datapath || ".";
    cfg.collections = cfg.collections || [];
    cfg.datastores = cfg.datastores || [];
    return cfg;
}

/**
 * create nedb instance for each collection
 */
function initNetdb(cfg) {
    if (Array.isArray(cfg.collections)) {
        cfg.collections.forEach(function(collection) {
            var ds =  new nedb({
                filename: cfg.datapath+'/'+collection+".db",
                inMemoryOnly: false,
                autoload: true  
            });
            cfg.datastores[collection] = ds;
        });
    }
}

/**
 * get nedb datastore for a coĺlection, or null if not defined
 */ 
function getDatastore(cfg, collection) {
    var ds = cfg.datastores[collection];
    if (typeof(ds) == "undefined") {
        ds = null;
    }
    return ds;
}

function fullUrl(req) {
    return req.protocol + '://' + req.get('host') + req.originalUrl
}


function addRestMethods(router) {
    
    router.param('collection', function collectionParam(req, res, next, collection) {
        req.collection = collection;
        req.nedb = getDatastore(req.cfg, collection);
        if (!req.nedb) {
            throw { status: 404, 
                    message: "unknown collection " + req.collection }; // Bad Request
        }
        req.$filter = filter(req.query.$filter);
        next();
    });

    router.param('id', function (req, res, next, id) {
        req.id = id;
        next();
    });

    //--------------------------------------------------------------------------
    router.get('/', function (req, res, next) {
        res.append('X-Total-Count', req.cfg.collections.length);
        res.locals.json = req.cfg.collections;
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
                res.status(204).send(); // No Content
            }
        })
    });


    //--------------------------------------------------------------------------
    router.delete('/:collection', function (req, res, next) {
        req.nedb.remove(req.$filter, { multi: true }, function (err, count) {
            if (err) {
                return next(err);
            }
            if (count != 1) {
                res.status(404) // Not Found
            }
            else {
                res.status(204).send(); // No Content
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

