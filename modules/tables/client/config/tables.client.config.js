'use strict';

// Configuring the Tables module
angular.module('tables').run(['Menus',
  function (Menus) {
    // Add the tables dropdown item
    Menus.addMenuItem('topbar', {
      title: 'Tables',
      state: 'tables.current',
      isPublic: true
    });
    Menus.addSubMenuItem('topbar', 'admin', {
      title: 'Next round',
      state: 'tables.nextRound'
    });
    Menus.addSubMenuItem('topbar', 'admin', {
      title: 'List rounds',
      state: 'tables.list'
    });
    Menus.addSubMenuItem('topbar', 'admin', {
      title: 'Create intial round',
      state: 'tables.create'
    });
    Menus.addSubMenuItem('topbar', 'admin', {
      title: 'Manually calculate next round',
      state: 'tables.calculate'
    });

  }
]);
