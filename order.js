var grammar = {
    "lex": {
        "rules": [
            ["\\s+",                       "/* skip whitespace */"],
            [",",                           "return ',';"],
            ["(asc|ASC)\\b",                "return 'ASC';"],
            ["(desc|DESC)\\b",              "return 'DESC';"],
            ["\\w+\\b",                     "return 'WORD';"],
            ["$",                           "return 'EOF';"]
            
        ]
    },

    "operators": [
    ],

    "bnf": {
        "order": [ 
            ["o EOF", "return $1;"]
        ],
        
        "o": [
            ["o , f",   "$$ = $1; for (var attr in $3) $$[attr] = $3[attr];"],
            ["f",       "$$ = $1;" ]
        ],
        
        "f": [
            ["WORD",        "$$ = new Object; $$[$1] = 1;"],
            ["WORD ASC",    "$$ = new Object; $$[$1] = 1;"],
            ["WORD DESC",   "$$ = new Object; $$[$1] = -1;"]
        ]
    }
};    

var Parser = require("jison").Parser;
var parser = new Parser(grammar);

module.exports = function(input) {
    if (typeof(input) == 'string' && input != "") {
        return parser.parse(decodeURI(input));
    }
    else {
        return {};
    }
};
