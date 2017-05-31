import uglify from 'rollup-plugin-uglify';
import typescript from 'rollup-plugin-typescript2';

export default {
  entry: 'src/index.ts',
  dest: 'dist/fetch-middleware.min.js',
  format: 'iife',
  plugins: [
    typescript(),
    uglify()
  ]
}