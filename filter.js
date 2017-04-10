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
            ["\\$(regex|REGEX)\\b",         "return 'REGEX';"],
            ["\\$(nin|NIN)\\b",             "return 'NIN';"],
            ["\\$(in|IN)\\b",               "return 'IN';"],
            ["\\(",                         "return '(';"],
            ["\\)",                         "return ')';"],
            ["true|TRUE|false|FALSE\\b",    "return 'BOOLEAN';"],
            ["\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?(Z|(\\+|-)\\d{2}:\\d{2})\\b",     "return 'DATETIME';"],
            ["\\d{4}-\\d{2}-\\d{2}\\b",     "return 'DATE';"],
            ["(\\d+,)+\\d+",                "return 'NUM_ARRAY';"],
            ["(\\w+,)+\\w+",                "return 'ARRAY';"],
            ["\\d+(\\.\\d+)?\\b",           "return 'NUMBER';"],
            ["\\'[^\\']*\\'",               "return 'LITERAL';"],
            ["\"[^\"]*\"",                  "return 'LITERAL';"],
            ["\\.",                         "return 'DOT';"],
            ["\\w\\S+(\\b|%)",              "return 'WORD';"],
            ["$",                           "return 'EOF';"]

        ]
    },

    "operators": [
        ["left", "EXISTS"],
        ["left", "IN", "NIN", "EQ", "NE", "LT", "LTE", "GT", "GTE", "REGEX"],
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
            ["NOT c",   "$$ = new Object(); $$['$not'] = $2;"],
            ["c",       "$$ = $1;"]
        ],

        "c": [
            ["l EQ r", "$$ = new Object; $$[$1] = $3;"],
            ["l NE r", "$$ = new Object(); $$[$1] = new Object(); $$[$1]['$ne'] = $3;"],
            ["l LT r", "$$ = new Object(); $$[$1] = new Object(); $$[$1]['$lt'] = $3;"],
            ["l LTE r", "$$ = new Object(); $$[$1] = new Object(); $$[$1]['$lte'] = $3;"],
            ["l GT r", "$$ = new Object(); $$[$1] = new Object(); $$[$1]['$gt'] = $3;"],
            ["l GTE r", "$$ = new Object(); $$[$1] = new Object(); $$[$1]['$gte'] = $3;"],
            ["l IN r", "$$ = new Object(); $$[$1] = new Object(); $$[$1]['$in'] = $3;"],
            ["l NIN r", "$$ = new Object(); $$[$1] = new Object(); $$[$1]['$nin'] = $3;"],
            ["EXISTS l", "$$ = new Object(); $$[$2] = new Object(); $$[$2]['$exists'] = true;"],
            ["l REGEX r", "$$ = new Object(); $$[$1] = new Object(); $$[$1]['$regex'] = new RegExp($3);"],
            ["( e )", "$$ = $2;"]
        ],

        "l": [
            ["WORD",       "$$=yytext;"],
            ["WORD DOT l", "$$ = $1+$2+$3;"]
        ],

        "r": [
            ["ARRAY",     "$$ = yytext.split(',')"],
            ["NUM_ARRAY", "$$ = yytext.split(',').map(a => Number(a));"],
            ["DATE",      "$$ = new Date(yytext);"],
            ["DATETIME",  "$$ = new Date(yytext);"],
            ["NUMBER",    "$$ = Number(yytext);"],
            ["LITERAL",   "$$ = yytext.slice(1,yytext.length-1);"],
            ["BOOLEAN",   "$$ = yytext.toLowerCase() === 'true';"],
            ["WORD",      "$$ = yytext;"]
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
