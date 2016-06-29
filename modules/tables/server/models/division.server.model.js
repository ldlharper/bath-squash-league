'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Division Schema
 */
var DivisionSchema = new Schema({
  created: {
    type: Date,
    default: Date.now
  },
  rank: {
    type: Number,
    default: '',
    required: 'Rank cannot be blank',
    min: 0
  },
  table: {
    type: Schema.ObjectId,
    ref: 'Table'
  },
  scores: [{
    type: Schema.ObjectId,
    ref: 'Score'
  }],
  users: [{
    type: Schema.ObjectId,
    ref: 'User'
  }],
  inactiveUsers: [{
    type: Schema.ObjectId,
    ref: 'User'
  }]
});


mongoose.model('Division', DivisionSchema);
