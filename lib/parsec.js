
var parsec = {};

!( function( parsec )
{
    'use strict';

    function repeat( n, item, accumulator )
    {
        if( typeof accumulator === 'undefined' )
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

    function always( x )
    {
        return function( state, cok, cerr, eok, eerr )
        {
            return eok( x, state );
        }
    }

    function never()
    {
        return function( state, cok, cerr, eok, eerr )
        {
            return eerr( new UnknownError( state.pos ) );
        };
    }

    function next( p, q )
    {
        return function( state, cok, cerr, eok, eerr )
        {
            function pcok( item, state )
            {
                return q( state, cok, cerr, cok, cerr );
            }

            function peok( item, state )
            {
                return q( state, cok, cerr, eok, eerr );
            }

            return p( state, pcok, cerr, peok, eerr );
        };
    }

    function bind( p, f )
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
    }

    function either()
    {
        return function( state, cok, cerr, eok, eerr )
        {
            function peerr( fromP )
            {
                function qeerr( fromQ )
                {
                    return eerr( merge( fromP, fromQ ) );
                }

                return q( state, cok, cerr, eok, qeerr );
            }

            return p( state, cok, cerr, eok, peerr );
        };
    }

    function token( consume )
    {
        return function( state, cok, cerr, eok, eerr )
        {
            if( var tok = first( state.input ) )
            {
                if( consume( tok )
                {
                    return cok( tok, new InputState( rest( state.input ), state.pos + 1 ) );
                }
                else
                {
                    return eerr( new UnexpectedError( 'Token "' + tok + '"', state.pos ) );
                }
            }
            else
            {
                return eerr( new UnexpectedError( 'End of input', state.pos ) );
            }
        };
    }

    function many( p )
    {
        return function( state, cok, cerr, eok, eerr )
        {
            function manyErr()
            {
                throw new RuntimeException(
                    'Combinator "*" is applied to a parser that accepts an empty string.' 
                );
            }

            function safeP( state, cok, cerr, eok, eerr )
            {
                return p( state, cok, cerr, manyErr, eerr );
            }

            var x  = safeP,
                xs = many( safeP ):

            return either( always( [ x ].concat( xs ) ), always( [] ) );
        };
    }

    function times( n, p )
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
    }

    function lookahead( p )
    {
        return function( state, cok, cerr, eok, eerr )
        {
            var ok = function( item )
            {
                return eok( item, state );
            };

            return p( state, ok, cerr, eok, eerr );
        };
    }

    function choice( /* parsers... */ )
    {
        var parsers = [].slice.call( parsers );

        if( !parsers.length )
        {
            return never();
        }

        var p = first( parsers );

        return either( p, choice.apply( null, rest( parsers ) ) );
    }

    function eof()
    {
        return function( state, cok, cerr, eok, eerr )
        {
            if( !input.length )
            {
                return eok( null, state );
            }

            return eerr( new ExpectedError( 'End of input', pos ) );
        }
    }

    function char( c )
    {
        return token( equal( c ) );
    }

    function anyChar()
    {
        return token( function( c )
        {
            return typeof c === 'string' && c.length === 1;
        } );
    }

    function digit()
    {
        return token( function( d )
        {
            return !isNaN( +d );
        } );
    }

    function letter()
    {
        return token( function( c )
        {
            return c.match( /[A-Za-z]/ );
        } );
    }

    function string( s )
    {
        return s.map( char ).concat( always( s ) ).reduce( next );
    }

    function __extend( base, klass )
    {
        klass.prototype = Object.create( base.prototype );
        klass.prototype.constructor = klass;

        return klass;
    }

    var __proto = Object.getPrototypeOf;

    var UnknownError = __extend( Error, function()
    {
        arguments[ 0 ] = 'Unknow error: ' + arguments[ 0 ];

        __proto( UnknownError.prototype ).constructor.apply( this, arguments );
    } );

} )( parsec );

if( typeof exports !== 'undefined' )
{
    module.exports = parsec;
}
