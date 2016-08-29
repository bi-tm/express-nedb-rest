# express-nedb-rest
REST API for [NeDB](https://github.com/louischatriot/nedb) database, based on [express](http://expressjs.com/) HTTP server.

__*This project has beta test status - please be prepared for errors!*__

Recently i found the [NeDB](https://github.com/louischatriot/nedb)-project of Louis Chatriot.
He developed a simple and very fast in-memory database (thank you!).
I like it's zero administration and easy integration into nodejs application.
There is no need to start a daemon process and to communicate with it.
Unfortunately i found no RESTful web API for this database, so here is my first try to implement one.

My module is built on [ExpressJS](http://expressjs.com/) server framework and provides an express Router object.
This can be integrated easily into any express application as middleware.

The API enables client sided javascript components to access database content via HTTP RESTful calls.
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
You can start it with command ```node test/test.js```.
It creates an express HTTP server and provides a `index.html` as web frontend.
This frontend contains a formular, where you can fill in HTTP method, url and body text. 
You can execute the different HTTP methods (GET,POST,PUT,DELETE) and you will see the response content. 

![screenshot](/test/screenshot.png)

## API schema

The module can be conneceted to multiple NeDB data storages, which are called *collections*.
Each CRUD command is a combination of a HTTP method (GET,POST,PUT,DELETE), URL and HTTP-body.
The following table gives a quick overview of possible commands.

| URL              | Method | Notes                                                          |
|----------------- | ------ | -------------------------------------------------------------- |
| /                | GET    | get list of collections (= datastores)                         |
| /:collection     | GET    | Search in a collection (uses query parameter $filter $orderby) |
| /:collection/:id | GET    | Retrieve a single document                                     |
| /:collection     | POST   | Create a single document                                       |
| /:collection/:id | PUT    | Update a single document                                       |
| /:collection     | PUT    | Update multiple documents (uses query parameter $filter)       |
| /:collection/:id | DELETE | Remove single  document                                        |
| /:collection     | DELETE | Remove multiple documents (uses query parameter $filter)       |

## <a name="creating-documents">Creating Documents</a>
To create a document, use a POST call and put the document into the HTTP. You can only insert one document per call.
Each document must have a unique key value, which is named '_id'. If you don't define an _id for document,
NeDB will generate a 16 character long string as _id. Please refer to [NeDB documentation](https://github.com/louischatriot/nedb#inserting-documents).
Onb succes the server will respond with status code 201, and in the body the created document as JSON string.

## <a name="reading-documents">Reading Documents</a>
Read operation are done HTTP GET calls. You may read single documents by appending the document _id to the URL.
In this case the server will respond with the document as JSON string.

```
HTTP GET \fruits\J1t1kMDp4PWgPfhe
```

You can also query multiple documents and set a [$filter](#$filter) as parameter. In that case the response contains an array of document objects (JSON formatted).
You may also get an empty array, if no document matches the filter. The result can be sorted with parameter [$orderby](#$orderby)

```
HTTP GET \fruits?$filter=$price $lt 3.00&$orderby=price
```

## <a name="updating-documents">Updating Documents</a>
Updating operations are done by HTTP PUT calls. You can update a single document by appending the document key (_id) to URL.
You must provide the document in HTTP body as JSON string. You cannot change key field _id.
The document will be completely overwritten with the new content.
If you want to update a property without changing other fields, you have to use a special [NeDB syntax](https://github.com/louischatriot/nedb#updating-documents).
There a operations $set, $unset, $inc and more. The JSON string in HTTP body is passed to NeDB without any checks. 

```
HTTP PUT \fruits\J1t1kMDp4PWgPfhe
{ $set: { discount: 0.10 } }
```

You can also update multiple documents by calling a DELETE command without _id. You should define a [$filter](#$filter), otherwise all documents are changed.
It is recommded to use special update operations (i.e. $set) to change single document fields, 
it makes certainly no sense to overwrite all selected documents with same content.
```
HTTP PUT \fruits?$filter=name $regex berry
{ $set: { discount: 0.10 } }
```

## <a name="deleting-documents">Deleting Documents</a>
Documents can be deleted by HTTP DELETE calls. You can delete a single document by appending the document (_id) to the URL.
```
HTTP DELETE \fruits\J1t1kMDp4PWgPfhe
```

If you omit the _id, you must define [$filter](#$filter) parameter, to specify a subset of documents.

```
HTTP DELETE \fruits?$filter=name $regex berry
```

## <a name="$filter">Query parameter $filter</a>
The $filter parameter is used, to define a subset of documents of a collection.
They can be used not only for reading, but also for deleting and updating documents.
Filter may be used for [reading](#reading-documents) (GET), [updating](#updating-documents) (PUT)
and [deleting](#deleting-documents) (DELETE) commands.

A filter consists of one or more filter conditions, which are linked with logical and/or operations.
Filters are set by the $filter parameter which contains a string. The string will be parsed and transformed to a NeDB filter object.
Filters has format <fieldname> <operator> <value>. Values may be a String, Boolean, Number or Date.

Here is a list of valid operations. For more informations please consult [NeDB documentation](https://github.com/louischatriot/nedb#operators-lt-lte-gt-gte-in-nin-ne-exists-regex).
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
You may sort the result of a query with "$orderby" parameter.
You can use it in [reading](#reading-documents) (GET) operations only.
The parameter may contain multiple fieldnames concatenated by commas (,). 
Each fieldname can be followed by keywword `asc` or `desc` to define sorting direction. 
Ascending is default direction, so you may omit it.

Example:  ```/fruits?$orderby=price```

## <a name="$count">Query parameter $count</a>
If you append $count parameter to a query, the server returns the number of of matching documents instead of a result set.
You can use this parameter in [reading](#reading-documents) (GET) operations only.
The server responds with a number (no JSON object or array).

Example:  ```/fruits?$filter=name $eq apple&$count```
