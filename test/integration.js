var co = require('co'),
  mongoose = require('mongoose');
  path = require('path'),
  Q = require('bluebird'),
  request = require('supertest'),
  shell = require('shelljs'),
  waigo = require('waigo');

var _utils = require('waigo-test-utils')(module),
  test = _utils.test,
  utils = _utils.utils,
  assert = utils.assert,
  expect = utils.expect,
  should = utils.should;


test['mongo'] = {
  beforeEach: function(done) {
    var self = this;

    shell.cp('-Rf', path.join(__dirname, '/../src/support'), utils.appFolder);

    co(function*() {
      yield* waigo.init({
        appFolder: utils.appFolder
      })

      self.Application = waigo.load('application');
      self.app = self.Application.app;

      self.app.testConfig = {
        middleware: [
          {
            id: 'errorHandler',
            options: {}
          },
        ]
      };

      self.startOptions = { postConfig: function(config) {
        config.startupSteps = self.app.testConfig.startupSteps || [];
        config.db = self.app.testConfig.db || null;
        config.middleware = self.app.testConfig.middleware || { 
          order: [],
        };
      }};

    })(done);
  },

  afterEach: function(done) {    
    utils.spawn(this.Application.shutdown)
      .then(function() {
        shell.rm('-rf', path.join(utils.appFolder, 'support'));
      })
      .nodeify(done);
  },

  'database connection': {
    beforeEach: function() {
      var self = this;

      self.app.testConfig.startupSteps = ['logging', 'middleware', 'database', 'routes', 'listener'];
    },
    'throws error if could not connect': function(done) {
      var self = this;

      self.app.testConfig.db = {
        mongo: {
          host: '127.0.0.1',
          port: 27017,
          db: '..'
        }
      };

      co(function*() {
        try {
          yield* self.Application.start(self.startOptions);
          throw new Error('should not be here');
        } catch (err) {
          expect( 0 > err.toString().indexOf('should not be here') ).to.be.true;
        }
      })(done);
    },

    'app.db is an open connection': function(done) {
      var self = this;

      self.app.testConfig.db = {
        mongo: {
          host: '127.0.0.1',
          port: 27017,
          db: 'waigo-mongo-test'
        }
      };

      co(function*() {
        yield* self.Application.start(self.startOptions);

        self.app.db.should.not.be.undefined;
        self.app.db.collection('test').should.not.be.undefined;

      })(done);
    }    
  },


  'schema': {
    beforeEach: function(done) {
      var self = this;

      self.schema = waigo.load('support/db/mongoose/schema');

      self.app.testConfig.db = {
        mongo: {
          host: '127.0.0.1',
          port: 27017,
          db: 'waigo-mongo-test'
        }
      };

      self.app.testConfig.startupSteps = ['logging', 'database'];

      co(function*() {
        yield* self.Application.start(self.startOptions);
      })(done);
    },
    'creates Schema object': function() {
      var s = this.schema.create({
        name: String
      });

      s.should.be.instanceOf(mongoose.Schema);
    },
    'timestamp fields': {
      beforeEach: function() {
        var model = this.app.db.model('Test', this.schema.create({
          name: String
        }, { 
          addTimestampFields: true
        }));

        this.m = new model({
          name: 'bla'
        });
      },
      'created': function(done) {
        var m = this.m;

        Q.promisify(m.save, m)()
          .then(function() {
            m.created_at.should.be.instanceOf(Date);
            m.updated_at.should.be.instanceOf(Date);            
          })
          .nodeify(done);
      },
      'updated': function(done) {
        var old_updated_at, old_created_at;

        var m = this.m;
        var saveP = Q.promisify(m.save, m);

        saveP()
          .then(function() {
            old_updated_at = m.updated_at;
            old_created_at = m.created_at;
          })
          .then(function() {
            m.name = 'tester';
            
            return saveP();
          })
          .then(function() {
            m.created_at.should.eql(old_created_at);
            m.updated_at.should.not.eql(old_updated_at);
          })
          .nodeify(done);
      }
    },
    'view objects': {
      'can be converted to view object': function(done) {
        var model = this.app.db.model('Test', this.schema.create({
          name: String
        }));

        var m = new model({
          name: 'bla'
        });

        utils.spawn(m.toViewObject, m)
          .then(function(v) {
            v._id.should.be.defined;
            v.name.should.eql('bla');
          })
          .nodeify(done);
      },
      'can limit what keys are shown in view objects': function(done) {
        var schema = this.schema.create({
          name: String
        });

        schema.method('viewObjectKeys', function() {
          return ['name'];
        });

        var model = this.app.db.model('Test', schema);

        var m = new model({
          name: 'bla'
        });

        utils.spawn(m.toViewObject, m)
          .should.eventually.eql({ name: 'bla' })
          .notify(done);
      },
      'can choose how each field gets formatted': function(done) {
        var schema = this.schema.create({
          name: String
        });

        schema.method('formatForViewObject', function*(ctx, key, val) {
          return ctx.test + ': ' + key + '=' + val;
        });

        var model = this.app.db.model('Test', schema);

        var m = new model({
          name: '123'
        });

        utils.spawn(m.toViewObject, m, { test: 'bla' })
          .then(function(v) {
            v.name.should.eql('bla: name=123');
          })
          .nodeify(done);
      },
      'converts sub docs to view objects': function(done) {
        var Model1 = this.app.db.model('Model1', this.schema.create({
          name: String
        }));

        var Model2 = this.app.db.model('Model2', this.schema.create({
          item: mongoose.Schema.Types.Mixed
        }));

        var m1 = new Model1({ name: 'tester' });
        var m2 = new Model2({ item: m1 });

        utils.spawn(m2.toViewObject, m2)
          .then(function(v) {
            v.item._id.should.be.defined;
            v.item.name.should.eql('tester');
          })
          .nodeify(done);
      }
    }
  },


  'session': {
    beforeEach: function(done) {
      var self = this;

      self.app.testConfig.startupSteps = ['logging', 'middleware', 'routes', 'listener'];

      self.app.testConfig.middleware = {
        order: ['sessions'],
        options: {
          sessions : {
            keys: ['use', 'your', 'own'],
            name: 'waigo',
            store: {
              type: 'mongo', 
              config: {
              }
            },
            cookie: {
              validForDays: 7,
              path: '/'
            }
          }          
        }
      };

      var db = mongoose.createConnection('mongodb://127.0.0.1:27017/waigo-mongo-test');
      db.once('error', done);
      db.once('open', function() {
        self.DbModel = db.model('Session', new mongoose.Schema({
          blob  :  { type: String },
          date  :  { type: Date }
        }));

        self.DbModel.remove(done);
      });
    },

    'good credentials': function(done) {
      var self = this;

      self.app.testConfig.middleware.options.sessions.store.config = {
        host: '127.0.0.1',
        port: 27017,
        db: 'waigo-mongo-test',
        collection: 'sessions'
      };

      co(function*() {
        yield* self.Application.start(self.startOptions);
      })(function(err) {
        if (err) return done(err);

        self.request = request(self.app.config.baseURL);

        self.request.get('/?format=json')
          .expect(200)
          .end(function(err) {
            if (err) return done(err);

            self.DbModel.count(function(err, count) {
              if (err) return done(err);

              try {
                expect(count).to.eql(1);

                done();
              } catch (err2) {
                done(err2);
              }
            });
          });

      });      
    }    

  }
};

