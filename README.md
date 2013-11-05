# Parsatron.js #
Parsatron.js is a bad and incomplete port to JavaScript of Nate Young's [Parsatron](https://github.com/youngnh/parsatron), a Clojure parser combinator library, which is itself a port of Haskell's Parsec library.

## Example ##
Here is a Brainfuck parser written using Parsatron.js:

```js
var p = require( 'parsatron' );

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
```

Output:

```js
[ '+', [ '>', '>', '+', '<', '-' ], '>', '+', '+', '.' ]
```

As you can see, the API is far from elegant and could be greatly improved, by the use of [macros](http://sweetjs.org), or Promises/A. It's something I'll maybe consider if I keep working on the library.

In the meantime, if you need a serious parser combinators library in JavaScript, I encourage you the check out [Parsimmon](https://github.com/jayferd/parsimmon).

## Caveats
Amongst other things, this library is missing a `map` method that would let us transform the value yielded by a parser.

## License ##
Parsatron.js is distributed under the [BSD license](http://opensource.org/licenses/bsd-license)
