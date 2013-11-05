
var p = require( '..' );

var parser = p.between(
    p.char( 'a' ),
    p.char( 'b' ),
    p.many( p.char( 'c' ) )
);

console.log( p.run( parser, 'accccb' ) );
