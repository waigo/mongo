var co = require('co'),
  mongoose = require('mongoose'),
  mongoSession = require('koa-session-mongo'),
  path = require('path'),
  Promise = require('bluebird');

var _utils = require('waigo-test-utils')(module),
  test = _utils.test,
  utils = _utils.utils,
  assert = utils.assert,
  expect = utils.expect,
  should = utils.should;


test['session'] = {
  beforeEach: function(done) {
    var self = this;

    shell.cp('-Rf', path.join(__dirname, '/../src/support'), utils.appFolder);

    co(function*() {
      yield* waigo.init({
        appFolder: utils.appFolder
      });

      self.createSpy = test.mocker.stub(mongoSession, 'create', function() {
        return 123;
      });
    })(done);
  },

  afterEach: function(done) {    
    shell.rm('-rf', path.join(utils.appFolder, 'support'));
    done();
  },

  'default': function() {
    var conn = waigo.load('support/session/store/mongo').create(null, {
      host: 'testhost',
      port: 1000,
      db: 'testdb'
    });

    expect(conn).to.eql(123);

    this.createSpy.should.have.been.calledOnce;
    this.createSpy.should.have.been.calledWithExactly({
      host: 'testhost',
      port: 1000,
      db: 'testdb'      
    });
  },

  'reuse app db': function() {
    var app = waigo.load('application').app;
    app.logger = { info: function() {} };
    app.db = new Date();

    waigo.load('support/session/store/mongo').create(app, {
      useAppMongooseDbConn: true
    });

    this.createSpy.should.have.been.calledOnce;
    this.createSpy.should.have.been.calledWithExactly({
      useAppMongooseDbConn: true,
      mongoose: app.db
    });
  }
};



test['schema'] = {
  beforeEach: function(done) {
    var self = this;

    shell.cp('-Rf', path.join(__dirname, '/../src/support'), utils.appFolder);

    co(function*() {
      yield* waigo.init({
        appFolder: utils.appFolder
      });
    })(done);
  },

  afterEach: function(done) {    
    shell.rm('-rf', path.join(utils.appFolder, 'support'));
    done();
  },

  'exports Schema': function() {
    var schema = waigo.load('support/db/mongoose/schema');

    schema.Schema.should.eql(mongoose.Schema);
  },
};

