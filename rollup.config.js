import babel from 'rollup-plugin-babel';
import {terser} from 'rollup-plugin-terser';
import resolve from 'rollup-plugin-node-resolve';

/**
 * @external RollupConfig
 * @type {PlainObject}
 * @see {@link https://rollupjs.org/guide/en#big-list-of-options}
 */

/**
 * @param {PlainObject} config
 * @param {"esm"|"umd"} [config.format] Rollup format
 * @param {boolean} [config.minifying] Whether to minify
 * @returns {external:RollupConfig}
 */
function getRollupConfig ({minifying = false, format = 'umd'} = {}) {
  const nonMinified = {
    input: 'src/index-all.js',
    output: {
      file: `dist/jtlt${
        format === 'esm' ? '-esm' : ''
      }${
        minifying ? '.min' : ''
      }.js`,
      format,
      sourcemap: minifying,
      name: 'JTLT'
    },
    plugins: [
      babel({
        exclude: 'node_modules/**'
      }),
      resolve()
    ]
  };
  if (minifying) {
    nonMinified.plugins.push(terser());
  }
  return nonMinified;
}

// eslint-disable-next-line import/no-anonymous-default-export
export default [
  getRollupConfig({format: 'umd'}),
  getRollupConfig({format: 'esm'})
];
