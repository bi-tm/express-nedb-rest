# express-nedb-rest
REST API for [NeDB](https://github.com/louischatriot/nedb) database, based on [express](http://expressjs.com/) HTTP server.

__*This project has beta test status - please be prepared for errors!*__

Recently i found the NeDB-project of Louis Chatriot (@louischatriot).
He developed a simple and very fast in-memory database (thank you!).
I like it's zero administration and easy integration into nodejs application.
There is no need to start a daemon process and to communicate with it.
Unfortunately i found no RESTful web API for this database, but here is my 1st try to implement one.

My module is built on ExpressJS server framework and delivers an express Router object.
This can be integrated easily into any express application.
It enables client sided javascript components to access database content via HTTP RESTfull calls.
This can be used i.e. for HTML5 applications.

## Installation
You can download the source from [Github](https://github.com/bi-tm/express-nedb-rest) or install it npm:

```
npm install express-nedb-rest
```

## Quick start
Following code snippet starts an express server, which serves nedb api at port 8080.
```
var express = require('express');
var nedb = require('nedb');
var expressNedbRest = require('express-nedb-rest');

// setup express app
var oApp = express();

// create  NEDB datastore
var datastore = new nedb({ filename: "test.db",  autoload: true });

// create rest api router and connect it to datastote  
var restApi = expressNedbRest();
restApi.addDatastore('test', datastore);

// setup express server to serve rest service
oApp.use('/', restApi);

oApp.listen(8080, function () {
    console.log('you may use nedb rest api at port 8080');
});
```

After starting the sample server, you can request a list of nedb datastores at `http://localhost:8080/`.
You will get a response like:
```
[
    {"name":"test","link":"http://localhost:8080/test"}
]
```

For further testing you should use a REST client (i.e. [postman](https://www.getpostman.com/) 
or use my primitive test tool in path test/test.js).

## Test tool
In filepath `test` you fill find a primitive test tool `test.js`.
It creates an express http server and provides a `index.html` web page.
There you can send AJAX calls to nedb rest api to test CRUD operations.

![screenshot](/test/screenshot.png)

## API schema

| Route            | Method | Notes                       |
| ---------------- | ------ | --------------------------- |
| /                | GET    | get list of collections (= datastores) |
| /:collection     | GET    | Search the collection (uses query parameter $filter $orderby) |
| /:collection/:id | GET    | Retrieve a single document  |
| /:collection     | POST   | Create a single document    |
| /:collection/:id | PUT    | Update a single document    |
| /:collection     | PUT    | Update multiple documents (uses query parameter $filter and [nedb notation](https://github.com/louischatriot/nedb#updating-documents) to update single fields |
| /:collection/:id | DELETE | Remove single  documents    |
| /:collection     | DELETE | Remove multiple documents (uses query parameter $filter) |

## Query parameter $filter
*To Do*

## Query parameter $orderby
*To Do*

## Query parameter $count
*To Do*

