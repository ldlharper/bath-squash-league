'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  Table = mongoose.model('Table'),
  Division = mongoose.model('Division'),
  User = mongoose.model('User'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
    _ = require('lodash'),
  _this = this;


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
                    division = new Division({
                        table: table._id,
                        rank: rank
                    });
                division.save();
                table.divisions.push(division._id);
                _.each(users, function(user) {
                    if (index > DIVISION_SIZE) {
                        index = 0;
                        rank++;
                        division = new Division({
                            table: table._id,
                            rank: rank
                        });
                        division.save();
                        table.divisions.push(division._id);
                    }
                    user.division = division._id;
                    user.save();
                    division.users.push(user._id);
                    division.save();
                    index++;
                });
            }
            table.save();
        });
      res.json(table);
    }
  });
};

exports.populateDivisions = function(table) {

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

/**
 * Show the current table
 */
exports.doGet = function (req, res) {
  var isCurrent = req.query.current,
      prevIndex = req.query.prevIndex;

  if (isCurrent) {
    Table.findOne({
      start: { $lt: Date.now() },
      end: { $gt: Date.now()}
    }).populate('divisions').exec(function (err, doc) {
      if (err || !doc) {
        return res.status(400).send({
          message: "Couldn't find current table"
        });
      } else {
          Table.populate(doc, {
              path: 'divisions.users',
              model: 'User',
              select: 'firstName lastName displayName'
          }, function(err, table) {
              res.json(table);
          })
      }
    });
  } else if (prevIndex) {

  } else {
    // return res.status(400).send({
    //   message: 'Invalid request, provide index of table or current.'
    // });
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

  table.title = req.body.title;
  table.content = req.body.content;

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
