'use strict';

/**
 * Module dependencies.
 */
var tablesPolicy = require('../policies/tables.server.policy'),
    scoresPolicy = require('../policies/scores.server.policy'),
    tables = require('../controllers/tables.server.controller'),
    scores = require('../controllers/scores.server.controller'),
    rounds = require('../controllers/rounds.server.controller');

module.exports = function (app) {
  // Tables collection routes
  app.route('/api/tables').all(tablesPolicy.isAllowed)
    .get(tables.doGet)
    .post(tables.create);

  // Single table routes
  app.route('/api/tables/:tableId').all(tablesPolicy.isAllowed)
    .get(tables.read)
    .put(tables.update)
    .delete(tables.delete);

  app.route('/api/rounds/calculate')
      .post(rounds.createNewTable);
  // Single score routes
  app.route('/api/scores/:scoreId').all(scoresPolicy.isAllowed)
      .put(scores.update);

  // Finish by binding the table middleware
  app.param('tableId', tables.tableByID);
  app.param('scoreId', scores.scoreByID);
};
