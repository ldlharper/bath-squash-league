'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  Table = mongoose.model('Table'),
  Division = mongoose.model('Division'),
  User = mongoose.model('User'),
  Score = mongoose.model('Score'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
    _ = require('lodash'),
  _this = this,
  scheduler = require('../scheduler/tables.server.scheduler');


var DIVISION_SIZE = 6;
/**
 * Create a table
 */
exports.create = function (req, res) {
  var table = new Table(req.body);
  table.user = req.user;


  table.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
        User.find().exec(function (err, users) {
            if (err) {
                return res.status(400).send({   
                    message: errorHandler.getErrorMessage(err)
                });
            } else {
                var index = 0,
                    rank = 0,
                    divisions = [],
                    division = new Division({
                        table: table._id,
                        rank: rank
                    });
                division.save();
                table.divisions.push(division._id);
                divisions.push(division);
                division.rawUsers = [];
                _.each(users, function(user) {
                    if (index >= DIVISION_SIZE) {
                        index = 0;
                        rank++;
                        division = new Division({
                            table: table._id,
                            rank: rank
                        });
                        division.save();
                        table.divisions.push(division._id);
                        divisions.push(division);
                        division.rawUsers = [];
                    }
                    division.users.push(user._id);
                    division.save();
                    division.rawUsers.push(user);
                    index++;
                });
                _.each(divisions, function(division) {
                    var scores = [];
                    var pairs = [];
                    _.each(division.rawUsers, function(outerUser) {
                        _.each(division.rawUsers, function(innerUser) {
                            if (outerUser._id !== innerUser._id &&
                                !_.includes(pairs, innerUser._id + outerUser._id) &&
                                !_.includes(pairs, outerUser._id +innerUser._id)) {
                                var score = new Score({
                                    player1: innerUser._id,
                                    player2: outerUser._id,
                                    player1Score: null,
                                    player2Score: null,
                                    division: division._id
                                });
                                score.save();
                                scores.push(score._id);
                                pairs.push(innerUser._id + outerUser._id);
                            }
                        });
                    });
                    division.scores = scores;
                    division.save();
                });
            }

            table.save();
        });
      res.json(table);
    }
  });
};


/**
 * List of Articles
 */
exports.list = function (req, res) {
    Article.find().sort('-created').populate('user', 'displayName').exec(function (err, articles) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            res.json(articles);
        }
    });
};

/**
 * Show the current table by id
 */
exports.read = function (req, res) {
  res.json(req.table);
};

exports.getCurrentTable = function(res, callback) {
    return Table.findOne({
        start: { $lt: Date.now() },
        end: { $gt: Date.now()}
    }).populate('divisions').exec(function (err, doc) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            if (!doc) {
                return Table.findOne({start: { $lt: Date.now() }}).populate('divisions').sort("-end").exec(function(err, doc2) {
                     _this.populateTable(doc2, callback);
                })
            } else {
                 _this.populateTable(doc, callback);
            }

        }
    });
};

exports.populateTable = function(doc, callback) {
    return Table.populate(doc, {
        path: 'divisions.users',
        model: 'User',
        select: 'firstName lastName displayName state'
    }, function(err, doc2) {
        return Table.populate(doc2, {
            path: 'divisions.scores',
            model: 'Score'
        }, function(err, doc3) {
            return Table.populate(doc3, {
                path: 'divisions.scores.player1',
                model: 'User',
                select: 'firstName lastName displayName state'
            }, function(err, doc4) {
                return Table.populate(doc4, {
                    path: 'divisions.scores.player2',
                    model: 'User',
                    select: 'firstName lastName displayName state'
                }, function (err, table) {
                    var isActive = Date.now() > table.start && Date.now() < table.end;
                    table.isActive = isActive;
                    callback(table);
                });
            });
        });
    })
};

/**
 * Show the current table
 */
exports.doGet = function (req, res) {
  var isCurrent = req.query.current,
      number = req.query.number,
      nextRound = req.query.nextRound;

  if (isCurrent) {
      _this.getCurrentTable(res, function(table) {
          table.currentNumber = table.number;
          res.json(table);
      });
  } else if (number) {
      _this.getCurrentTable(res, function(currentTable) {
          Table.findOne({number: number}).populate('divisions').exec(function(err, doc2) {
              _this.populateTable(doc2, function(table) {
                  table.currentNumber = currentTable.number;
                  res.json(table);
              });
          });
      });
  } else if (nextRound) {
      Table.findOne({
          start: { $gt: Date.now() }
      }).populate('divisions').exec(function(err, doc2) {
          if (!doc2) {
              return res.status(400).send({
                  message: "There is no next round to show. Wait for the current round to end."
              });
          }
          _this.populateTable(doc2, function(table) {
              table.isNextRound = true;
              res.json(table);
          });
      });
  } else {
      Table.find().populate('divisions').exec(function (err, tables) {
          if (err) {
              return res.status(400).send({
                  message: errorHandler.getErrorMessage(err)
              });
          } else {
              res.json(tables);
          }
      });
  }

};

/**
 * Update a table
 */
exports.update = function (req, res) {
  var table = req.table;

  table.number = req.body.number;
  table.start = req.body.start;
  table.end = req.body.end;

  table.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(table);
    }
  });
};

/**
 * Delete an table
 */
exports.delete = function (req, res) {
  var table = req.table;

    _.each(table.divisions, function(division) {
        Division.findById(division).exec(function(err, divisionDoc) {
            if (divisionDoc) {
                _.each(divisionDoc.scores, function (score) {
                    Score.findById(score).exec(function (err, scoreDoc) {
                        if (scoreDoc) {
                            scoreDoc.remove();
                        }
                    });
                });
                divisionDoc.remove();
            }
        });
    });
  table.remove(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(table);
    }
  });
};



/**
 * Table middleware
 */
exports.tableByID = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Table is invalid'
    });
  }

  Table.findById(id).populate('user', 'displayName').exec(function (err, table) {
    if (err) {
      return next(err);
    } else if (!table) {
      return res.status(404).send({
        message: 'No table with that identifier has been found'
      });
    }
    req.table = table;
    next();
  });
};
