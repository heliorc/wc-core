/**
 * @class EventMap
 * @description provides an event bus for when properties of the map change.
 */
export class EventMap {
  constructor() {
    this._map         = new Map();
    this._subscribers = {
      clear: [],
      'delete': [],
      set: [],
    };
    this._cache = {};
  }

  _notify(event, oldState) {
    this._subscribers[event].forEach(sub => sub(event, this._cache, oldState));
  }

  _updateCache() {
    const params = {};
    this._map.forEach((val, key) => params[key] = val);
    this._cache = params;
  }

  /**
   * @memberOf EventMap
   * @param {String} event 'set'= after the property has been set
   * @param {Function} callback notification channel
   */
  on(event, callback, notify) {
    if (!this._subscribers[event]) {
      this._subscribers[event] = [];
    }
    this._subscribers[event].push(callback);
    const subs = this._subscribers[event];

    callback && callback('set', this._cache, {});
    return {
      subscriber: callback,
      event: event,
      destroy: () => {
        subs.splice(subs.indexOf(callback), 1);
      }
    };
  }

  /**
   * @memberOf EventMap
   * @param {String} key
   * @param {Object|Array} val
   * @param {Boolean} notify. set false to NOT notify subscribers.
   */
  set(key, val, notify) {
    let proceed;
    if(Array.isArray(val)){
      //this might need to be a better algorithm, this should work for now.
      proceed = JSON.stringify(val) !== JSON.stringify(this._cache[key]);
    } else {
      proceed = val !== this._cache[key];
    }
    if (proceed){
      this._map.set(key, val);
      if (notify !== false) {
        this._notify('set', this._cache);
      }
      this._updateCache();
    }
    return this;
  }

  /**
   * @memberOf EventMap
   * @param {Object} keyValuePairs
   * @param {Boolean} notify. set false to NOT notify subscribers.
   */
  replace(keyValuePairs, notify) {
    const oldState = Object.assign({}, this._cache);
    Object.keys(oldState)
      .forEach((oldKey) => this.set(oldKey, keyValuePairs[oldKey], false));
    Object.keys(keyValuePairs)
      .forEach((newKey) => this.set(newKey, keyValuePairs[newKey], false));
    if (notify !== false) {
      this._notify('set', oldState);
    }
    return this;
  }

  /**
   * @memberOf EventMap
   * @param {*} key
   * @param {Boolean} notify. set false to NOT notify subscribers.
   */
  del(key, notify) {
    if (this._cache[key]) {
      this._map['delete'](key);
      if (notify !== false) {
        this._notify('delete', this._cache);
      }
      this._updateCache();
    }
    return this;
  }

  /**
   * @memberOf EventMap
   * @param {Boolean} notify. set false to NOT notify subscribers.
   */
  clear(notify) {
    const oldState = this.getAll();
    this._map.clear();
    if (notify !== false) {
      this._notify('clear', oldState);
    }
    return this;
  }

  /**
   * @memberOf EventMap
   * @returns object hash of all the key value pairs.
   */
  getAll() {
    return this._cache;
  }

  get(key) { return this._map.get(key); }
  entries() { return this._map.entries(); }
  forEach(callback) { return this._map.forEach(callback); }
  keys() { return this._map.keys(); }
  values() { return this._map.values(); }
}