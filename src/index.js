import getJSON from 'simple-get-json';
// Todo: This should really be dynamically imported only as needed
import {XSLTStyleJSONPathResolver} from './XSLTStyleJSONPathResolver.js';
// Todo: This should really be dynamically imported only as needed
import {JSONPathTransformer} from './JSONPathTransformer.js';

// Todo: Avoid Git URLs in dependencies? Can use latest npm for them now?
// Todo: Add `test` script using my `simple-test`?

// function l (str) { console.log(str); }
// function s (o) { l(JSON.stringify(o)); }

/*
// Todo: Update API and move to own Node entrance file
// eslint-disable-next-line no-native-reassign, max-len
document = require('jsdom').jsdom('');
// eslint-disable-next-line no-native-reassign, max-len
window = document.parentWindow;
*/

/**
* For templates/queries, one may choose among config.query,
  config.template, or config.templates, but one must be
  present and of valid type. For the source json, one must use
  either a valid config.ajaxData or config.data parameter.
* @param {Object} config Options
* @param {Function} config.success A callback supplied with a single
  argument that is the result of this instance's transform() method.
* @param {Array} [config.templates] An array of template objects
* @param {Object|function} [config.template] A function assumed to be a
  root template or a single, complete template object
* @param {Function} [config.query] A function assumed to be a root template
* @param {Array} [config.forQuery] An array with arguments to be supplied
  to a single call to `forEach` (and which will serve as the root
  template)
* @param {Object} [config.data] A JSON object
* @param {string} [config.ajaxData] URL of a JSON file to retrieve for
  evaluation
* @param {boolean} [config.errorOnEqualPriority=false] Whether or not to
  report an error when equal priority templates are found
* @param {boolean} [config.autostart=true] Whether to begin transform()
  immediately.
* @param {boolean} [config.preventEval=false] Whether to prevent
  parenthetical evaluations in JSONPath. Safer if relying on user
  input, but reduces capabilities of JSONPath.
* @param {string} [config.mode=''] The mode in which to begin the transform.
* @param {function} [config.engine=JSONPathTransformer] Will be based the
  same config as passed to this instance. Defaults to a transforming
  function based on JSONPath and with its own set of priorities for
  processing templates.
* @param {Function}
* [config.specificityPriorityResolver=
*   XSLTStyleJSONPathResolver.getPriorityBySpecificity]
  Callback for getting the priority by specificity
* @param {Object} [config.joiningTransformer=StringJoiningTransformer] Can
  be a singleton or class instance. Defaults to string joining for output
  transformation.
* @param {Function} [config.joiningTransformer.get=StringJoiningTransformer.get]
*   Required method if object provided. Defaults to string joining getter.
* @param {Function}
*   [config.joiningTransformer.append=StringJoiningTransformer.append] Required
*   method if object provided. Defaults to string joining appender.
* @param {Object}
*   [config.joiningConfig={string: {}, json: {}, dom: {}, jamilih: {}}]
*   Config to pass on to the joining transformer
* @returns {JTLT} A JTLT instance object
* @todo Remove JSONPath dependency in query use of '$'?
*/
export class JTLT {
  constructor (config) {
    this.setDefaults(config);
    const that = this;
    if (this.config.ajaxData) {
      // Can't use async form in constructor
      getJSON(this.config.ajaxData, function (json) {
        that.config.data = json;
        that._autoStart(config.mode);
      });
      return this;
    }
    if (this.config.data === undefined) {
      throw new Error('You must supply either config.ajaxData or config.data');
    }
    this._autoStart(config.mode);
  }
  _createJoiningTransformer () {
    // We could return to allowing "string" (default), "dom", or "json"
    //   `outputType` and determine the class accordingly with `import()`
    //   at runtime
    const JT = this.config.joiningTransformerClass;
    return new JT(/* this.config.data, */
      undefined,
      this.config.joiningConfig || {
        string: {}, json: {}, dom: {}, jamilih: {}
      }
    );
  }
  _autoStart (mode) {
    // We wait to set this default as we want to pass in the data
    this.config.joiningTransformer = this.config.joiningTransformer ||
      this._createJoiningTransformer();

    if (this.config.autostart === false) {
      return;
    }

    this.transform(mode);
  }
  setDefaults (config) {
    this.config = config || {};
    ({config} = this);
    const query = config.forQuery
      ? function () {
        this.forEach([...config.forQuery]);
      }
      : config.query || (
        typeof config.templates === 'function'
          ? config.templates
          : typeof config.template === 'function' ? config.template : null
      );
    this.config.templates = query
      ? [
        {name: 'root', path: '$', template: query}
      ]
      : config.templates || [config.template];
    this.config.errorOnEqualPriority = config.errorOnEqualPriority || false;
    this.config.engine = this.config.engine || ((cfg) => {
      const jpt = new JSONPathTransformer(cfg);
      return jpt.transform(cfg.mode);
    });
    // Todo: Let's also, unlike XSLT and the following, give options for
    //   higher priority to absolute fixed paths over recursive descent
    //   and priority to longer paths and lower to wildcard terminal points
    this.config.specificityPriorityResolver =
      this.config.specificityPriorityResolver || (() => {
        const xsjpr = new XSLTStyleJSONPathResolver();
        return function (path) {
          xsjpr.getPriorityBySpecificity(path);
        };
      })();
    return this;
  }
  /**
  * @param {string} mode The mode of the transformation
  * @returns {Any} Result of transformation
  * @todo Allow for a success callback in case the jsonpath code is modified
       to work asynchronously (as with queries to access remote JSON
       stores)
  */
  transform (mode) {
    if (this.config.data === undefined) {
      if (this.config.ajaxData === undefined) {
        throw new Error(`You must supply a 'data' or 'ajaxData' property`);
      }
      throw new Error('You must wait until the ajax file is retrieved');
    }
    if (typeof this.config.success !== 'function') {
      throw new TypeError(`You must supply a 'success' callback`);
    }

    this.config.mode = mode;
    const ret = this.config.success(this.config.engine(this.config));
    return ret;
  }
}
