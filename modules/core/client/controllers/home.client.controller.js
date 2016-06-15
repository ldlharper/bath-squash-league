'use strict';

angular.module('core').controller('HomeController', ['$scope', 'Authentication', 'Articles',
  function ($scope, Authentication, Articles) {
    // This provides Authentication context.
    $scope.authentication = Authentication;
    // Find a list of Articles
    $scope.find = function () {
      $scope.articles = Articles.query();
    };
  }
]);
