import { EventMap } from './event-map';


export default (()=> {
  /**
   *
   * @class ConfigManager
   * @description Configuration values can be set and propagated to consuming components via this static class or through
   * the corresponding wc-config element
   *
   */
  const ConfigManager = new class {
    constructor() {
      this._properties = new EventMap();
    }

    /**
     * @memberOf ConfigManager
     * @param key
     * @returns {Object} the current value of the requested property name.
     */
    get(key) {
      return key ? this._properties.get(key) : this._properties.getAll();
    }

    /**
     * @memberOf ConfigManager
     * @param key the name of the value to set. can also be called with an {} query to set multiple values at once.
     * @param value the value of the property to set it to.
     */
    set(key, value) {
      let query = key;
      if (value) {
        //we have a single value
        query = {};
        query[key] = value;
      }
      this._properties.replace(Object.assign({}, this._properties.getAll(), query));
    }

    /**
     * @memberOf ConfigManager
     * @param callback is the function to execute when any property changes.
     * @returns {{destroy}|*}
     * @description call destroy() on the returned object to remove the event listener.
     */
    onChange(callback) {
      return this._properties.on('set', callback);
    }

    /**
     * @memberOf ConfigManager
     * @param propertyNames the property names to be notified when they mutate
     * @param callback the callback to be executed when any of the propertyNames have changed.
     * @returns {{destroy}|*}
     * @description call destroy() on the returned object to remove the event listener.
     */
    onPropertyChange(propertyNames, callback) {
      propertyNames = typeof (propertyNames) === 'string' ? [propertyNames] : propertyNames;
      return this.onChange((event, newConfig, oldConfig) => {
        let updates;
        propertyNames.forEach(property => {
          if (newConfig[property] !== oldConfig[property]) {
            updates = updates || {};
            updates[property] = {
              oldValue: oldConfig[property],
              newValue: newConfig[property]
            };
          }
        });
        updates && callback(updates, newConfig, oldConfig);
      });
    }
  };
  return ConfigManager;
})();