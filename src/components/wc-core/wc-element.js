import {template, camelCaseString} from '@helio/wc-utils';

export default ((HTMLElement)=> {

  /**
   * @class HTMLElement
   * @memberOf HTMLElement
   * @param tmpl Can be one of 3 things:
   * - a raw template string.
   * - a function that returns a raw template string.
   * - the string name of the html file that is rolled up with the component.
   * @param context the object context to compile against.
   * @returns {String} the compiled HTML with es6 syntax replaced with
   */
  HTMLElement.prototype.$compile = function (tmpl, context) {
    tmpl = tmpl || this.outerHTML;
    const templateFnName = camelCaseString(tmpl.replace(/\.html$/, ''));
    let templateFn = () => tmpl;
    if (this[templateFnName]) {
      templateFn = typeof this[templateFnName] === 'function' ? this[templateFnName] : () => this[templateFnName];
    }
    const target = Object.assign({}, this, context);
    return template(templateFn.call(target), target);
  };

  /**
   * @memberOf HTMLElement
   * @param tmpl
   * @param context
   * @description convenience wrapper function of @link $compile that sets the innerHTML of the element itself.
   */
  HTMLElement.prototype.$render = function (tmpl, context) {
    this.innerHTML = this.$compile(tmpl, context);
  };

})(window.HTMLElement);