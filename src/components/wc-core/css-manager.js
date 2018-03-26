import StateManager from './state-manager.js';
import ConfigManager from './config-manager.js';

export default (() => {
  const CSSManager = new class {
    constructor(){
      this.classes = [];
      this.$body = window.document.body;
      this.configListener = ConfigManager.onPropertyChange('stateCss', (changes) => {
        const stateCssChanges = changes.stateCss;
        this._listen(stateCssChanges.newValue.split('|'));
      });
    }

    _listen(observedParams) {
      this.stateListener && this.stateListener.destroy();
      this.stateListener = StateManager.onParamChange(observedParams, (changes, newState)=> {
        this._setBodyClasses(observedParams.reduce((reducer, param)=> {
          reducer[param] = newState[param];
          return reducer;
        }, {}));
      });
    }

    _setBodyClasses(newState){
      this.classes.forEach((c)=> {
        this.$body.classList.remove(c);
      });
      this.classes.length = 0;
      Object.entries(newState).forEach(([k, item]) =>{
        if (item){
          if (!Array.isArray(item)) {
            item = [item];
          }
          item.forEach((v)=>{
            const cssClass = this._toSafeCSSClass(`${k}--${v}`);
            this.$body.classList.add(cssClass);
            this.classes.push(cssClass);
          });
        }
      });
    }

    _toSafeCSSClass (unsafeString) {
      return unsafeString.replace(/\W/g, '_');
    }

  };
  return CSSManager;
})();