import {AbstractJoiningTransformer} from './AbstractJoiningTransformer.js';

export class JSONJoiningTransformer extends AbstractJoiningTransformer {
  constructor (o, cfg) {
    super(cfg);
    this._obj = o || [];
  }
  rawAppend (item) {
    this._obj.push(item);
  }
  append (item) {
    // Todo: allow for first time
    if (!this._obj || typeof this._obj !== 'object') {
      throw new Error('You cannot append to a scalar or empty value.');
    }
    if (Array.isArray(this._obj)) {
      this._obj.push(item);
    } else {
      Object.assign(this._obj, item);
    }
    return this;
  }
  get () {
    return this._obj;
  }
  propValue (prop, val) {
    if (!this._objPropState) {
      throw new Error(
        'propValue() can only be called after an object state has been set up.'
      );
    }
    this._obj[prop] = val;
  }
  /**
  * @callback ObjectHandler
  * @param {PlainObject} obj
  * @returns {JSONJoiningTransformer}
  */
  /**
  * @param {ObjectHandler} cb Callback to be executed on this transformer but
  *   with a context nested within the newly created object
  * @param {Array} usePropertySets Array of string property set names to copy
  *   onto the new object
  * @param {PlainObject<string, string>} propSets An object of key-value pairs
  *   to copy onto the new object
  * @returns {JSONJoiningTransformer}
  */
  object (cb, usePropertySets, propSets) {
    // Todo: Conditionally add as JHTML-based jml (and in subsequent methods
    //   as well)
    const tempObj = this._obj;
    const obj = usePropertySets === undefined
      ? {}
      : usePropertySets.reduce((o, psName) => {
        return this._usePropertySets(o, psName); // Todo: Put in right scope
      }, {});

    if (propSets !== undefined) {
      Object.assign(obj, propSets);
    }

    this.append(obj);
    const oldObjPropState = this._objPropState;
    this._objPropState = true;
    // We pass the object, but user should usually use other methods
    cb.call(this, obj);
    this._obj = tempObj;
    this._objPropState = oldObjPropState;
    return this;
  }
  // eslint-disable-next-line promise/prefer-await-to-callbacks
  array (cb) {
    const tempObj = this._obj;
    const arr = [];
    this.append(arr); // Todo: set current position and deal with children
    // We pass the array, but user should usually use other methods
    cb.call(this, arr);
    this._obj = tempObj;
    return this;
  }
  // eslint-disable-next-line promise/prefer-await-to-callbacks
  string (str, cb) {
    this._requireSameChildren('json', 'string');
    this.append(str);
    return this;
  }
  number (num) {
    this.append(num);
    return this;
  }
  boolean (bool) {
    this.append(bool);
    return this;
  }
  null () {
    this.append(null);
    return this;
  }
  undefined () {
    if (this._cfg.mode !== 'JavaScript') {
      throw new Error(
        'undefined is not allowed unless added in JavaScript mode'
      );
    }
    this.append(undefined);
    return this;
  }
  nonfiniteNumber (num) {
    if (this._cfg.mode !== 'JavaScript') {
      throw new Error(
        'Non-finite numbers are not allowed unless added in JavaScript mode'
      );
    }
    this.append(num);
    return this;
  }
  'function' (func) {
    if (this._cfg.mode !== 'JavaScript') {
      throw new Error(
        'function is not allowed unless added in JavaScript mode'
      );
    }
    this.append(func);
    return this;
  }
  // eslint-disable-next-line promise/prefer-await-to-callbacks
  element (elName, atts, cb) {
    return this;
  }
  attribute (name, val) {
    return this;
  }
  text (txt) {
    return this;
  }
  plainText (str) {
    this.string(str);
    return this;
  }
}
