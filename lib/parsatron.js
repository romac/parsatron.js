
var parsatron = {};

!( function( parsatron )
{
    'use strict';

    function Ok( item )
    {
        this.item = item;
    }

    function Err( errmsg )
    {
        this.errmsg = errmsg;
    }

    function Pos( line, column )
    {
        this.line   = line | 0;
        this.column = column | 0;
    }

    function ParseError( pos, msgs )
    {
        this.pos = pos;
        this.msgs = msgs;
    }

    ParseError.prototype.show = function()
    {
        return unique( this.msgs ).join( ', ' )
                + ' at'
                + ' line: ' + this.pos.line
                + ' column: ' + this.pos.column;
    };

    function mergeErrors( err, otherErr )
    {
        return new ParseError( err.pos, err.msgs.concat( otherErr.msgs ) );
    }

    var error = {

        unknown: function( state )
        {
            return new ParseError( state.pos, [ 'Error' ] );
        },

        expected: function( msg, pos )
        {
            return new ParseError( pos, [ 'Expected ' + msg ] );
        },

        unexpected: function( msg, pos )
        {
            return new ParseError( pos, [ 'Unxpected ' + msg ] );
        }
    };

    function incSourcePos( pos, tok )
    {
        if( tok === '\n' )
        {
            return { line: pos.line + 1, column: 1 };
        }

        return { line: pos.line, column: pos.column + 1 };
    }

    function repeat( n, item, accumulator )
    {
        if( !accumulator.length || !accumulator.push )
        {
            accumulator = [];
        }

        accumulator.push( item );

        if( n > 1 )
        {
            return repeat( n - 1, item, accumulator );
        }
        else
        {
            return accumulator;
        }
    }

    function equal( to )
    {
        return function( that )
        {
            return that === to;
        }
    }

    function first( list )
    {
        return list[ 0 ];
    }

    function rest( list )
    {
        return list.slice( 1 );
    }

    // Just for the lulz
    function unique( list )
    {
        var sortedList = list.sort(),
            uniqueList = [],
            head;

        function unique0( list )
        {
            if( !list.length )
            {
                return uniqueList;
            }

            head = first( list );

            if( head !== first( rest( list ) ) )
            {
                uniqueList.push( head );
            }

            head = first( list );

            return unique0( rest( list ) );
        }

        return unique0( list );
    }

    var always = parsatron.always = function always( x )
    {
        return function( state, cok, cerr, eok, eerr )
        {
            return eok( x, state );
        };
    };

    var never = parsatron.never = function never()
    {
        return function( state, cok, cerr, eok, eerr )
        {
            return eerr( error.unknown( state ) );
        };
    };

    var next = parsatron.next = function next( p, q )
    {
        return bind( p, function() { return q; } );
    };

    var bind = parsatron.bind = function bind( p, f )
    {
        return function( state, cok, cerr, eok, eerr )
        {
            function pcok( item, state )
            {
                var q = f( item );

                return q( state, cok, cerr, cok, cerr );
            }

            function peok( item, state )
            {
                var q = f( item );

                return q( state, cok, cerr, eok, eerr );
            }

            return p( state, pcok, cerr, peok, eerr );
        };
    };

    // Will be a macro thanks to sweet.js
    var bind_ = parsatron.bind_ = function bind_( bindings, f )
    {
        var result = [];

        function bind0()
        {
            var p = first( bindings );

            bindings = rest( bindings );

            if( bindings.length > 0 )
            {
                return bind( p, function( x )
                {
                    result.push( x );
                    return bind0();
                } );
            }
            else
            {
                return bind( p, function( x )
                {
                    result.push( x );
                    return f.apply( null, result );
                } );
            }
        }

        return bind0();
    };

    var attempt = parsatron.attempt = function attempt( p )
    {
        return function( state, cok, cerr, eok, eerr )
        {
            return p( state, cok, eerr, eok, eerr );
        };
    };

    var extract = parsatron.extract = function extract( f )
    {
        return function( state, cok, cerr, eok, eerr )
        {
            return eok( f( state ), state );
        };
    };

    var examine = parsatron.examine = function examine()
    {
        return extract( function( s ) { return s; } );
    };

    var lineNo = parsatron.lineNo = function lineNo()
    {
        return extract( function( s )
        {
            return s.pos.line;
        } );
    };

    var either = parsatron.either = function either( p, q )
    {
        return function( state, cok, cerr, eok, eerr )
        {
            function peerr( errFromP )
            {
                function qeerr( errFromQ )
                {
                    return eerr( mergeErrors( errFromP, errFromQ ) );
                }

                return q( state, cok, cerr, eok, qeerr );
            }

            return p( state, cok, cerr, eok, peerr );
        };
    };

    var token = parsatron.token = function token( consume )
    {
        return function( state, cok, cerr, eok, eerr )
        {
            var tok = first( state.input );

            if( !tok  )
            {
                return eerr( error.unexpected( 'end of input', state.pos ) );
            }

            if( !consume( tok ) )
            {
                return eerr( error.unexpected( 'token "' + tok + '"', state.pos ) );
            }

            return cok( tok, { input: rest( state.input ), pos: incSourcePos( state.pos ) } );
        };
    };

    var many = parsatron.many = function many( p )
    {
        function manyErr()
        {
            throw new Error(
                'Combinator "*" is applied to a parser that accepts an empty string.'
            );
        }

        function safeP( state, cok, cerr, eok, eerr )
        {
            return p( state, cok, cerr, manyErr, eerr );
        }

        var many0 = bind( safeP, function many0Next( x )
        {
            return bind( many( safeP ), function many1Next( xs )
            {
                return always( [ x ].concat( xs ) );
            } );
        } );

        return either( many0, always( [] ) );
    };

    var many1 = parsatron.many1 = function many( p )
    {
        return bind( p, function( x )
        {
            return bind( many( p ), function( xs )
            {
                return always( [ x ].concat( xs ) );
            } );
        } );
    };

    var times = parsatron.times = function times( n, p )
    {
        if( n === 0 )
        {
            return always( [] );
        }

        return function( state, cok, cerr, eok, eerr )
        {
            function pcok( item, state )
            {
                var q = times( n - 1, p );

                function qcok( items, state )
                {
                    return cok( [ item ].concat( items ), state );
                }

                return q( state, qcok, cerr, qcok, eerr );
            }

            function peok( item, state )
            {
                return eok( repeat( n, item ), state );
            }

            return p( state, pcok, cerr, peok, eerr );
        };
    };

    var between = parsatron.between = function between( open, close, p )
    {
        return bind( open, function()
        {
            return bind( p, function( x )
            {
                return bind( close, function()
                {
                    return always( x );
                } );
            } );
        } );
    };

    var lookahead = parsatron.lookahead = function lookahead( p )
    {
        return function( state, cok, cerr, eok, eerr )
        {
            var ok = function( item )
            {
                return eok( [ item ], state );
            };

            return p( state, ok, cerr, eok, eerr );
        };
    };

    var choice = parsatron.choice = function choice( /* parsers... */ )
    {
        var parsers = [].slice.call( arguments );

        if( !parsers.length )
        {
            return never();
        }

        var p = first( parsers );

        return either( p, choice.apply( null, rest( parsers ) ) );
    };

    var eof = parsatron.eof = function eof()
    {
        return function( state, cok, cerr, eok, eerr )
        {
            if( !state.input.length )
            {
                return eok( [ null ], state );
            }

            return eerr( error.expected( 'End of input', state.pos ) );
        };
    };

    var char = parsatron.char = function char( c )
    {
        return token( equal( c ) );
    };

    var anyChar = parsatron.anyChar = function anyChar()
    {
        return token( function( c )
        {
            return typeof c === 'string' && c.length === 1;
        } );
    };

    var anyString = parsatron.anyString = function()
    {
        return parsatron.many( parsatron.anyChar() );
    };

    var digit = parsatron.digit = function digit()
    {
        return token( function( d )
        {
            return !isNaN( +d );
        } );
    };

    var number = parsatron.number = function number()
    {
        return many( digit() );
    };

    var letter = parsatron.letter = function letter()
    {
        return token( function( c )
        {
            return c.match( /[A-Za-z]/ );
        } );
    };

    var string = parsatron.string = function string( s )
    {
        return s.split( '' ).map( char ).concat( always( s ) ).reduce( next );
    };

    var runParser = parsatron.runParser = function runParser( p, state )
    {
        return p(
            state,
            function cok( item )
            {
                return new Ok( item );
            },
            function cerr( err )
            {
                return new Err( err.show() );
            },
            function eok( item )
            {
                return new Ok( item );
            },
            function eerr( err )
            {
                return new Err( err.show() );
            }
        );
    };

    var run = parsatron.run = function run( p, input )
    {
        var result = runParser(
            p,
            {
                input: input,
                pos: new Pos(1, 1)
            }
        );

        if( result instanceof Ok )
        {
            return result.item;
        }
        else if( result instanceof Err )
        {
            throw new Error( result.errmsg );
        }
    };

} )( parsatron );

if( typeof module !== 'undefined' && module.exports !== undefined )
{
    module.exports = parsatron;
}
