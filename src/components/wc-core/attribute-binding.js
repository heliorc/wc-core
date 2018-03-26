
/**
 * @class AttributeBinding
 * @description helpers for using attributes such as "onclick" within templates.
 */
export default (superclass) => class extends superclass {
    constructor(...args) {
        return super(...args);
    }

    connectedCallback() {
        this._clickObserver = new MutationObserver(() => {
            Array.from(this.querySelectorAll('[onclick]')).forEach((el) => {
                if(this[el.getAttribute('onclick')]){
                    el.addEventListener('click', this[el.getAttribute('onclick')].bind(this));
                    el.removeAttribute('onclick');
                }
            });
        });

        this._clickObserver.observe(this, { childList: true });
        super.connectedCallback && super.connectedCallback();
    }

    /**
     * @memberOf AttributeBinding
     * @description Binding a multi-select set of checkboxes / radio button to an attribute'
     * @param controlName
     * @param attribute
     * @param delimiter
     */
    bindMultiSelect(controlName, attribute, delimiter = '|') {
        Array.from(this.querySelectorAll('input[name="' + controlName + '"]')).forEach((o) => o.addEventListener('change', (e) => {
            let valueArray = Array.from(this.querySelectorAll('input[name="' + controlName + '"]:checked')).filter(co => !co.defaultChecked);
            const defaultElement = this.querySelector('input[value=""]');
            defaultElement.checked = !valueArray.length || e.target.defaultChecked;
            let attributeValue = '';
            if (defaultElement.checked) {
                valueArray.forEach(e => e.checked = false);
            } else {
                attributeValue = valueArray.map(co => co.value).join(delimiter);
            }
            this.setAttribute(attribute, attributeValue);
        }, this));
    }
    /**
     * @memberOf AttributeBinding
     * @description Update the value of a multi-select checkbox set.
     * A multi select checkbox is a set of <input type="checkbox"/> with a common name
     * used to provide multiple selection.
     * @param controlName
     * @param values
     */
    multiSelectSet(controlName, values) {
        values = values || [];
        Array.from(this.querySelectorAll('input[name="' + controlName + '"]')).forEach(o => {
            o.checked = (values.indexOf(o.value) > -1);
        });
    }
    /**
     * @memberOf AttributeBinding
     * @description Set a radiobutton to a specific value.
     * A radiobutton is a set of <input type="radio"/> with a common name
     * @param controlName
     * @param value
     */
    radioSet(controlName, value) {
        this.querySelector('input[name="' + controlName + '"][value="' + value + '"]').checked = true;
    }
};