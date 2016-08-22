var grammar = {
    "lex": {
        "rules": [
            ["\\s+",                       "/* skip whitespace */"],
            ["\\$(and|AND)\\b",             "return 'AND';"],
            ["\\$(or|OR)\\b",               "return 'OR';"],
            ["\\$(not|NOT)\\b",             "return 'NOT';"],
            ["\\$(eq|EQ)\\b",               "return 'EQ';"],
            ["\\$(ne|NE)\\b",               "return 'NE';"],
            ["\\$(lt|LT)\\b",               "return 'LT';"],
            ["\\$(lte|LTE)\\b",             "return 'LTE';"],
            ["\\$(gt|GT)\\b",               "return 'GT';"],
            ["\\$(gte|GTE)\\b",             "return 'GTE';"],
            ["\\$(exists|EXISTS)\\b",       "return 'EXISTS';"],
            ["\\$(contains|CONTAINS)\\b",   "return 'CONTAINS';"],
            ["\\$(starts|STARTS)\\b",       "return 'STARTS';"],
            ["\\$(ends|ENDS)\\b",           "return 'ENDS';"],
            ["\\(",                         "return '(';"],
            ["\\)",                         "return ')';"],
            ["\\w+\\b",                     "return 'WORD';"],
            ["\\'[^\\']*\\'",               "return 'LITERAL';"],
            ["\"[^\"]*\"",                  "return 'LITERAL';"],
            ["[0-9]+('.'[0-9]+)?\\b",       "return 'NUMBER';"],
            ["$",                           "return 'EOF';"]
            
        ]
    },

    "operators": [
        ["left", "EXISTS"],
        ["left", "EQ", "NE", "LT", "LTE", "GT", "GTE", "CONTAINS", "STARTS", "ENDS"],
        ["left", "AND"],
        ["left", "OR"],
        ["left", "NOT"]
    ],

    "bnf": {
        "filter": [ 
            ["e EOF", "return $1;"]
        ],
        
        "e": [
            ["c AND c", "$$ = new Object(); $$['$and'] = [$1,$3];"],
            ["c OR c",  "$$ = new Object(); $$['$or'] = [$1,$3];"],
            ["NOT c",   "$$ = new Object(); $$['$not'] = $2;" ],
            ["c",       "$$ = $1;" ]
        ],
        
        "c": [
            ["l EQ r", "$$ = new Object; $$[$1] = $3;"],
            ["l NE r", "$$ = new Object(); $$[$1] = new Object(); $$[$1]['$ne'] = $3;"],
            ["l LT r", "$$ = new Object(); $$[$1] = new Object(); $$[$1]['$lt'] = $3;"],
            ["l LTE r", "$$ = new Object(); $$[$1] = new Object(); $$[$1]['$lte'] = $3;"],
            ["l GT r", "$$ = new Object(); $$[$1] = new Object(); $$[$1]['$gt'] = $3;"],
            ["l GTE r", "$$ = new Object(); $$[$1] = new Object(); $$[$1]['$gte'] = $3;"],
            ["EXISTS l", "$$ = new Object(); $$[$1] = new Object(); $$[$1]['$exists'] = true; "],
            ["l CONTAINS r", "$$ = new Object(); $$[$1] = new Object(); $$[$1]['$regex'] = '/'+$3+'/';"],
            ["l STARTS r", "$$ = new Object(); $$[$1] = new Object(); $$[$1]['$regex'] = '/^'+$3+'/';"],
            ["l ENDS r", "$$ = new Object(); $$[$1] = new Object(); $$[$1]['$regex'] = '/'+$3+'$/';"],
            ["( e )", "$$ = $2;"]
        ],
        
        "l": [
            ["WORD", "$$=yytext;"]
        ],
        
        "r": [
            ["WORD", "$$ = yytext;"],
            ["NUMBER", "$$ = Number(yytext);"],
            ["LITERAL", "$$ = yytext.slice(1,yytext.length-1);"]
        ]
    }
};    

var Parser = require("jison").Parser;
var parser = new Parser(grammar);

module.exports = function(input) {
    if (typeof(input) == 'string' && input != "") {
        return parser.parse(input);
    }
    else {
        return {};
    }
};
