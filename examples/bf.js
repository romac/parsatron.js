
var p = require( '..' );

var instruction, bf;

instruction = p.choice(
    p.char( '>' ),
    p.char( '<' ),
    p.char( '+' ),
    p.char( '-' ),
    p.char( '.' ),
    p.char( ',' ),
    p.between(
        p.char( '[' ), p.char( ']' ),
        p.many( function()
        {
            return instruction.apply( this, arguments );
        } )
    )
);

bf = p.many( instruction );

console.log( p.run( bf, '+[>>+<-]>++.' ) );
