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
  tablesController = require('./tables.server.controller'),
roundsController = require('./rounds.server.controller');


exports.updateDivision = function(req, res) {
    var playerRequestId = req.body.player,
        divisionRequestId = req.body.division;

    if (playerRequestId && divisionRequestId) {
        Division.findById(divisionRequestId).exec(function (err, divisionRequest) {
            if (err) {
                return res.status(400).send({
                    message: errorHandler.getErrorMessage(err)
                });
            }

            Table.findById(divisionRequest.table).exec(function(err, table) {
                if (!divisionRequest) {
                    return res.status(400).send({message: "Couldn't find division"})
                }
                _.each(table.divisions, function(loopDivisionId) {
                    Division.findById(loopDivisionId).exec(function(err, loopDivision) {
                        var found = false;
                        loopDivision.users = _.filter(loopDivision.users, function(loopUser) {
                            if (loopUser.equals(playerRequestId)) {
                                found = true;
                                return false;
                            }
                            return true;
                        });

                        if (found) {
                            _this.removeAndUpdateScores(loopDivision, res);
                            loopDivision.save();

                            divisionRequest.users.push(playerRequestId);
                            _this.removeAndUpdateScores(divisionRequest, res);
                            divisionRequest.save();


                            return res.status(204).send();
                        }
                    });
                });
            });
        });
    } else {
        return res.status(400).send({
            message: "Player and division must be provided."
        });
    }
};

exports.removeAndUpdateScores = function(division, res) {
    _.each(division.scores, function(scoreId) {
       Score.findById(scoreId).exec(function(err, score) {
           score.remove();
       })
    });

    roundsController.populateScores([division], [], res);

};

exports.updateUserState = function(userId, state, res) {
    if (state !== "ACTIVE") {
        tablesController.getCurrentTable(res, function(currentTable) {
            User.findById(userId).exec(function (err, user) {
                if (currentTable && currentTable.isActive) {
                    Division.findOne({
                        $and: [
                            {"table": currentTable},
                            {'users': {$in: [user._id]}}
                        ]
                    }).populate("scores").exec(function (err, currentDivision) {
                        if (currentDivision) {
                            currentDivision.inactiveUsers.push(user._id);
                            currentDivision.save();

                            _.each(currentDivision.scores, function (score) {
                                if (user._id.equals(score.player1) ||
                                    user._id.equals(score.player2)) {
                                    score.remove();
                                }
                            });
                        }
                    });
                }
                Table.findOne({start: {$gt: Date.now()}}).exec(function(err, table) {
                    if (table) {
                        Division.findOne({
                            $and: [
                                {"table": table},
                                {'users': {$in: [user._id]}}
                            ]
                        }).populate("scores").exec(function (err, currentDivision) {
                            if (currentDivision) {
                                currentDivision.users = _.filter(currentDivision.users, function(divisionUser) {
                                    return !user._id.equals(divisionUser);
                                });
                                currentDivision.save();

                                _.each(currentDivision.scores, function(score) {
                                    if(user._id.equals(score.player1) ||
                                        user._id.equals(score.player2)) {
                                        score.remove();
                                    }
                                });
                            }
                        });
                    }
                })
            });
        });
    }
};

