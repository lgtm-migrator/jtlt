// Todo: Allow swapping of joining transformer types in
//    mid-transformation (e.g., building strings with
//    string transformer but adding as text node in a DOM transformer)

export class AbstractJoiningTransformer {
  constructor (cfg) {
    // Todo: Might set some reasonable defaults across all classes
    this.setConfig(cfg);
  }

  setConfig (cfg) {
    this._cfg = cfg;
  }

  _requireSameChildren (type, embedType) {
    if (this._cfg[type].requireSameChildren) {
      throw new Error(
        `Cannot embed ${
          embedType
        } children for a ${type} joining transformer.`
      );
    }
  }
  // eslint-disable-next-line promise/prefer-await-to-callbacks
  config (prop, val, cb) {
    const oldCfgProp = this._cfg[prop];
    this._cfg[prop] = val;
    if (cb) {
      cb.call(this);
      this._cfg[prop] = oldCfgProp;
    }
  }
}
