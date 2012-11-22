
var parsec = require( '..' );

var instruction;

instruction = parsec.choice(
    parsec.char( '>' ),
    parsec.char( '<' ),
    parsec.char( '+' ),
    parsec.char( '-' ),
    parsec.char( '.' ),
    parsec.char( ',' ),
    parsec.between(
        parsec.char( '[' ), parsec.char( ']' ),
        parsec.many( function()
        {
            return instruction.apply( this, arguments );
        } )
    )
);

var bf = parsec.many( instruction );

console.log( parsec.run( bf, '+--.>++[-<]' ) );
