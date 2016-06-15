'use strict';

// Configuring the Articles module
angular.module('articles').run(['Menus',
  function (Menus) {
    // Add the articles dropdown item
    Menus.addMenuItem('topbar', {
      title: 'News',
      state: 'articles',
      type: 'dropdown',
      roles: ['admin']
    });

    // Add the dropdown list item
    Menus.addSubMenuItem('topbar', 'articles', {
      title: 'List News',
      state: 'articles.list'
    });

    // Add the dropdown create item
    Menus.addSubMenuItem('topbar', 'articles', {
      title: 'Create News',
      state: 'articles.create'
    });
  }
]);
