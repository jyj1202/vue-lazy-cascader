const { defineConfig } = require('@vue/cli-service')

const isLib = process.env.VUE_APP_BUILD_TARGET === 'lib'

module.exports = defineConfig({
  transpileDependencies: true,
  lintOnSave: 'warning',
  publicPath: '/vue-lazy-cascader/',
  configureWebpack: config => {
    if (isLib) {
      // 只将顶层 element-ui 和 vue 设为 external，其内部模块打包进库
      config.externals = {
        'element-ui': {
          root: 'ELEMENT',
          commonjs: 'element-ui',
          commonjs2: 'element-ui',
          amd: 'element-ui'
        }
      }
      config.output = {
        ...config.output,
        libraryExport: 'default'
      }
    }
  }
})
