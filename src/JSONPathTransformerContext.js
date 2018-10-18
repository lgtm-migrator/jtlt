import {JSONPath} from 'jsonpath-plus';
import {JSONPathTransformer} from './JSONPathTransformer.js';

export class JSONPathTransformerContext {
  constructor (config, templates) {
    this._config = config;
    this._templates = templates;
    this._contextObj = this._origObj = config.data;
    this._parent = config.parent || this._config;
    this._parentProperty = config.parentProperty || 'data';
    this.vars = {};
    this.propertySets = {};
    this.keys = {};
  }
  _triggerEqualPriorityError () {
    if (this._config.errorOnEqualPriority) {
      throw new Error(
        'You have configured `JSONPathTransformer` to throw errors on ' +
          'finding templates of equal priority and these have been found.'
      );
    }
  }

  _getJoiningTransformer () {
    return this._config.joiningTransformer;
  }

  appendOutput (item) {
    this._getJoiningTransformer().append(item);
    return this;
  }
  getOutput () {
    return this._getJoiningTransformer().get();
  }

  // `Get()` and `set()` are provided as a convenience method for templates,
  //   but it should typically not be used (use valueOf or the copy methods
  //   to add to the result tree instead)
  get (select, wrap) {
    if (select) {
      return JSONPath({
        path: select,
        json: this._contextObj,
        preventEval: this._config.preventEval,
        wrap: wrap || false,
        returnType: 'value'
      });
    }
    return this._contextObj;
  }

  set (v) {
    this._parent[this._parentProperty] = v;
    return this;
  }

  /**
  * @typedef {PlainObject} SelectObject
  * @property {string} select
  * @property {"JavaScript"|string} mode
  */

  /**
  * @typedef {PlainObject} SortObject
  * @todo
  * @ignore
  */
  /**
  * @callback SortCallback
  * @todo
  * @ignore
  */
  /**
   *
   * @param {SelectObject|string} select
   * @param {"JavaScript"|string} mode
   * @param {SortCallback|SortObject} sort
   * @returns {JSONPathTransformerContext}
   * @todo implement sort (allow as callback or as object)
   */
  applyTemplates (select, mode, sort) {
    const that = this;
    if (select && typeof select === 'object') {
      ({mode, select} = select);
    }
    if (!this._initialized) {
      select = select || '$';
      this._currPath = '$';
      this._initialized = true;
    } else {
      select = select || '*';
    }
    select = JSONPathTransformer.makeJSONPathAbsolute(select);
    /* const results = */ this._getJoiningTransformer();
    const modeMatchedTemplates = this._templates.filter((templateObj) => {
      return ((mode && mode === templateObj.mode) ||
        (!mode && !templateObj.mode));
    });
    // s(select);
    // s(this._contextObj);
    JSONPath({
      path: select,
      resultType: 'all',
      wrap: false,
      json: this._contextObj,
      preventEval: this._config.preventEval,
      callback (o /* {value, parent, parentProperty, path} */) {
        const {value, parent, parentProperty, path} = o;
        // Todo: For remote JSON stores, could optimize this to first get
        //    template paths and cache by template (and then query
        //    the remote JSON and transform as results arrive)
        // s(value + '::' + parent + '::' + parentProperty + '::' + path);
        const _oldPath = that._currPath;
        // eslint-disable-next-line unicorn/no-unsafe-regex
        that._currPath += path.replace(/^\$/u, '');
        // Todo: Normalize templateObj.path's
        const pathMatchedTemplates = modeMatchedTemplates.filter(
          function (templateObj) {
            const queryResult = JSONPath({
              path: JSONPathTransformer.makeJSONPathAbsolute(templateObj.path),
              json: that._origObj,
              resultType: 'path',
              preventEval: that._config.preventEval,
              wrap: true
            });
            // s(queryResult);
            // s('currPath:'+that._currPath);
            return queryResult.includes(that._currPath);
          }
        );

        let templateObj;
        if (!pathMatchedTemplates.length) {
          const dtr = JSONPathTransformer.DefaultTemplateRules;
          // Default rules in XSLT, although expressible as different
          //   kind of paths, are really about result types, so we check
          //   the resulting value more than the select expression
          if (select.endsWith('~')) {
            templateObj = dtr.transformPropertyNames;
          } else if (Array.isArray(value)) {
            templateObj = dtr.transformArrays;
          } else if (value && typeof value === 'object') {
            templateObj = dtr.transformObjects;
          // Todo: provide parameters to jsonpath based on config on
          //    whether to allow non-JSON JS results
          } else if (value && typeof value === 'function') {
            templateObj = dtr.transformFunctions;
          } else {
            templateObj = dtr.transformScalars;
          }
          /*
          Todo: If Jamilih support Jamilih, could add equivalents more like XSL,
          including processing-instruction(), comment(), and namespace
          nodes (whose default templates do not add to the result tree in
          XSLT) as well as elements, attributes, text nodes (see
          http://lenzconsulting.com/how-xslt-works/#built-in_template_rules )
          */
        } else {
          // Todo: Could perform this first and cache by template
          pathMatchedTemplates.sort(function (a, b) {
            const aPriority = typeof a.priority === 'number'
              ? a.priority
              : that._config.specificityPriorityResolver(a.path);
            const bPriority = typeof b.priority === 'number'
              ? b.priority
              : that._config.specificityPriorityResolver(a.path);

            if (aPriority === bPriority) {
              that._triggerEqualPriorityError();
            }

            // We want equal conditions to go in favor of the later (b)
            return (aPriority > bPriority) ? -1 : 1;
          });

          templateObj = pathMatchedTemplates.shift();
        }

        that._contextObj = value;
        that._parent = parent;
        that._parentProperty = parentProperty;

        const ret = templateObj.template.call(
          that, value, {mode, parent, parentProperty}
        );
        if (typeof ret !== 'undefined') {
          // Will vary by that._config.joiningTransformerClass
          that._getJoiningTransformer().append(ret);
        }

        // Child templates may have changed the context
        that._contextObj = value;
        that._parent = parent;
        that._parentProperty = parentProperty;
        that._currPath = _oldPath;
      }
    });
    return this;
  }
  callTemplate (name, withParams) {
    withParams = withParams || [];
    const paramValues = withParams.map(function (withParam) {
      return withParam.value || this.get(withParam.select);
    });
    const results = this._getJoiningTransformer();
    if (name && typeof name === 'object') {
      withParams = name.withParam || withParams;
      ({name} = name);
    }
    const templateObj = this._templates.find(function (template) {
      return template.name === name;
    });
    if (!templateObj) {
      throw new Error(
        `Template, ${name}, cannot be called as it was not found.`
      );
    }

    const result = templateObj.template.apply(this, paramValues);
    results.append(result);
    return this;
  }

  // Todo: Implement sort (allow as callback or as object)
  // Todo: If making changes in return values, be sure to
  //    update `forQuery` as well
  forEach (select, cb, sort) {
    const that = this;
    JSONPath({
      path: select,
      json: this._contextObj,
      preventEval: this._config.preventEval,
      wrap: false,
      returnType: 'value',
      callback (value) {
        cb.call(that, value);
      }
    });
    return this;
  }
  valueOf (select) {
    const results = this._getJoiningTransformer();
    const result = (select && typeof select === 'object' &&
      select.select === '.')
      ? this._contextObj
      : this.get(select);
    results.append(result);
    return this;
  }

  copyOf (select) { // Deep
    return this;
  }

  copy (propertySets) { // Shallow
    return this;
  }

  variable (name, select) {
    this.vars[name] = this.get(select);
    return this;
  }

  // eslint-disable-next-line class-methods-use-this
  message (json) {
    console.log(json); // eslint-disable-line no-console
  }

  // Todo: Add other methods from the joining transformers
  // eslint-disable-next-line promise/prefer-await-to-callbacks
  string (str, cb) {
    this._getJoiningTransformer().string(str, cb);
    return this;
  }

  object (cb, usePropertySets, propSets) {
    this._getJoiningTransformer().object(cb, usePropertySets, propSets);
    return this;
  }

  // eslint-disable-next-line promise/prefer-await-to-callbacks
  array (cb) {
    this._getJoiningTransformer().array(cb);
    return this;
  }

  propertySet (name, propertySetObj, usePropertySets) {
    this.propertySets[name] = usePropertySets
      ? {
        ...propertySetObj,
        ...usePropertySets.reduce((obj, psName) => {
          return this._usePropertySets(obj, psName);
        }, {})
      }
      : propertySetObj;
    return this;
  }

  _usePropertySets (obj, name) {
    return Object.assign(obj, this.propertySets[name]);
  }

  getKey (name, value) {
    const key = this.keys[name];
    const matches = this.get(key.match, true);
    for (const p in matches) { // For objects or arrays
      if ({}.hasOwnProperty.call(matches, p)) {
        if (matches[p] && typeof matches[p] === 'object' &&
          matches[p][key.use] === value
        ) {
          return matches[p];
        }
      }
    }
    return this;
  }
  key (name, match, use) {
    this.keys[name] = {match, use};
    return this;
  }
}
