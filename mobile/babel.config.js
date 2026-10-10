module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [['module-resolver', { alias: { '@core': '../client/src/lib' } }]],
};
