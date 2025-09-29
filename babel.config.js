module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['@babel/plugin-transform-runtime'],
      ['module-resolver', {
        root: ['./src'],
        alias: { '@': './src' }
      }]
    ],
    env: {
      production: {
        plugins: [['transform-remove-console', { exclude: ['error', 'warn'] }]]
      }
    }
  };
};