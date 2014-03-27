var co = require('co'),
  mongoose = require('mongoose');
  path = require('path'),
  Promise = require('bluebird'),
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
          yield* self.Application.start();
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
        yield* self.Application.start();

        self.app.db.should.not.be.undefined;
        self.app.db.collection('test').should.not.be.undefined;

      })(done);
    }    
  },


  'session': {
    beforeEach: function() {
      var self = this;

      self.app.testConfig.startupSteps = ['logging', 'middleware', 'routes', 'listener'];

      self.app.testConfig.middleware.push(
        {
          id: 'sessions', 
          options: {
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
      );
    },
    'bad credentials': function(done) {
      var self = this;

      self.app.testConfig.middleware[1].options.store.config = {
        host: '127.0.0.2',
        port: 27018,
        db: 'waigo-mongo-test'
      };

      co(function*() {
        yield* self.Application.start();
      })(function(err) {
        if (err) return done(err);

        self.request = request(self.app.config.baseURL);

        self.request.get('/?format=json')
          .expect(500)
          .end(done);
      });      
    },

    'good credentials': function(done) {
      var self = this;

      self.app.testConfig.middleware[1].options.store.config = {
        host: '127.0.0.1',
        port: 27017,
        db: 'waigo-mongo-test',
        collection: 'sessions'
      };

      co(function*() {
        yield* self.Application.start();
      })(function(err) {
        if (err) return done(err);

        self.request = request(self.app.config.baseURL);

        self.request.get('/?format=json')
          .expect(200)
          .end(function(err) {
            if (err) return done(err);

            var db = mongoose.createConnection('mongodb://127.0.0.1:27017/waigo-mongo-test');
            db.once('error', done);
            db.once('open', function() {
              var collection = db.collection('sessions');

              collection.find(function(err, results) {
                if (err) return done(err);

                try {
                  results.length.should.eql(1);
                  done();
                } catch (err) {
                  done(err);
                }
              });
            });

          });

      });      
    }    

  }
};

