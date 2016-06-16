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
  }
]);
