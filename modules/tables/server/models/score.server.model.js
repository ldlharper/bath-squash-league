'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Score Schema
 */
var ScoreSchema = new Schema({
  created: {
    type: Date,
    default: Date.now
  },
  player1Score: {
    type: Number,
    min: [-1, 'Minimum score is -1 which denotes a no show.'],
    max: [3, 'Maximum score is 3']
  },
  player2Score: {
    type: Number,
    min: [-1, 'Minimum score is -1 which denotes a no show.'],
    max: [3, 'Maximum score is 3']
  },
  player1: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  player2: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  division: {
    type: Schema.ObjectId,
    ref: 'Division'
  }
});

mongoose.model('Score', ScoreSchema);
