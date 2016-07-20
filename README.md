# Mutable

Mutable state containers with dirty checking and more

### What Mutable does
Mutable is a state management library designed with [React](https://github.com/facebook/react) in mind.
It supports simple implementation of ```shouldComponentUpdate``` by efficiently tracking state changes while avoiding the verbosity involved with using immutable data.
In addition, Mutable enhances React components by offering a unique runtime schema engine that enforces [unidirectional data flow](https://facebook.github.io/flux/),
and formalizes the structure of props and state.
Mutable also supports default or even non-nullable types.

## Using mutable
add mutable to your project by installing it with [npm](https://www.npmjs.com/)
```npm install mutable --save```

Simple code example:
```es6
    import * as Mutable from 'mutable';

    // define a Mutable type by providing a name and a spec
    const Dude = Mutable.define('Dude', {
        spec: ()=>({
            name: Mutable.String.withDefault('Leon'),
            age: Mutable.Number.withDefault(110),
            address: Mutable.String.withDefault('no address')
        })
    });

    // Mutable types accept custom data according to their spec as the first argument of their constructor
    const dude = new Dude({name:'Ido'});

    // Mutable instances behave just like ordinary javascript objects
    console.log(dude.name); // prints: 'Ido'
    console.log(dude.age); // prints: 110

    // Mutable keeps track of the state of the application by an internal revision counter.
    // changes to Mutable instances are indexed by the revision in which they occur.

    // advance the revision counter. Subsequent state changes will register to the new revision.
    Mutable.revision.advance();

    // read the current revision
    const firstRevision = Mutable.revision.read();
    // no changes has been made to dude since firstRevision started
    console.log(dude.$isDirty(firstRevision)); // prints: false

    // advance the revision counter
    Mutable.revision.advance();

    // Mutable instances behave just like ordinary javascript objects
    dude.name = 'Tom';
    console.log(dude.name); // prints: 'Tom'

    // the dude instance has been changed since revision firstRevision
    console.log(dude.$isDirty(firstRevision)); // prints: true

    // advance revision and define newRevision to point to the latest revision
    Mutable.revision.advance();
    const newRevision = Mutable.revision.read();

    // the dude instance has been changed since firstRevision
    console.log(dude.$isDirty(firstRevision)); // prints: true
    // the dude instance has not been changed since newRevision
    console.log(dude.$isDirty(newRevision)); // prints: false
```
Integrating mutable into react components is up to the user.

### how to build and test locally from source
Clone this project locally.
Then, at the root folder of the project, run:
```shell
npm install
npm test
```
### how to run local continous test feedback
At the root folder of the project, run:
```shell
npm start
```
Then, open your browser at http://localhost:8080/webtest.bundle
and see any changes you make in tests or code reflected in the browser

### Versioning
Currently Mutable is in alpha mode. As such, it does not respect semver.

### License
We use a custom license, see ```LICENSE.md```

### Similar Projects
There are examples of the kinds of libraries we’d like to model ourselves after.
 - [mobx](https://github.com/mobxjs/mobx) : Simple, scalable state management
 - [immutable.js](https://github.com/facebook/immutable-js/) : Immutable persistent data collections for Javascript which increase efficiency and simplicity
 - [cls.js](https://github.com/camel-chased/cls.js) : Easy, dynamic (kind of mixin) javascript classes
