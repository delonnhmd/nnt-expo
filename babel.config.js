// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Keep aliases for "@/..." imports. Use the short plugin name "module-resolver".
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
          },
          extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        },
      ],
      // Reanimated plugin must be last if you use reanimated
      'react-native-reanimated/plugin',
    ],
    // If you previously added any custom "unstable_transformImportMeta" flag, remove it now.
  };
};
