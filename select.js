var grammar = {
    "lex": {
        "rules": [
            ["\\s+",                        "/* skip whitespace */"],
            ["\\,",                         "return 'COMMA';"],
            ["\\w\[^\\s\\,]+(\\b|%)",       "return 'WORD';"],
            ["$",                           "return 'EOF';"]
        ]
    },


    "bnf": {
        "select": [
            ["s EOF",                       "return $1;"]
        ],

        "s": [
            ["WORD COMMA s", "$$ = $3; $$[$1] = 1;"],
            ["WORD",         "$$ = new Object; $$[$1] = 1;"]
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
