'use strict';

// Tables controller
angular.module('tables').controller('TablesController', ['$scope', '$stateParams', '$location', '$state', '$http', 'Authentication', 'Tables', 'Scores',
  function ($scope, $stateParams, $location, $state, $http, Authentication, Tables, Scores) {
    $scope.authentication = Authentication;

      $scope.calculateNewRound = function() {
        $http({
            url: '/api/rounds/calculate',
            method: 'POST'
        }).then(function() {
            $scope.sucess = "Round calculated."
        }, function(error) {
            $scope.error = error.data.message;
            $scope.error = error.data.message;
        });
      };

      $scope.pageChanged = function () {
          $location.path('tables/rounds/' + $scope.table.number);
      };


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
          var score = new Scores({
              _id: this.score._id,
              player1: this.score.player1._id,
              player2: this.score.player2._id,
              player1Score: this.score.player1Score,
              player2Score: this.score.player2Score,
              division: this.score.division
          });

          // Redirect after save
          score.$update(function (response) {

              $state.reload();
          }, function (errorResponse) {
              $scope.error = errorResponse.data.message;
          });
      };


      $scope.divisionHasCurrentUser = function(division, user) {
          var found = false;
          for (var i in division.users) {
              var divisionUser = division.users[i];
              if (user._id === divisionUser._id) {
                  found = true;
              }
          }
          return found;
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

      $scope.goToEdit = function(tableId) {
          $location.path('tables/' + tableId + '/edit');
      };

    // Find a list of Articles
    $scope.find = function () {
      $scope.tables = Tables.query();
    };

    $scope.findRound = function() {
        var isNotCurrent =  $stateParams.roundId;
        var isNextRound = $state.includes("tables.nextRound");
        if (isNotCurrent) {
            $scope.table = Tables.get({number:$stateParams.roundId});
        } else if (isNextRound) {
            $scope.table = Tables.get({nextRound:true});
        } else {
            $scope.table = Tables.get({current:true});
        }
        $scope.isNextRound = isNextRound;
      $scope.table.$promise.then(function (result) {
          $scope.itemsPerPage = 1;
          $scope.totalNumber = result.currentNumber;
          $scope.isCurrent = result.number === result.currentNumber;
          $scope.calculateScores(result);
      }, function(error) {
          $scope.error = error.data.message;;
      });
    };
    // Find existing Table
    $scope.findOne = function () {
      $scope.table = Tables.get({
        tableId: $stateParams.tableId
      });
    };

    $scope.indexToLetter = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];

    $scope.divisionForm = {};
    $scope.divisionUpdate = function() {
        $http({
            url: '/api/players/division',
            method: 'PUT',
            data: $scope.divisionForm
        }).then(function() {
            $state.reload();
        });
    };
  $scope.getDisplayScore = function(playerScore, opponentScore) {
      if (playerScore == -1) {
          return 0;
      } else if (playerScore === 0) {
          return 1;
      } else if (playerScore === 1) {
          return 2;
      } else if (playerScore === 2) {
          return 3;
      } else if (playerScore === 3 && opponentScore === 2) {
          return 4;
      } else if (playerScore === 3 && opponentScore === 1) {
          return 5;
      } else if ((playerScore === 3 && opponentScore === 0) || opponentScore === -1) {
          return 6;
      }
  };

      $scope.displayScores = {};

      $scope.calculateScores = function(table) {
          $scope.players = [];
        for (var i in table.divisions)  {
            var division = table.divisions[i];
            division.displayRank = division.rank + 1;
            for (var j in division.users) {
                var user =  division.users[j];
                $scope.players.push(user);
                for (var k in division.scores) {
                    var score = division.scores[k];
                    var opponent = false;
                    var opponentScore = false;
                    var playerScore = false;
                    if (user._id === score.player1._id) {
                        opponent = score.player2;
                        opponentScore = score.player2Score;
                        playerScore = score.player1Score;
                    }
                    if (user._id === score.player2._id) {
                        opponent = score.player1;
                        opponentScore = score.player1Score;
                        playerScore = score.player2Score;
                    }

                    if (opponent) {
                        if (!$scope.displayScores[user._id]) {
                            $scope.displayScores[user._id] = {};
                        }
                        $scope.displayScores[user._id][opponent._id] = {
                            score: playerScore,
                            display: $scope.getDisplayScore(playerScore, opponentScore)
                        }
                    }
                }
            }
        }
          for (var playerProp in $scope.displayScores) {
              if ($scope.displayScores.hasOwnProperty(playerProp)) {
                  var player = $scope.displayScores[playerProp];
                  var total = 0;
                  for (var opponentProp in player) {
                      if (player.hasOwnProperty(opponentProp) && opponentProp != "total") {
                          var displayScore = player[opponentProp].display;
                          if (displayScore) {
                              total += displayScore;
                          } else {
                              total = "";
                              break;
                          }
                      }
                  }
                  player.total = total;
              }
          }
      }
  }
]);
