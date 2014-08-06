[![Build Status](https://secure.travis-ci.org/waigo/mongo.png)](http://travis-ci.org/waigo/mongo)

This [waigo](http://waigojs.com) plugin provides:

* Mongo database connection ([mongoose](https://www.npmjs.org/package/mongoose))
* Mongo session store ([koa-session-mongo](https://www.npmjs.org/package/koa-session-mongo))
* A Mongoose [schema](https://github.com/waigo/mongo/blob/master/src/support/db/mongoose/schema.js) constructor which makes it easy to create view objects from model instances.


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
    mongo: {
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

## Using the Mongoose schema constructor

First define your model somewhere. Here will do it in a startup step:

```js
// file: support/startup/defineModels.js

"use strict";

var waigo = require('waigo'),
  schema = waigo.load('support/db/mongoose/schema');

module.exports = function*(app) {
  app.models = {};

  var schema = schema.create({
    name: String,
  }, {
    /** Automatically add `created_at` and `updated_at` fields and manage them on save() */
    addTimestampFields: true
  });

  app.models[modelClass.modelName] = app.db.model('MyModel', schema);
};
```

Then you can use the model and render its instances:

```js
// file:  controllers/main.js

var waigo = require('waigo');

exports.index = function*() {
  yield this.render('show', {
    item: this.app.models.MyModel.findOne(this.params.id);
  });
};
```

In the above controller the model instance gets rendered into a view object. Its `_id`, `name`, `created_at` and `updated_at` keys will all be rendered. 

You can control which keys get rendered, and you can even choose to render each key differently:

```js
// file: support/startup/defineModels.js

"use strict";

var waigo = require('waigo'),
  schema = waigo.load('support/db/mongoose/schema');

module.exports = function*(app) {
  app.models = {};

  var schema = schema.create({
    name: String,
  }, {
    addTimestampFields: true
  });

  schema.method('viewObjectKeys', function() {
    return ['name'];    // only render the `name` key in the view object
  });

  schema.method('formatForViewObject', function*(ctx, key, val) {
    if ('name' === key) {
      return '[' + name + ']';
    } else {
      return val;
    }
  });

  app.models[modelClass.modelName] = app.db.model('MyModel', schema);
};
```

Now the controller render call will result in a view object containing just the `name` key, and the value of this key will be the `name` model instance value surrounded by square brackets (`[]`).

## License

MIT - see LICENSE.md