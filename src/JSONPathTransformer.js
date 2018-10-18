import {JSONPathTransformerContext} from './JSONPathTransformerContext.js';
/**
* @param {boolean} config.errorOnEqualPriority
*/
export class JSONPathTransformer {
  constructor (config) {
    const map = {};
    this._config = config;
    this.rootTemplates = [];
    this.templates = config.templates;
    this.templates = this.templates.map(function (template) {
      if (Array.isArray(template)) {
        // Todo: We could allow a third argument (at beginning or
        //    end?) to represent template name
        return {path: template[0], template: template[1]};
      }
      return template;
    });
    this.templates.forEach((template, i, templates) => {
      if (template.name && map[template.name]) {
        throw new Error('Templates must all have different names.');
      }
      map[template.name] = true;
      if (template.path === '$') {
        this.rootTemplates = this.rootTemplates.concat(templates.splice(i, 1));
      }
    });
  }
  _triggerEqualPriorityError () {
    if (this._config.errorOnEqualPriority) {
      throw new Error(
        'You have configured JSONPathTransformer to throw errors on ' +
          'finding templates of equal priority and these have been found.'
      );
    }
  }

  transform (mode) {
    const jte = new JSONPathTransformerContext(this._config, this.templates);
    const len = this.rootTemplates.length;
    const templateObj = len
      ? this.rootTemplates.pop()
      : JSONPathTransformer.DefaultTemplateRules.transformRoot;
    if (len > 1) {
      this._triggerEqualPriorityError();
    }
    const ret = templateObj.template.call(jte, undefined, {mode});
    if (typeof ret !== 'undefined') {
      // Will vary by jte._config.joiningTransformerClass
      jte._getJoiningTransformer().append(ret);
    }
    const result = jte.getOutput();
    return result;
  }
}
/**
* @private
* @static
* @param {string[]} select
* @returns {string}
*/
JSONPathTransformer.makeJSONPathAbsolute = function (select) {
  // See todo in JSONPath to avoid need for '$' (but may still need to add ".")
  return select[0] !== '$'
    ? ((select[0] === '[' ? '$' : '$.') + select)
    : select;
};

// To-do: Express as JSONPath expressions?
JSONPathTransformer.DefaultTemplateRules = {
  transformRoot: {
    template (value, cfg) {
      this.applyTemplates(null, cfg.mode);
    }
  },
  transformPropertyNames: {
    template () {
      this.valueOf({select: '.'});
    }
  },
  transformObjects: {
    template (value, cfg) {
      this.applyTemplates(null, cfg.mode);
    }
  },
  transformArrays: {
    template (value, cfg) {
      this.applyTemplates(null, cfg.mode);
    }
  },
  transformScalars: {
    template () {
      this.valueOf({select: '.'});
    }
  },
  transformFunctions: {
    template () {
      this.valueOf({select: '.'})();
    }
  }
};
