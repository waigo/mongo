var co = require('co'),
  path = require('path'),
  shell = require('shelljs'),
  waigo = require('waigo');

var _testUtils = require('waigo-test-utils')(module),
  test = _testUtils.test,
  utils = _testUtils.utils,
  assert = utils.assert,
  expect = utils.expect,
  should = utils.should;


test['mongo'] = {
  beforeEach: function(done) {
    var self = this;

    shell.cp('-Rf', path.join(__dirname, '/../src/support'), utils.appFolder);

    co(function*() {
      yield* waigo.init({
        appFolder: utils.testAppFolder
      })

      self.app = waigo.load('app');
    })(done);
  },

  afterEach: function(done) {    
    shell.rm('-rf', path.join(utils.appFolder, 'support'));
    done();
  },

  'database connection': {
    'throws error if could not connect': function(done) {
      var self = this;

      self.app.testConfig = {
        db: {
          mongo: {
            host: '127.0.0.1',
            port: 27017,
            db: '..'
          }
        }
      };

      co(function*() {
        try {
          yield* self.app.start();
          throw new Error('should not be here');
        } catch (err) {
          expect( 0 > err.toString().indexOf('should not be here') ).to.be.true;
        }
      })(done);
    },

    'app.db is set': function(done) {
      var self = this;

      self.app.testConfig = {
        db: {
          mongo: {
            host: '127.0.0.1',
            port: 27017,
            db: 'waigo-mongo-test'
          }
        }
      };

      co(function*() {
        yield* self.app.start();

        self.app.db.should.not.be.undefined;

      })(done);
    }    

  }
};

