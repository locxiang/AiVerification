/**
 * @description Vue Admin Better 项目配置
 */

const webpackBarName = 'vue-admin-better'
const webpackBanner =
  ' build: vue-admin-better \n vue-admin-better.com \n https://gitee.com/chu1204505056/vue-admin-better \n time: '

/**
 * @description 在控制台打印项目信息
 */
function donationConsole() {
  const chalk = require('chalk')
  // 移除 GitHub 开源地址输出
  // 移除外部推广链接输出

  console.log(
    chalk.green(
      `> 使用中出现任何问题可加QQ群反馈，获取基础版、文档，请我们喝杯咖啡（如若情况不允许，请勿勉强）：https://gitee.com/chu1204505056/vue-admin-better#-%E5%89%8D%E7%AB%AF%E8%AE%A8%E8%AE%BA-qq-%E7%BE%A4`
    )
  )

  console.log(chalk.green(`> 如果您不希望显示以上信息，可在config中配置关闭`))
  console.log('\n')
}

module.exports = {
  webpackBarName,
  webpackBanner,
  donationConsole,
}
