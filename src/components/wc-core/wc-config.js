import ConfigManager from './config-manager';

/*
 * TODO: if you need to export a bumch of different components,
 * TODO: this class and exports below can be removed from the file
 * TODO: along with the other non-js files in this folder
 */
/**
 * @class wcConfig
 * @extends HTMLScriptElement
 * @name wc-config
 * @description sets config property defaults. use the data-prefix on attributes to set the default values.
 * @example
 * <script is="wc-config" data-some-config="some-default-value"><script>
 */
const wcConfig = (() => {
  class config extends HTMLScriptElement {

    constructor(self) {
      self = super(self);
      return self;
    }

    connectedCallback() {
      ConfigManager.set(
        Object.keys(this.dataset)
          .reduce((accu, key) => {
            accu[key] = this.dataset[key];
            return accu;
          }, {})
      );
    }
  }
  customElements.define('wc-config', config, {extends: 'script'});
  return config;
})();
export default wcConfig;