var schedule = require('node-schedule'),
    tablesController = require('../controllers/tables.server.controller'),
    roundsController = require('../controllers/rounds.server.controller'),
    mongoose = require('mongoose'),
    Table = mongoose.model('Table'),
    Division = mongoose.model('Division');
//* 5 0 * * *
schedule.scheduleJob('5 0 * * *', function(){
    Table.findOne({end : {$gt : Date.now()}}).exec(function(err, table) {
       if (!table) {
           roundsController.createNewTable({}, {});
       }
    });
});
