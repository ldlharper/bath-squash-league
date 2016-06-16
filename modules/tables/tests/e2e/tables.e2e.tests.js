'use strict';

describe('Tables E2E Tests:', function () {
  describe('Test tables page', function () {
    it('Should report missing credentials', function () {
      browser.get('http://localhost:3000/tables');
      expect(element.all(by.repeater('table in tables')).count()).toEqual(0);
    });
  });
});
