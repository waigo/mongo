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

