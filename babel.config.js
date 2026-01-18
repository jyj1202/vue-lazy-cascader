module.exports = {
  presets: [
    [
      '@vue/cli-plugin-babel/preset',
      {
        useBuiltIns: process.env.VUE_APP_BUILD_TARGET === 'lib' ? false : 'entry',
        corejs: 3
      }
    ]
  ]
}
