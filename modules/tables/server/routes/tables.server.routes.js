'use strict';

/**
 * Module dependencies.
 */
var tablesPolicy = require('../policies/tables.server.policy'),
  tables = require('../controllers/tables.server.controller');

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

  // Finish by binding the table middleware
  app.param('tableId', tables.tableByID);
};
