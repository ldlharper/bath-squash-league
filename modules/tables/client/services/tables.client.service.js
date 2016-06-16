'use strict';

//Tables service used for communicating with the tables REST endpoints
angular.module('tables').factory('Tables', ['$resource',
  function ($resource) {
    return $resource('api/tables/:tableId', {
      tableId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
]);
