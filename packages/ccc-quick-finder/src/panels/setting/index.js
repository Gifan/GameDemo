const { ipcRenderer, shell } = require('electron');
const { getUrlParam } = require('../../../utils/browser-utils');
const ConfigManager = require('../../config-manager');
const I18n = require('../../i18n');
const Updater = require('../../updater');

/** 包名 */
const PACKAGE_NAME = require('../../../package.json').name;

/** 语言 */
const LANG = getUrlParam('lang');

/**
 * i18n
 * @param {string} key
 * @returns {string}
 */
const translate = (key) => I18n.translate(LANG, key);

// 应用
const App = {

  /**
   * 数据
   */
  data() {
    return {
      // 多语言文本
      titleLabel: translate('setting'),
      selectLabel: translate('selectKey'),
      selectTooltipLabel: translate('selectKeyTooltip'),
      customLabel: translate('customKey'),
      customPlaceholderLabel: translate('customKeyPlaceholder'),
      customTooltipLabel: translate('customKeyTooltip'),
      autoCheckLabel: translate('autoCheck'),
      autoCheckTooltipLabel: translate('autoCheckTooltip'),
      referenceLabel: translate('reference'),
      acceleratorLabel: translate('accelerator'),
      repositoryLabel: translate('repository'),
      applyLabel: translate('apply'),
      // 预设快捷键
      presets: [
        { key: 'custom', name: translate('customKey') },
        { key: 'F1', name: 'F1' },
        { key: 'F3', name: 'F3' },
        { key: 'F4', name: 'F4' },
        { key: 'F5', name: 'F5' },
        { key: 'F6', name: 'F6' },
        { key: 'CmdOrCtrl+F', name: 'Cmd/Ctrl + F' },
        { key: 'CmdOrCtrl+B', name: 'Cmd/Ctrl + B' },
        { key: 'CmdOrCtrl+Shift+F', name: 'Cmd/Ctrl + Shift + F' },
      ],
      // 选择
      selectKey: 'F1',
      // 自定义
      customKey: '',
      // 自动检查更新
      autoCheckUpdate: false,
    };
  },

  /**
   * 监听器
   */
  watch: {

    /**
     * 选择快捷键
     */
    selectKey(value) {
      if (value !== 'custom') {
        this.customKey = '';
      }
    },

    /**
     * 自定义
     */
    customKey(value) {
      if (value !== '' && this.selectKey !== 'custom') {
        this.selectKey = 'custom';
      }
    },

  },

  /**
   * 实例函数
   */
  methods: {

    /**
     * 应用按钮点击回调
     * @param {*} event 
     */
    onApplyBtnClick(event) {
      // 保存配置
      this.setConfig();
    },

    /**
     * 获取配置
     */
    getConfig() {
      const config = ConfigManager.get();
      if (!config) return;
      // 自动检查更新
      this.autoCheckUpdate = config.autoCheckUpdate;
      // 快捷键
      const presets = this.presets,
        hotkey = config.hotkey;
      // 预设按键
      for (let i = 0, l = presets.length; i < l; i++) {
        if (presets[i].key === hotkey) {
          this.selectKey = hotkey;
          this.customKey = '';
          return;
        }
      }
      // 自定义按键
      this.selectKey = 'custom';
      this.customKey = hotkey;
    },

    /**
     * 保存配置
     */
    setConfig() {
      const config = {
        autoCheckUpdate: this.autoCheckUpdate,
      };
      if (this.selectKey === 'custom') {
        const customKey = this.customKey;
        // 输入是否有效
        if (customKey === '') {
          ipcRenderer.send(`${PACKAGE_NAME}:print`, {
            type: 'warn',
            content: translate('customKeyError'),
          });
          return;
        }
        // 不可以使用双引号（避免 json 值中出现双引号而解析错误，导致插件加载失败）
        if (customKey.includes('"')) {
          this.customKey = this.customKey.replace(/\"/g, '');
          ipcRenderer.send(`${PACKAGE_NAME}:print`, {
            type: 'warn',
            content: translate('quoteError'),
          });
          return;
        }
        config.hotkey = customKey;
      } else {
        config.hotkey = this.selectKey;
      }
      // 保存到本地
      ConfigManager.set(config);
    },

    /**
     * 检查更新
     */
    async checkUpdate() {
      const hasNewVersion = await Updater.check();
      if (hasNewVersion) {
        // 打印到控制台
        ipcRenderer.send(`${PACKAGE_NAME}:print`, {
          type: 'success',
          content: translate('hasNewVersion'),
        });
      }
    },

  },

  /**
   * 生命周期：实例被挂载
   */
  mounted() {
    // 获取配置
    this.getConfig();
    // 覆盖 a 标签点击回调（使用默认浏览器打开网页）
    const links = document.querySelectorAll('a[href]');
    links.forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        const url = link.getAttribute('href');
        shell.openExternal(url);
      });
    });
    // 检查更新
    this.checkUpdate();
  },

  /**
   * 生命周期：实例销毁前
   */
  beforeDestroy() {

  },

};

// 创建实例
const app = Vue.createApp(App);
// 挂载
app.mount('#app');
