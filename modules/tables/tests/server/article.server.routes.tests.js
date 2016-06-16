'use strict';

var should = require('should'),
  request = require('supertest'),
  path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Table = mongoose.model('Table'),
  express = require(path.resolve('./config/lib/express'));

/**
 * Globals
 */
var app, agent, credentials, user, table;

/**
 * Table routes tests
 */
describe('Table CRUD tests', function () {
  before(function (done) {
    // Get application
    app = express.init(mongoose);
    agent = request.agent(app);

    done();
  });

  beforeEach(function (done) {
    // Create user credentials
    credentials = {
      username: 'username',
      password: 'password'
    };

    // Create a new user
    user = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'test@test.com',
      username: credentials.username,
      password: credentials.password,
      provider: 'local'
    });

    // Save a user to the test db and create new table
    user.save(function () {
      table = {
        title: 'Table Title',
        content: 'Table Content'
      };

      done();
    });
  });

  it('should be able to save an table if logged in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new table
        agent.post('/api/tables')
          .send(table)
          .expect(200)
          .end(function (tableSaveErr, tableSaveRes) {
            // Handle table save error
            if (tableSaveErr) {
              return done(tableSaveErr);
            }

            // Get a list of tables
            agent.get('/api/tables')
              .end(function (tablesGetErr, tablesGetRes) {
                // Handle table save error
                if (tablesGetErr) {
                  return done(tablesGetErr);
                }

                // Get tables list
                var tables = tablesGetRes.body;

                // Set assertions
                (tables[0].user._id).should.equal(userId);
                (tables[0].title).should.match('Table Title');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to save an table if not logged in', function (done) {
    agent.post('/api/tables')
      .send(table)
      .expect(403)
      .end(function (tableSaveErr, tableSaveRes) {
        // Call the assertion callback
        done(tableSaveErr);
      });
  });

  it('should not be able to save an table if no title is provided', function (done) {
    // Invalidate title field
    table.title = '';

    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new table
        agent.post('/api/tables')
          .send(table)
          .expect(400)
          .end(function (tableSaveErr, tableSaveRes) {
            // Set message assertion
            (tableSaveRes.body.message).should.match('Title cannot be blank');

            // Handle table save error
            done(tableSaveErr);
          });
      });
  });

  it('should be able to update an table if signed in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new table
        agent.post('/api/tables')
          .send(table)
          .expect(200)
          .end(function (tableSaveErr, tableSaveRes) {
            // Handle table save error
            if (tableSaveErr) {
              return done(tableSaveErr);
            }

            // Update table title
            table.title = 'WHY YOU GOTTA BE SO MEAN?';

            // Update an existing table
            agent.put('/api/tables/' + tableSaveRes.body._id)
              .send(table)
              .expect(200)
              .end(function (tableUpdateErr, tableUpdateRes) {
                // Handle table update error
                if (tableUpdateErr) {
                  return done(tableUpdateErr);
                }

                // Set assertions
                (tableUpdateRes.body._id).should.equal(tableSaveRes.body._id);
                (tableUpdateRes.body.title).should.match('WHY YOU GOTTA BE SO MEAN?');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should be able to get a list of tables if not signed in', function (done) {
    // Create new table model instance
    var tableObj = new Table(table);

    // Save the table
    tableObj.save(function () {
      // Request tables
      request(app).get('/api/tables')
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Array).and.have.lengthOf(1);

          // Call the assertion callback
          done();
        });

    });
  });

  it('should be able to get a single table if not signed in', function (done) {
    // Create new table model instance
    var tableObj = new Table(table);

    // Save the table
    tableObj.save(function () {
      request(app).get('/api/tables/' + tableObj._id)
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Object).and.have.property('title', table.title);

          // Call the assertion callback
          done();
        });
    });
  });

  it('should return proper error for single table with an invalid Id, if not signed in', function (done) {
    // test is not a valid mongoose Id
    request(app).get('/api/tables/test')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'Table is invalid');

        // Call the assertion callback
        done();
      });
  });

  it('should return proper error for single table which doesnt exist, if not signed in', function (done) {
    // This is a valid mongoose Id but a non-existent table
    request(app).get('/api/tables/559e9cd815f80b4c256a8f41')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'No table with that identifier has been found');

        // Call the assertion callback
        done();
      });
  });

  it('should be able to delete an table if signed in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new table
        agent.post('/api/tables')
          .send(table)
          .expect(200)
          .end(function (tableSaveErr, tableSaveRes) {
            // Handle table save error
            if (tableSaveErr) {
              return done(tableSaveErr);
            }

            // Delete an existing table
            agent.delete('/api/tables/' + tableSaveRes.body._id)
              .send(table)
              .expect(200)
              .end(function (tableDeleteErr, tableDeleteRes) {
                // Handle table error error
                if (tableDeleteErr) {
                  return done(tableDeleteErr);
                }

                // Set assertions
                (tableDeleteRes.body._id).should.equal(tableSaveRes.body._id);

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to delete an table if not signed in', function (done) {
    // Set table user
    table.user = user;

    // Create new table model instance
    var tableObj = new Table(table);

    // Save the table
    tableObj.save(function () {
      // Try deleting table
      request(app).delete('/api/tables/' + tableObj._id)
        .expect(403)
        .end(function (tableDeleteErr, tableDeleteRes) {
          // Set message assertion
          (tableDeleteRes.body.message).should.match('User is not authorized');

          // Handle table error error
          done(tableDeleteErr);
        });

    });
  });

  afterEach(function (done) {
    User.remove().exec(function () {
      Table.remove().exec(done);
    });
  });
});
