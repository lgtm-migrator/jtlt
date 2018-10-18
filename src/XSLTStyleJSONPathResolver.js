import {JSONPath} from 'jsonpath-plus';

export class XSLTStyleJSONPathResolver {
  // eslint-disable-next-line class-methods-use-this
  getPriorityBySpecificity (path) {
    if (typeof path === 'string') {
      path = JSONPath.toPathArray(path);
    }

    const terminal = path.slice(-1)[0];
    if (terminal.match(/^(?:\*|~|@[a-z]*?\(\))$/iu)) { // *, ~, @string() (comparable to XSLT's *, @*, and node tests, respectively)
      return -0.5;
    }
    // eslint-disable-next-line unicorn/no-unsafe-regex
    if (terminal.match(/^(?:\.+|\[.*?\])$/u)) { // ., .., [] or [()] or [(?)] (comparable to XSLT's /, //, or [], respectively)
      return 0.5;
    }
    // single name (i.e., $..someName or someName if allowing such
    //   relative paths) (comparable to XSLT's identifying a particular
    //   element or attribute name)
    return 0;
  }
}
