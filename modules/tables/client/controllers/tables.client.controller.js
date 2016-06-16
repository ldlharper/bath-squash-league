'use strict';

// Tables controller
angular.module('tables').controller('TablesController', ['$scope', '$stateParams', '$location', 'Authentication', 'Tables',
  function ($scope, $stateParams, $location, Authentication, Tables) {
    $scope.authentication = Authentication;

    // Create new Table
    $scope.create = function () {
      // Create new Table object
      var table = new Tables({
        number: this.number,
        start: this.start,
        end: this.end
      });

      // Redirect after save
      table.$save(function (response) {
        $location.path('tables/' + response._id);

        // Clear form fields
        $scope.title = '';
        $scope.content = '';
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

      $scope.submitScore = function() {
        debugger;
      };

    // Remove existing Table
    $scope.remove = function (table) {
      if (table) {
        table.$remove();

        for (var i in $scope.tables) {
          if ($scope.tables[i] === table) {
            $scope.tables.splice(i, 1);
          }
        }
      } else {
        $scope.table.$remove(function () {
          $location.path('tables');
        });
      }
    };

    // Update existing Table
    $scope.update = function () {
      var table = $scope.table;

      table.$update(function () {
        $location.path('tables/' + table._id);
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Find a list of Articles
    $scope.find = function () {
      $scope.tables = Tables.query();
    };

    $scope.findCurrentTable = function() {
      $scope.table = Tables.get({current:true});
      $scope.parseTable($scope.table)
    };

    // Find existing Table
    $scope.findOne = function () {
      $scope.table = Tables.get({
        tableId: $stateParams.tableId
      });
    };

    $scope.indexToLetter = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']

    $scope.getScoreTableDisplay = function(playerRow, playerCol) {
      var score = $scope.userToScores[playerRow._id];
      var result = "";
      if (playerRow._id === playerCol._id) {
        result = "-";
      } else if (!score) {
        result = "";
      } else {
        result = score.score;
      }
      return result;
    };

    $scope.parseTable = function(table) {
      var userToScores = {};
      for (var i in table.divisions) {
        var division = table.divisions[i];
        for (var j in division.scores) {
          var score = division.scores[j];
          var player1score = {opponent: score.player2, score: score.player1Score, opponentScore: score.player2Score};
          if (userToScores[score.player1]) {
            userToScores[score.player1].push(player1Score);
          } else {
            userToScores[score.player1] = [player1score];
          }
          var player2score = {opponent: score.player1, score: score.player2Score, opponentScore: score.player1Score};
          if (userToScores[score.player2]) {
            userToScores[score.player2].push(player2score);
          } else {
            userToScores[score.player2] = [player2score];
          }
        }
      }
      $scope.userToScores = userToScores;
    }
  }
]);
