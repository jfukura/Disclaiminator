var assert = require('assert');
var app = require('js/app.js');
// TODO: Write test suite
// Tests:
//  - Can get the disclaimers.xml
//  - Can upload a json file
//  - Can modify views?
//  - Can download

describe('Array', function() {
  describe('#indexOf()', function() {
    it('should return -1 when the value is not present', function() {
      assert.equal(-1, [1,2,3].indexOf(4));
    });
  });
});

describe('Name', function() {
  describe('Mine', function() {
    it('should be Jason', function() {
      assert.equal('Jason', 'Jason');
    });
  });
});