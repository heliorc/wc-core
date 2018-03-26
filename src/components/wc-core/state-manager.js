import {EventMap} from './event-map';
import {toQueryString, toParams, deprecated} from '@helio/wc-utils';
import ConfigManager from './config-manager';


export default (() => {
  /**
   *
   * @class StateManager
   * @description State Parameters values can be set and propagated to consuming components via this static class or through
   * the corresponding wc-defaults element. State Parameters are typically stored in the URL as query string parameters.
   * Although, you can turn that off by setting the 'nourl' value in the @link ConfigManager
   *
   */
  const StateManager = new class {
    constructor() {
      this._base = '#';
      /*
       // let $base = document.querySelector('base');
       // if ($base) {
       //   this._base = '';
       //  }
       */
      this._params = new EventMap();
      let oldUrl   = window.location.href;

      this._validation = {};
      this._parsers    = {};
      this._defaults    = {};

      this._updateParams(toParams(oldUrl));

      document.addEventListener("DOMContentLoaded", () => {
        this._setStateFromUrl(decodeURIComponent(window.location.href));
        window.addEventListener('hashchange', evt => {
          const newUrl = evt.target.location.href;
          if (oldUrl !== newUrl) {
            oldUrl = newUrl;
            this._setStateFromUrl(decodeURIComponent(newUrl));
          }
        });
      });
    }

    _isFn(maybeFn) {
      return typeof maybeFn === 'function';
    }

    //supported validators
    _wrapValidator(validator) {
      if (this._isFn(validator)) {
        return validator;
      }
      if (typeof validator === 'string') {
        validator = new RegExp(`^${validator}$`);
      }
      if (validator instanceof RegExp) {
        return val => validator.test(val);
      }
      if (Array.isArray(validator)) {
        return val => validator.indexOf(val) !== -1;
      }
      console.warn('Validator is not valid. Assuming true for all values.', validator);
      return () => true;
    }

    /**
     * @memberOf ConfigManager
     * @param {Object} paramConfigs
     * @example
     * {
     *   paramName: {
     *     validator: Function(), //<-- the function that will be called to validate the parameter.
     *     // If there is a parser, the parser will be called and the result of the parser will be passed to the validator function
     *     parser: Function(),  //<-- the function that will be called to mutate the value from url string to whatever you want
     *     default: defaultValue //<-- the default that should be returned or set in the state when no other values are present.
     *   }
     *
     */
    addConfig(paramConfigs) {
      Object.entries(paramConfigs)
        .forEach(([param, config]) => {
          if (!this._validation[param]) {
            this._validation[param] = [];
          }

          this._validation[param].push(this._wrapValidator(config.validator));
          this._parsers[param] = config.parser;
          this._defaults[param] = config.default;
        });
      return this._validation;
    }
    /**
     * @memberOf StateManager
     * @param param optional. If you call it with no parameter you will get whatever the entire current state is.
     * @returns {Object} the current value of the requested property name or the whole state object.
     */
    get(param = null) {
      return param ? this._params.get(param) : this._params.getAll();
    }

    /**
     * @memberOf StateManager
     * @param query should be called with an {} query to set multiple values at once.
     */
    set(query) {
      if (arguments.length > 1) {
        return this.setParam.apply(this, arguments);
      }
      const oldState = this.get();
      return new Promise((resolve, reject) => {
        this._validate(query)
          .then(validState => {
            this._updateParams(validState.validParams);
            this._params._notify('set', oldState);
            if (!ConfigManager.get('nourl')) {
              const newStateObj = Object.assign({}, toParams(window.location.href), validState.validParams);
              this._setUrlFromState(newStateObj);
            }
            resolve({validState, query});
          }, (currentState, query) => {
            const error = new RangeError('One or more parameters did not pass validation.', this);
            console.error(error, query, this._validation);
            reject({currentState, query, error});
          }, (result) => reject(result));
      });
    }

    /**
     * @memberOf StateManager
     * @deprecated
     * @param key the state parameter to get
     * @returns the current state value
     */
    getParam(key) {
      return this.get(key);
    }

    /**
     * @memberOf StateManager
     * @param key the state parameter to change
     * @param val the value the state parameter should be set to.
     */
    setParam(key, val) {
      const query = {};
      query[key]  = val;
      this.set(query);
    }

    /**
     * @memberOf StateManager
     * @param callback is the function to execute when any property changes.
     * @returns {{destroy}|*}
     * @description call destroy() on the returned object to remove the event listener.
     */
    onChange(callback) {
      return this._params.on('set', callback);
    }

    /**
     * @memberOf StateManager
     * @param parameterNames the property names to be notified when they mutate
     * @param callback the callback to be executed when any of the propertyNames have changed.
     * @returns {{destroy}|*}
     * @description call destroy() on the returned object to remove the event listener.
     */
    onParamChange(parameterNames, callback) {
      parameterNames = typeof parameterNames === 'string' ? [parameterNames] : parameterNames;
      return this.onChange((event, newState, oldState) => {
        let updates;
        parameterNames.forEach(param => {
          if (newState[param] !== oldState[param]) {
            updates        = updates || {};
            updates[param] = {
              oldValue: oldState[param],
              newValue: newState[param]
            };
          }
        });
        updates && callback(updates, newState, oldState);
      });
    }

    _updateParams(newParams){
      const updates = Object.entries(newParams);
      updates.forEach(([key, val], index) => {
        if (!val || val === "undefined" || val === "null") {
          newParams[key] = '';
        }
        this._params.set(key, val, false);
      });
    }

    _setStateFromUrl(urlString) {
      const newState = toParams(urlString);
      return Promise.resolve().then(() => this.set(Object.assign({}, this._defaults, newState)));
    }

    _setUrlFromState(newState) {
      const urlState = toQueryString(newState, this._base);
      if (urlState !== window.location.hash) {
        window.location.replace(urlState);
      }
    }

    _validate(query) {
      return new Promise((success, error) => {
        const validParams   = {};
        const invalidParams = {};
        const waiting       = [];
        const currentState  = this.get();
        Object.entries(query)
          .forEach(([key, val]) => {
            const parsedVal = this._parsers[key] ? this._parsers[key](val, currentState) : val;
            if (this._validation[key]) {
              this._validation[key].forEach(validator => {
                const result = validator.call(this, parsedVal, currentState);
                waiting.push(Promise.resolve(result)
                  .then((validity) => {
                    if (validity === false) {
                      invalidParams[key] = parsedVal;
                      validParams[key] = this.getParam(key);
                    } else {
                      validParams[key] = parsedVal;
                    }
                    return !!validity;
                  }));
              });
            } else {
              validParams[key] = parsedVal;
              waiting.push(Promise.resolve(true));
            }
          });
        Promise.all(waiting)
          .then(results => {
            const valid = results.indexOf(false) === -1;
            if (valid) {
              return success({validParams});
            } else {
              return error({validParams: validParams, invalidParams: invalidParams});
            }
          });
      });
    }
  }();
  return StateManager;
})();