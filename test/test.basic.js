/* eslint-disable no-console */
import {JTLT} from '../src/index.js';
import {StringJoiningTransformer} from '../src/StringJoiningTransformer.js';

let deepEqual, expected;

// Todo:
/**
* @typedef {} JTLTTemplates
*/

/**
* @callback DoneCallback
* @returns {void}
*/
/**
 *
 * @param {JTLTTemplates[]} templates
 * @param {DoneCallback} done
 * @param {boolean} replace
 * @returns {void}
 */
function runTest (templates, done, replace) {
  const config = {
    ajaxData: 'data/jsonpath-sample.json',
    joiningTransformerClass: StringJoiningTransformer, // string is default
    templates: [
      { // We could instead try a root template which applied on the author path
        name: 'scalars',
        path: '$..*@scalar()',
        template () { /* */ }
      }
    ],
    success (result) {
      deepEqual(expected, result);
      done();
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
    console.log(e);
  }
}

export const testBasic = {
  'should support the simple array-based template format' (done) {
    // test.expect(1);

    expected =
      '<b>Nigel Rees</b><b>Evelyn Waugh</b><b>Herman Melville</b>' +
        '<b>J. R. R. Tolkien</b>';

    runTest([
      ['$.store.book[*].author', (author) => {
        return '<b>' + author + '</b>';
      }]
    ], done);
    // Could just do:
    // runTest(['$.store.book[*].author', author => '<b>' + author + '</b>']);
    // ... but may want to use `this`
  },
  'should be able to use valueOf to get current context' (done) {
    expected =
      '<b>Nigel Rees</b><b>Evelyn Waugh</b><b>Herman Melville</b>' +
        '<b>J. R. R. Tolkien</b>';

    runTest([{
      name: 'author', // For use with calling templates
      path: '$.store.book[*].author',
      template () {
        this.string('<b>');
        this.valueOf({select: '.'});
        this.string('</b>');
      }
    }], done);
  },
  'should be able to utilize argument to template' (done) {
    expected =
      '<b>Nigel Rees</b><b>Evelyn Waugh</b><b>Herman Melville</b>' +
        '<b>J. R. R. Tolkien</b>';

    runTest([{
      name: 'author', // For use with calling templates
      path: '$.store.book[*].author',
      template (author) {
        this.string('<b>' + author + '</b>');
      }
    }], done);
  },
  'should be able to provide return value from template' (done) {
    expected =
      '<b>Nigel Rees</b><b>Evelyn Waugh</b><b>Herman Melville</b>' +
        '<b>J. R. R. Tolkien</b>';

    runTest([{
      name: 'author', // For use with calling templates
      path: '$.store.book[*].author',
      template (author) {
        return '<b>' + author + '</b>';
      }
    }], done);
  },
  // eslint-disable-next-line max-len
  'should be able to use a root template calling applyTemplates with a select path' (done) {
    expected =
      '<b>Nigel Rees</b><b>Evelyn Waugh</b><b>Herman Melville</b>' +
        '<b>J. R. R. Tolkien</b>';

    runTest([
      ['$', function (value, cfg) {
        this.applyTemplates('$.store.book[*].author', cfg.mode);
      }], ['$.store.book[*].author', function (author) {
        return '<b>' + author + '</b>';
      }]
    ], done, true);
  },
  'should support multiple child templates' (done) {
    expected = '<b>Nigel Rees</b><u>8.95</u><b>Evelyn Waugh</b><u>12.99</u>' +
      '<b>Herman Melville</b><u>8.99</u><b>J. R. R. Tolkien</b><u>22.99</u>';

    runTest([{
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
    }], done);
  },
  'should support nested templates' (done) {
    expected =
      '<i><b>Nigel Rees</b><u>8.95</u></i><i><b>Evelyn Waugh</b>' +
        '<u>12.99</u></i><i><b>Herman Melville</b><u>8.99</u></i>' +
          '<i><b>J. R. R. Tolkien</b><u>22.99</u></i>';

    runTest([{
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
    }], done);
  }
};
