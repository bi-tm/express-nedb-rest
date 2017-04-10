var express = require('express');
var bodyParser = require("body-parser");
var nedb = require('nedb');
var filter = require('./filter');
var order = require('./order');

function expressNedbRest(cfg) {
    
    var router = express.Router();

    // initialize configuration object
    router.cfg = (typeof(cfg) == 'object') ? cfg : {};
    router.cfg.collections = [];  //no collections yet
    if (typeof(router.cfg.convertToDate) != 'boolean') {
        router.cfg.convertToDate = true;
    }

    // define reviver function to parse date strings, if option convertToDate==true
    var reviverFunc = null;
    if (router.cfg.convertToDate) {
        reviverFunc = function(key, value) {
            // convert date string (ISO 8601) to date object
            // i.e. "2017-04-07T18:00:00.000Z"
            if(typeof(value)=='string' && 
               /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|(\+|-)\d{2}:\d{2})$/.test(value)) {
              return new Date(value);
            }
            else {
                return value;
            }    
        };
    }
    
    // parse body of request
    router.use(bodyParser.json({"reviver":reviverFunc}));

    // add configuration to each request
    router.use(function (req, res, next) {
        req.cfg = router.cfg;
        next();
    });

    // find datastore of collection and add it to request object
    router.param('collection', function collectionParam(req, res, next, collection) {

        // call validator function, if configured
        if (req.cfg.validator) {
            req.cfg.validator(req, res, next);
        }

        // add collection information to request object
        req.collection = collection;
        req.nedb = req.cfg.collections[collection];

        if (!req.nedb) {
            next({ status: 404, // Bad Request
                   message: "unknown collection " + req.collection }) ;
        }
        else {
            // parse filter
            try {
                req.$filter = filter(req.query.$filter);
                next();
            }
            catch (e) {
                // parser error
                next({ status: 400, // Bad Request
                       message: "unvalid $filter " + e.message });
            }
        }
    });

    // add object id from uri to request
    router.param('id', function (req, res, next, id) {
        req.id = id;
        next();
    });

    // register methods for GET, POST, ...
    addRestMethods(router);

    // at last send json result or error
    router.use(function(req, res, next){
        if(res.locals.count) {
            res.append('X-Total-Count', res.locals.count);
        }
        if (res.locals.json) {
            res.json(res.locals.json);
        }
        next();
    });

    // error handling
    router.use(function(err, req, res, next){
        if ( typeof(err) ==='object') {
            res.status(err.status || 400);
            res.send(err.message || 'unknown error');
        }
        else  {
            res.status(400);
            res.send(err.toString());
        }
    });

    /**
     * add a NeDB datastore to REST collections
     * @param {string} collection's name, wich is used for publication in REST calls
     * @param {Datastore) NeDB Datastore object
     * @public
     */
    router.addDatastore = function(collection, store) {
        this.cfg.collections[collection] = store;
    };

    /**
     * add a callback function, which will be called before each NeDB database call.
     * @param {function) callback function with expressJS signature (req, res, next)
     * @public
     */
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
    return req.protocol + '://' + req.get('host') + req.originalUrl;
}

function addRestMethods(router) {

    //--------------------------------------------------------------------------
    router.get('/', function (req, res, next) {
        // return an array with all collection's names
        res.locals.json = [];
        for(var name in req.cfg.collections) {
            res.locals.json.push({
                "name":  name,
                "link":  fullUrl(req) + name
            });
        }
        res.locals.count = res.locals.json.length;
        next();
    });

    //--------------------------------------------------------------------------
    router.get('/:collection', function (req, res, next) {

        if (typeof(req.query.$count) == "undefined") {
            if (typeof(req.query.$single) == 'undefined') {
                // normal query
                var query = req.nedb.find(req.$filter);
                // parse orderby
                if (req.query.$orderby) {
                try {
                        var $order = order(req.query.$orderby);
                        if ($order) query.sort($order);
                    }
                    catch (e) {
                        // parser error
                        next({ status: 400, // Bad Request
                               message: "unvalid $orderby " + e.message });
                    }
                }
                if (!isNaN(req.query.$skip)) query.skip(parseInt(req.query.$skip));
                if (!isNaN(req.query.$limit)) query.limit(parseInt(req.query.$limit));
                query.exec(function(err, docs) {
                    if (err) {
                        return next(err);
                    }
                    res.locals.count = docs.length;
                    res.locals.json = docs;
                    next();
                });        }
            else {
                // find single document
                query = req.nedb.findOne(req.$filter, function(err, doc) {
                    if (err) {
                        return next(err);
                    }
                    if (doc) {
                        res.locals.count = 1;
                        res.locals.json = doc;
                        next();
                    }
                    else {
                        next({ status: 404, // Not found
                               message: "document not found" });
                    }
                });
            }
    
        }
        else {
            // count of documents requested
            req.nedb.count(req.$filter, function(err, count) {
                if (err) {
                    return next(err);
                }
                res.locals.count = count;
                res.status(200).send(count.toString());
            });
        }
    });

    //--------------------------------------------------------------------------
    router.get('/:collection/:id', function (req, res, next) {
        req.nedb.findOne({ _id: req.id }, function (err, doc) {
            if (err) {
                return next(err);
            }
            if (!doc) {
                return next({status:404, message:"document "+req.collection+" _id="+req.id+" not found"});
            }
            res.locals.json = doc;
            next();
        });
    });


    //--------------------------------------------------------------------------
    router.post('/:collection', function (req, res, next) {
        if (!req.body || typeof(req.body) != 'object') {
            return next({ status: 400, message: 'No Request Body' }); // Bad Request
        }
        req.nedb.insert(req.body, function (err, doc) {
            if (err) {
                return next(err);
            }
            res.append('Location', fullUrl(req) + '/' + doc._id);
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
                return next({status:404, message:"document "+req.collection+" _id="+req.id+" not found"});
            }
            else {
                res.locals.count = count;
                res.status(204).send("deleted entries: "+count);
            }
        });
    });


    //--------------------------------------------------------------------------
    router.delete('/:collection', function (req, res, next) {
        if (!req.$filter || Object.keys(req.$filter).length == 0) {
            return next({ status: 405, message: '$filter ist missing' });
        }
        req.nedb.remove(req.$filter, { multi: true }, function (err, count) {
            if (err) {
                return next(err);
            }
            if (count == 0) {
                return next({status:404, message:"no document found to delete"});
            }
            res.locals.count = count;
            res.status(204).send("deleted entries: "+count);
        });
    });

    //--------------------------------------------------------------------------
    router.put('/:collection/:id', function (req, res, next) {
        if (!req.body || typeof(req.body) != 'object') {
            return next({ status: 400, message: 'No Request Body' }); // Bad Request
        }
        req.nedb.update({_id:req.id}, req.body, {multi:false}, function (err, count) {
            if (err) {
                return next(err);
            }
            if (count != 1) {
                return next({status:404, message:"document "+req.collection+" _id="+req.id+" not found"});
            }
            res.locals.count = count;
            res.status(204).send("updated entries: "+count);
        });
    });

    //--------------------------------------------------------------------------
    router.put('/:collection', function (req, res, next) {
        if (!req.body || typeof(req.body) != 'object') {
            return next({ status: 400, message: 'No Request Body' }); // Bad Request
        }
        req.nedb.update(req.$filter, req.body, {multi:true}, function (err, count, docs) {
            if (err) {
                return next(err);
            }
            if (count == 0) {
                return next({status:404, message:"no document found to update"});
            }
            res.locals.count = count;
            res.status(204).send("updated entries: "+count);
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
