'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
    mongoose = require('mongoose'),
    Score = mongoose.model('Score'),
    errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

/**
 * Update a score
 */
exports.update = function (req, res) {
    var score = req.score;

    score.player1Score = req.body.player1Score;
    score.player2Score = req.body.player2Score;

    score.save(function (err) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            res.json(score);
        }
    });

};



/**
 * Score middleware
 */
exports.scoreByID = function (req, res, next, id) {

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send({
            message: 'Score is invalid'
        });
    }

    Score.findById(id).populate('player1', 'player2').exec(function (err, score) {
        if (err) {
            return next(err);
        } else if (!score) {
            return res.status(404).send({
                message: 'No score with that identifier has been found'
            });
        }
        req.score = score;
        next();
    });
};
