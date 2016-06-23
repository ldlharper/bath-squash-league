'use strict';

//Tables service used for communicating with the scores REST endpoints
angular.module('tables').factory('Scores', ['$resource',
  function ($resource) {
    return $resource('api/scores/:scoreId', {
      scoreId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
]);
