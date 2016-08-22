var filter = require("./filter");

var where = filter("name $ne apple");

console.log(JSON.stringify(where));