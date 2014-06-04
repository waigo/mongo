[![Build Status](https://secure.travis-ci.org/waigo/mongo.png)](http://travis-ci.org/waigo/mongo)

This [waigo](http://waigojs.com) plugin provides:

* Mongo database connection ([mongoose](https://www.npmjs.org/package/mongoose))
* Mongo session store ([koa-session-mongo](https://www.npmjs.org/package/koa-session-mongo))


## Installation

```bash
$ npm install waigo-mongo
```

## Using the database connection

In your configuration file enable the database startup step and add configuration info:

```javascript
module.exports = function(config) {
  ...

  config.startupSteps = [
    ...
    'database'
    ...
  ];

  config.db = {
    mongoose: {
      host: '127.0.0.1',
      port: '27017',
      db: 'your_db_name'
    }
  }
  
  ...
}
```

## Using the session store

Edit the session configuration:


```javascript
module.exports = function(config) {
  ...

  config.middleware.options.sessions = {
    ...

    store: {
      type: 'mongo',
      config: {
        /* see koa-session-mongo module for configuration options */
      }
    }

    ...
  }

  ...
}
```

_Note: it is possible to pass your Mongoose db connection to the mongo session store, see [koa-session-mongo](https://www.npmjs.org/package/koa-session-mongo) for details_.


## License

MIT - see LICENSE.md