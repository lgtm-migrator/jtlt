/* globals require, module */
'use strict';

// eslint-disable-next-line no-var
var JTLT;

function runTest (expected, templates, replace) {
  return new Promise((resolve, reject) => {
    const config = {
      ajaxData: 'data/jsonpath-sample.json',
      outputType: 'string', // string is default
      templates: [
        { // We could instead try a root template which applied on the author path
          name: 'scalars',
          path: '$..*@scalar()',
          template () {}
        }
      ],
      success (result) {
        expect(expected).to.deepEqual(result);
        resolve();
      }
    };
    if (replace) {
      config.templates[0] = templates.shift();
    }
    templates.forEach(function (template) {
      config.templates.push(template);
    });
    try {
      JTLT(config);
    } catch (e) {
      alert(e);
    }
  });
}
if (typeof exports !== 'undefined') {
  JTLT = require('../src/index');
}

describe('testBasic', function () {
  it('should support the simple array-based template format', function () {
    const expected = '<b>Nigel Rees</b><b>Evelyn Waugh</b><b>Herman Melville</b><b>J. R. R. Tolkien</b>';
    return runTest(expected, [
      ['$.store.book[*].author', function (author) {
        return '<b>' + author + '</b>';
      }]
    ]);
    // Could just do return runTest(expected, ['$.store.book[*].author', author => '<b>' + author + '</b>']); but may want to use `this`
  });
  it('should be able to use valueOf to get current context', function () {
    const expected = '<b>Nigel Rees</b><b>Evelyn Waugh</b><b>Herman Melville</b><b>J. R. R. Tolkien</b>';
    return runTest(expected, [{
      name: 'author', // For use with calling templates
      path: '$.store.book[*].author',
      template () {
        this.string('<b>');
        this.valueOf({select: '.'});
        this.string('</b>');
      }
    }]);
  });
  it('should be able to utilize argument to template', function () {
    const expected = '<b>Nigel Rees</b><b>Evelyn Waugh</b><b>Herman Melville</b><b>J. R. R. Tolkien</b>';
    return runTest(expected, [{
      name: 'author', // For use with calling templates
      path: '$.store.book[*].author',
      template (author) {
        this.string('<b>' + author + '</b>');
      }
    }]);
  });
  it('should be able to provide return value from template', function () {
    const expected = '<b>Nigel Rees</b><b>Evelyn Waugh</b><b>Herman Melville</b><b>J. R. R. Tolkien</b>';
    return runTest(expected, [{
      name: 'author', // For use with calling templates
      path: '$.store.book[*].author',
      template (author) {
        return '<b>' + author + '</b>';
      }
    }]);
  });
  it('should be able to use a root template calling applyTemplates with a select path', function () {
    const expected = '<b>Nigel Rees</b><b>Evelyn Waugh</b><b>Herman Melville</b><b>J. R. R. Tolkien</b>';
    return runTest(expected, [
      ['$', function (value, cfg) {
        this.applyTemplates('$.store.book[*].author', cfg.mode);
      }], ['$.store.book[*].author', function (author) {
        return '<b>' + author + '</b>';
      }]
    ], true);
  });
  it('should support multiple child templates', function () {
    const expected = '<b>Nigel Rees</b><u>8.95</u><b>Evelyn Waugh</b><u>12.99</u><b>Herman Melville</b><u>8.99</u><b>J. R. R. Tolkien</b><u>22.99</u>';
    return runTest(expected, [{
      name: 'author', // For use with calling templates
      path: '$.store.book[*].author',
      template (author) {
        return '<b>' + author + '</b>';
      }
    }, {
      name: 'price', // For use with calling templates
      path: '$.store.book[*].price',
      template (price) {
        return '<u>' + price + '</u>';
      }
    }]);
  });
  it('should support nested templates', function () {
    const expected = '<i><b>Nigel Rees</b><u>8.95</u></i><i><b>Evelyn Waugh</b><u>12.99</u></i><i><b>Herman Melville</b><u>8.99</u></i><i><b>J. R. R. Tolkien</b><u>22.99</u></i>';
    return runTest(expected, [{
      name: 'book', // For use with calling templates
      path: '$.store.book[*]',
      template (book) {
        this.string('<i>');
        this.applyTemplates();
        this.string('</i>');
      }
    }, {
      name: 'author', // For use with calling templates
      path: '$.store.book[*].author',
      template (author) {
        return '<b>' + author + '</b>';
      }
    }, {
      name: 'price', // For use with calling templates
      path: '$.store.book[*].price',
      template (price) {
        return '<u>' + price + '</u>';
      }
    }]);
  });
});
