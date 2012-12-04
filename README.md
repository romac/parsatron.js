# Parsec.js #
Parsec.js is a straightforward port to JavaScript of Nate Young's [Parsatron](https://github.com/youngnh/parsatron), a Clojure parser combinator library, which is itself a port of Haskell's Parsec library.

## Example ##
Here is a Brainfuck parser written using Parsec.js:

```js
var parsec = require( '..' );

var instruction, bf;

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

bf = parsec.many( instruction );

console.log( parsec.run( bf, '+[>>+<-]>++.' ) );
```

Output:

```js
[ '+', [ '>', '>', '+', '<', '-' ], '>', '+', '+', '.' ]
```

As you can see, the API is far from elegant and could be greatly improved, by the use of [macros](http://sweetjs.org), or Promises/A. It's something I'll maybe consider if I keep working on the library.

## License ##
Parsec.js is distributed under the [BSD license](http://opensource.org/licenses/bsd-license)
