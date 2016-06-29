'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
    moment = require('moment'),
  mongoose = require('mongoose'),
  Table = mongoose.model('Table'),
  Division = mongoose.model('Division'),
  User = mongoose.model('User'),
  Score = mongoose.model('Score'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
    _ = require('lodash'),
  _this = this,
  tablesController = require('./tables.server.controller');


var DIVISION_SIZE = 6;
var DEFAULT_ROUND_LENGTH_DAYS = 1;
var DEFAULT_BREAK_DAYS = 1;


exports.createNewTable = function(req, res) {
    tablesController.getCurrentTable(res, function(currentTable) {
        var modelsToRollback = [],
            newStart = moment(currentTable.end).add(DEFAULT_BREAK_DAYS, 'days'),
            table = new Table({
                start: newStart.toDate(),
                end: moment(newStart).add(DEFAULT_ROUND_LENGTH_DAYS, 'days').toDate(),
                number: currentTable.number + 1
            });

        table.save(function (err) {
            if (err) {
                return res.status(400).send({
                    message: errorHandler.getErrorMessage(err)
                });
            } else {
                modelsToRollback.push(table);
                _this.getNumberOfDivisions(function(numberOfDivisions) {
                    _this.getUsersToReturn(currentTable._id, numberOfDivisions, function(rankToUser) {
                        var index = 0;
                        _.each(_.sortBy(currentTable.divisions, function(division) {return division.rank}), function(division) {
                            var scores = [],
                                usersDemoted = 0,
                                currentRank = division.rank;

                            index++;
                            _.each(division.users, function(user) {
                                if (user.state !== "ACTIVE") {
                                    usersDemoted++;
                                } else {
                                    var score = _this.calculateUserScore(user, division.scores);
                                    scores.push({score: score, user: user});
                                }
                            });

                            scores = _.sortBy(scores, function(score) {return score.score}).reverse();

                            //Promotion
                            if (currentRank != 0) {
                                var usersToBePromoted =  DIVISION_SIZE - rankToUser[currentRank - 1].length;
                                for (var i = 0; i < usersToBePromoted; i++) {
                                    _this.addRankToScore(rankToUser, currentRank - 1, scores[0].user);
                                    _.pullAt(scores, 0);
                                }


                            }

                            //Demotion
                            if (usersDemoted <= 2 && index != currentTable.divisions.length) {
                                if (usersDemoted <= 1) {
                                    _this.addRankToScore(rankToUser, currentRank + 1, scores[scores.length - 1].user);
                                    _.pullAt(scores, scores.length - 1);
                                }
                                if (usersDemoted == 0) {
                                    _this.addRankToScore(rankToUser, currentRank + 1, scores[scores.length - 1].user);
                                    _.pullAt(scores, scores.length - 1);
                                }
                            }

                            //Remain
                            _.each(scores, function(score) {
                                _this.addRankToScore(rankToUser, currentRank, score.user);
                            });

                        });

                        var divisions = [],
                            divisionPromises = [];
                        for (var prop in rankToUser) {
                            if (rankToUser.hasOwnProperty(prop)) {
                                var division = new Division({
                                    rank: prop,
                                    table: table,
                                    users: _.map(rankToUser[prop], '_id')
                                });

                                divisionPromises.push(division.save(_this.handleSave.bind(this, division, modelsToRollback, res)));
                                divisions.push(division);

                            }
                        }

                        Promise.all(divisionPromises).then(function() {
                            table.divisions = _.map(divisions, '_id');
                            table.save(_this.handleSave.bind(this, table, modelsToRollback, res)).then(function() {
                                _this.populateScores(divisions, modelsToRollback, res).then(function() {
                                    if (!res.headersSent) {
                                        return res.status(204).send();
                                    }
                                });
                            });
                        });
                    });
                });
            }
        });
    });
};

exports.populateScores = function(divisions, modelsToRollback, res) {
    var promises = [];
    _.each(divisions, function(division) {
        var scores = [],
            pairs = [];
        _.each(division.users, function(outerUser) {
            _.each(division.users, function(innerUser) {
                if (!outerUser.equals(innerUser) &&
                    !_.includes(pairs, innerUser + outerUser) &&
                    !_.includes(pairs, outerUser +innerUser)) {
                    var score = new Score({
                        player1: innerUser,
                        player2: outerUser,
                        player1Score: null,
                        player2Score: null,
                        division: division._id
                    });
                    promises.push(score.save(_this.handleSave.bind(this, score, modelsToRollback, res)));
                    scores.push(score._id);
                    pairs.push(innerUser + outerUser);
                }
            });
        });
        division.scores = scores;
        promises.push(division.save(_this.handleSave.bind(this, division, modelsToRollback, res)));
    });
    return Promise.all(promises);
};

exports.addRankToScore = function(rankToUser, rank, user) {
    if (!rankToUser[rank]) {
        rankToUser[rank] = [];
    }
    rankToUser[rank].push(user);
};


exports.handleSave = function(model, models, res, err) {
    if (err) {
        for (var i in models) {
            if (models[i].remove) {
                models[i].remove();
            }
        }

        if (!res.headersSent) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        }
    } else {
        models.push(models);
    }
};




exports.calculateUserScore = function(user, scores) {
    var total = 0;
    _.each(scores, function(score) {
       var playerScore,
           opponentScore;


        if (score.player1._id.equals(user._id)) {
            playerScore = score.player1Score;
            opponentScore = score.player2Score;
        } else if (score.player2._id.equals(user._id)) {
            playerScore = score.player2Score;
            opponentScore = score.player1Score;
        }

        if (typeof playerScore !== "undefined" &&
            typeof opponentScore !== "undefined" &&
            score.player1.state === "ACTIVE" &&
            score.player2.state === "ACTIVE") {
            total += _this.calculateScore(playerScore, opponentScore);
        }
    });
    return total
};

exports.calculateScore = function(playerScore, opponentScore) {
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

exports.getUsersToReturn = function(currentNumber, numberOfDivisions, callback) {
    var rankToUser = {},
        promises = [],
        innerPromises = [];
    User.find({state: 'ACTIVE'}).exec(function (err, users) {
        _.each(users, function (user) {
            promises.push(Division.findOne({
                $and: [
                    {"table" : currentNumber},
                    {'users' : {$in: [user._id] }}
                ]
            }).exec(function (innerUser, err, currentDivision) {
                if (!currentDivision) {
                    innerPromises.push(Division.findOne({'users': { $in : [innerUser._id] }}).sort('-table.number').exec(function (err, prevDivision) {
                        var ranking;
                        if (!prevDivision) {
                            ranking = numberOfDivisions + 1;
                        } else {
                            ranking = prevDivision.rank + 1;
                        }
                        if (ranking > (numberOfDivisions - 1)) {
                            ranking = numberOfDivisions -1;
                        }
                        _this.addRankToScore(rankToUser, ranking, innerUser);
                    }));
                }
            }.bind(this, user)));
        });
    }).then(function () {
        Promise.all(promises).then(function() {
           Promise.all(innerPromises).then(function() {
               callback(rankToUser);
           });
        });
    });
};

exports.getNumberOfDivisions = function(callback) {
    return User.count({state: 'ACTIVE'}, function(err, count){
        callback(Math.ceil(count / DIVISION_SIZE));
    });
};


