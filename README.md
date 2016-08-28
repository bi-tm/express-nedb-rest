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
You can download the source from [Github](https://github.com/bi-tm/express-nedb-rest) or install it with npm:

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

The module can be conneceted to multiple NeDB data storages, which i also call collections.
Each CRUD command as a combining of HTTP method (GET,POST,...), URL and HTTP-body.
The following table gives a quick overview of possible commands.

|URL              | Method |Notes                       |
|---------------- | ------ |--------------------------- |
|/                | GET    |get list of collections (= datastores) |
|/:collection     | GET    |Search the collection (uses query parameter $filter $orderby) |
|/:collection/:id | GET    |Retrieve a single document  |
|/:collection     | POST   |Create a single document    |
|/:collection/:id | PUT    |Update a single document    |
|/:collection     | PUT    |Update multiple documents (uses query parameter $filter and [nedb notation](https://github.com/louischatriot/nedb#updating-documents) to update single fields) |
|/:collection/:id | DELETE |Remove single  document     |
|/:collection     | DELETE |Remove multiple documents (uses query parameter $filter) |

## <a name="creating-documents">Creating Documents</a>
To create a document, use a POST call and put the document into the HTTP. You can only insert one document per call.
Each document must have a unique key value, which is named '_id'. If you don't define an _id for document,
NeDB will generate a 16 character long string as _id. Please refer to [NeDB documentation](https://github.com/louischatriot/nedb#inserting-documents).
Onb succes the server will respond with status code 201, and in the body the created document as JSON string.

## <a name="reading-documents">Reading Documents</a>
Read operation are done with HTTP GET calls. You may read single documents by appending the document _id to the URL.
In this case the server will respond with the document as JSON string.

You can also query multiple documents and set a [$filter](#$filter) as parameter. In that case the response contains an array of document objects (JSON formatted).
You may also get an empty array, if no document matches the filter. The result can be sorted with parameter [$orderby](#$orderby)

## <a name="updating-documents">Updating Documents</a>
... to be documented

## <a name="deleting-documents">Deleting Documents</a>
... to be documented

## <a name="$filter">Query parameter $filter</a>
The $filter parameter is used, to define a subset of documents of a collection. They can be used not only for reading, but also for deleting and updating documents.
Filter may be used for [reading](#reading-documents) (GET), [updating](#updating-documents) (PUT) and [deleting](#deleting-documents) (DELETE) commands.

A filter consists of one or more filter conditions, which are linked with logical and/or operations.
Filters are set by the $filter parameter which contains a string. The string will be parsed and transformed to a NeDB filter object.
Filters has format <fieldname> <operator> <value>. Values may be a String, Boolean, Number or Date.

Here a list of valid operations. For more informations please consult [NeDB documentation](https://github.com/louischatriot/nedb#operators-lt-lte-gt-gte-in-nin-ne-exists-regex).
| operators | description                                                   | example                                                 |
| --------- | ------------------------------------------------------------- | ------------------------------------------------------- |
| $eq $ne   | equal, not equal                                              | /fruits?$filter=color $eq red                           |
| $lt $lte  | less than, less than or equal                                 | /fruits?$filter=price $lt 2.00                          |
| $gt $gte  | greater than, greater than or equal                           | /fruits?$filter=price $gte 5.00                         |
| $exists   | checks whether the document posses the property field.        | /fruits?$filter=$exists discount                        |
| $regex    | checks whether a string is matched by the regular expression. | /fruits?filter=name $regex foo                          |
| $and $or  | logical and/or oparator                                       | /fruits?$filter=name $eq apple $and color $eq red       |
| $not      | not operator                                                  | /fruits?$filter=$not name $regex foo                    |

## <a name="$orderby">Query parameter $orderby</a>
You may sort the result of a query with "$orderby" parameter. The parameter may contain multiple fieldnames concatenated by commas (,). 
Each fieldname can be followed by keywword `asc` or `desc` to define sorting directions. Ascending is default direction, so you may omit it.

Example:```/fruits?$orderby=price```

## <a name="$count">Query parameter $count</a>
If you append $count parameter to a query, the server returns the number of of matching documents instead of a result set. 

Example:```/fruits?$filter=name $eq apple&$count```
