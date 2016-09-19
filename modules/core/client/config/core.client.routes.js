'use strict';

// Setting up route
angular.module('core').config(['$stateProvider', '$urlRouterProvider',
  function ($stateProvider, $urlRouterProvider) {

    // Redirect to 404 when route not found
    $urlRouterProvider.otherwise('not-found');

    // Home state routing
    $stateProvider
      .state('home', {
        abstract: true,
        url: '/home',
        templateUrl: 'modules/core/views/home/home.client.view.html'
      })
      .state('home.news', {
        url: '/news',
        templateUrl: 'modules/core/views/home/news.client.view.html'
      })
      .state('home.about', {
        url: '/about',
        templateUrl: 'modules/core/views/home/about.client.view.html'
      })
      .state('home.rules', {
        url: '/rules',
        templateUrl: 'modules/core/views/home/rules.client.view.html'
      })
      .state('home.faqs', {
        url: '/faqs',
        templateUrl: 'modules/core/views/home/faqs.client.view.html'
      })
      .state('home.bad', {
        url: '/bad',
        templateUrl: 'modules/core/views/home/bad.client.view.html'
      })
      .state('home.robin', {
        url: '/robin',
        templateUrl: 'modules/core/views/home/robin.client.view.html'
      })
      .state('home.calendar', {
        url: '/calendar',
        templateUrl: 'modules/core/views/home/calendar.client.view.html'
      })
      .state('home.links', {
        url: '/links',
        templateUrl: 'modules/core/views/home/links.client.view.html'
      })
      .state('home.videos', {
        url: '/videos',
        templateUrl: 'modules/core/views/home/videos.client.view.html'
      })
      .state('not-found', {
        url: '/not-found',
        templateUrl: 'modules/core/views/404.client.view.html'
      });
  }
]);
