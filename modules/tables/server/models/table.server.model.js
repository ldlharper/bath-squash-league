'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Table Schema
 */
var TableSchema = new Schema({
  number: {
    type: Number,
    required: 'Number cannot be blank',
    unique: "Number must be unique"
  },
  start: {
    type: Date,
    default: Date.now(),
    required: "Start date cannot be blank"
  },
  end: {
    type: Date,
    required: "End date cannot be blank"
  },
  isActive: {
    type: Boolean
  },
  currentNumber: {
    type: Number
  },
  isNextRound: {
    type: Boolean
  },
  divisions: [{
    type: Schema.ObjectId,
    ref: 'Division'
  }]
});

mongoose.model('Table', TableSchema);
