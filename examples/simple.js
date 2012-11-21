
var parsec = require( '..' );

var p = parsec.between(
    parsec.char( 'a' ),
    parsec.char( 'b' ),
    parsec.many( parsec.char( 'c' ) )
);

console.log( parsec.run( p, 'accccb' ) );
