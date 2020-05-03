var express = require('express');
var nedb = require('nedb');
var path = require('path');
var expressNedbRest = require(path.join(__dirname, '../index.js'));

// setup express app
var oApp = express();

// local files for test frontend
oApp.use('/index.html', express.static(path.join(__dirname, 'index.html')));
oApp.use('/spin.gif', express.static(path.join(__dirname, 'spin.gif')));


// create REST service and NEDB datastores
var restApi = expressNedbRest();
restApi.addDatastore('fruits',  new nedb({ filename: path.join(__dirname, 'fruits.db'),  autoload: true }));
restApi.addDatastore('animals', new nedb({ filename: path.join(__dirname, 'animals.db'), autoload: true }));
restApi.addDatastore('test',    new nedb({ filename: path.join(__dirname, 'test.db'), autoload: true }));

// connect /rest path to REST service
oApp.use('/rest', restApi);

// setup port
var port = process.env.PORT || 8000;

// start express server
oApp.listen(port, function () {
    var server = 'localhost';
    if (process.env.C9_HOSTNAME) {
        // alternative text, if running behind Cloud9 proxy
        var server = process.env.C9_HOSTNAME;
    }
    console.log('you may test nedb rest api by open http://'+server+":"+port+'/index.html');
});
