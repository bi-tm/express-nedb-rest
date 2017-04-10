var express = require('express');
var nedb = require('nedb');
var expressNedbRest = require('../index.js');

// setup express app
var oApp = express();


// local files for test frontend
oApp.use('/index.html', express.static('index.html'));
oApp.use('/spin.gif', express.static('spin.gif'));


// create REST service and NEDB datastores
var restApi = expressNedbRest();
restApi.addDatastore('fruits',  new nedb({ filename: "fruits.db",  autoload: true }));
restApi.addDatastore('animals', new nedb({ filename: "animals.db", autoload: true }));
restApi.addDatastore('test',    new nedb({ filename: "test.db", autoload: true }));

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
