import {JHTML} from 'jhtml';
import {AbstractJoiningTransformer} from './AbstractJoiningTransformer.js';

/**
* This transformer expects the templates to do their own DOM building.
*/
export class DOMJoiningTransformer extends AbstractJoiningTransformer {
  constructor (o, cfg) {
    super(cfg);
    this._dom = o || document.createDocumentFragment();
  }
  rawAppend (item) {
    this._dom.append(item);
  }

  append (item) {
    this._dom.append(item);
  }
  get () {
    return this._dom;
  }
  // eslint-disable-next-line class-methods-use-this
  propValue (prop, val) {
    // Todo?
  }
  object (cb, usePropertySets, propSets) {
    this._requireSameChildren('dom', 'object');
    if (this._cfg.JHTMLForJSON) {
      this.append(JHTML());
    } else {
      // Todo: set current position and deal with children
      this.append('');
    }
    return this;
  }
  // eslint-disable-next-line promise/prefer-await-to-callbacks
  array (cb) {
    this._requireSameChildren('dom', 'array');
    if (this._cfg.JHTMLForJSON) {
      this.append(JHTML());
    } else {
      // Todo: set current position and deal with children
      this.append('');
    }
    return this;
  }
  // eslint-disable-next-line promise/prefer-await-to-callbacks
  string (str, cb) {
    // Todo: Conditionally add as JHTML (and in subsequent methods as well)
    this.append(str);
    return this;
  }
  number (num) {
    this.append(num.toString());
    return this;
  }
  boolean (bool) {
    this.append(bool ? 'true' : 'false');
    return this;
  }
  null () {
    this.append('null');
    return this;
  }

  undefined () {
    if (this._cfg.mode !== 'JavaScript') {
      throw new Error(
        'undefined is not allowed unless added in JavaScript mode'
      );
    }
    this.append('undefined');
    return this;
  }
  nonfiniteNumber (num) {
    if (this._cfg.mode !== 'JavaScript') {
      throw new Error(
        'Non-finite numbers are not allowed unless added in JavaScript mode'
      );
    }
    this.append(num.toString());
    return this;
  }
  'function' (func) {
    if (this._cfg.mode !== 'JavaScript') {
      throw new Error(
        'function is not allowed unless added in JavaScript mode'
      );
    }
    this.append(func.toString());
    return this;
  }
  // eslint-disable-next-line promise/prefer-await-to-callbacks
  element (elName, atts, cb) {
    // Todo: allow third argument to be array following Jamilih
    //   (also let "atts" follow Jamilih)
    // Todo: allow for cfg to produce Jamilih DOM output or hXML
    // Todo: allow separate XML DOM one with XML String and
    //    hXML conversions (HTML to XHTML is inevitably safe?)

    const el = document.createElement(elName);
    for (const att in atts) {
      if ({}.hasOwnProperty.call(atts, att)) {
        el.setAttribute(att, atts[att]);
      }
    }
    this.append(el);

    const oldDOM = this._dom;

    this._dom = el;
    cb.call(this);
    this._dom = oldDOM;

    return this;
  }
  attribute (name, val) {
    if (!this._dom || typeof this._dom !== 'object' ||
      this._dom.nodeType !== 1
    ) {
      throw new Error('You may only set an attribute on an element');
    }
    this._dom.setAttribute(name, val);
    return this;
  }
  text (txt) {
    this.append(document.createTextNode(txt));
    return this;
  }
  plainText (str) {
    this.text(str);
    return this;
  }
}
