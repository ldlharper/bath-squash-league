'use strict';

(function () {
  // Tables Controller Spec
  describe('Tables Controller Tests', function () {
    // Initialize global variables
    var TablesController,
      scope,
      $httpBackend,
      $stateParams,
      $location,
      Authentication,
      Tables,
      mockTable;

    // The $resource service augments the response object with methods for updating and deleting the resource.
    // If we were to use the standard toEqual matcher, our tests would fail because the test values would not match
    // the responses exactly. To solve the problem, we define a new toEqualData Jasmine matcher.
    // When the toEqualData matcher compares two objects, it takes only object properties into
    // account and ignores methods.
    beforeEach(function () {
      jasmine.addMatchers({
        toEqualData: function (util, customEqualityTesters) {
          return {
            compare: function (actual, expected) {
              return {
                pass: angular.equals(actual, expected)
              };
            }
          };
        }
      });
    });

    // Then we can start by loading the main application module
    beforeEach(module(ApplicationConfiguration.applicationModuleName));

    // The injector ignores leading and trailing underscores here (i.e. _$httpBackend_).
    // This allows us to inject a service but then attach it to a variable
    // with the same name as the service.
    beforeEach(inject(function ($controller, $rootScope, _$location_, _$stateParams_, _$httpBackend_, _Authentication_, _Tables_) {
      // Set a new global scope
      scope = $rootScope.$new();

      // Point global variables to injected services
      $stateParams = _$stateParams_;
      $httpBackend = _$httpBackend_;
      $location = _$location_;
      Authentication = _Authentication_;
      Tables = _Tables_;

      // create mock table
      mockTable = new Tables({
        _id: '525a8422f6d0f87f0e407a33',
        title: 'An Table about MEAN',
        content: 'MEAN rocks!'
      });

      // Mock logged in user
      Authentication.user = {
        roles: ['user']
      };

      // Initialize the Tables controller.
      TablesController = $controller('TablesController', {
        $scope: scope
      });
    }));

    it('$scope.find() should create an array with at least one table object fetched from XHR', inject(function (Tables) {
      // Create a sample tables array that includes the new table
      var sampleTables = [mockTable];

      // Set GET response
      $httpBackend.expectGET('api/tables').respond(sampleTables);

      // Run controller functionality
      scope.find();
      $httpBackend.flush();

      // Test scope value
      expect(scope.tables).toEqualData(sampleTables);
    }));

    it('$scope.findOne() should create an array with one table object fetched from XHR using a tableId URL parameter', inject(function (Tables) {
      // Set the URL parameter
      $stateParams.tableId = mockTable._id;

      // Set GET response
      $httpBackend.expectGET(/api\/tables\/([0-9a-fA-F]{24})$/).respond(mockTable);

      // Run controller functionality
      scope.findOne();
      $httpBackend.flush();

      // Test scope value
      expect(scope.table).toEqualData(mockTable);
    }));

    describe('$scope.craete()', function () {
      var sampleTablePostData;

      beforeEach(function () {
        // Create a sample table object
        sampleTablePostData = new Tables({
          title: 'An Table about MEAN',
          content: 'MEAN rocks!'
        });

        // Fixture mock form input values
        scope.title = 'An Table about MEAN';
        scope.content = 'MEAN rocks!';

        spyOn($location, 'path');
      });

      it('should send a POST request with the form input values and then locate to new object URL', inject(function (Tables) {
        // Set POST response
        $httpBackend.expectPOST('api/tables', sampleTablePostData).respond(mockTable);

        // Run controller functionality
        scope.create();
        $httpBackend.flush();

        // Test form inputs are reset
        expect(scope.title).toEqual('');
        expect(scope.content).toEqual('');

        // Test URL redirection after the table was created
        expect($location.path.calls.mostRecent().args[0]).toBe('tables/' + mockTable._id);
      }));

      it('should set scope.error if save error', function () {
        var errorMessage = 'this is an error message';
        $httpBackend.expectPOST('api/tables', sampleTablePostData).respond(400, {
          message: errorMessage
        });

        scope.create();
        $httpBackend.flush();

        expect(scope.error).toBe(errorMessage);
      });
    });

    describe('$scope.update()', function () {
      beforeEach(function () {
        // Mock table in scope
        scope.table = mockTable;
      });

      it('should update a valid table', inject(function (Tables) {
        // Set PUT response
        $httpBackend.expectPUT(/api\/tables\/([0-9a-fA-F]{24})$/).respond();

        // Run controller functionality
        scope.update();
        $httpBackend.flush();

        // Test URL location to new object
        expect($location.path()).toBe('/tables/' + mockTable._id);
      }));

      it('should set scope.error to error response message', inject(function (Tables) {
        var errorMessage = 'error';
        $httpBackend.expectPUT(/api\/tables\/([0-9a-fA-F]{24})$/).respond(400, {
          message: errorMessage
        });

        scope.update();
        $httpBackend.flush();

        expect(scope.error).toBe(errorMessage);
      }));
    });

    describe('$scope.remove(table)', function () {
      beforeEach(function () {
        // Create new tables array and include the table
        scope.tables = [mockTable, {}];

        // Set expected DELETE response
        $httpBackend.expectDELETE(/api\/tables\/([0-9a-fA-F]{24})$/).respond(204);

        // Run controller functionality
        scope.remove(mockTable);
      });

      it('should send a DELETE request with a valid tableId and remove the table from the scope', inject(function (Tables) {
        expect(scope.tables.length).toBe(1);
      }));
    });

    describe('scope.remove()', function () {
      beforeEach(function () {
        spyOn($location, 'path');
        scope.table = mockTable;

        $httpBackend.expectDELETE(/api\/tables\/([0-9a-fA-F]{24})$/).respond(204);

        scope.remove();
        $httpBackend.flush();
      });

      it('should redirect to tables', function () {
        expect($location.path).toHaveBeenCalledWith('tables');
      });
    });
  });
}());
