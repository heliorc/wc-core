import StateManager from './state-manager';

export default (() => {
  /**
   * @class wcDefaults
   * @extends HTMLScriptElement
   * @name wc-defaults
   * @description sets state parameter defaults. use the data-prefix on attributes to set the default values.
   * @example
   * <script is="wc-defaults" data-some-key="some-default-value"><script>
   */
  class wcDefaults extends HTMLScriptElement {
    constructor(self) {
      self = super(self);
      return self;
    }
    connectedCallback() {

        let updates = Object.keys(this.dataset).map((key)=>{ // this first reduce is to work around a Safari <10.1 bug
            return [key,this.dataset[key]];
        }).filter(([key, value]) => {
            return !StateManager.getParam(key);
        }).reduce((reducer, [key,value]) => {
            reducer[key] = value;
            return reducer;
        }, {});

      StateManager.set(updates);
     }
  }
  customElements.define('wc-defaults', wcDefaults, {extends: 'script'});
  return wcDefaults;
})();