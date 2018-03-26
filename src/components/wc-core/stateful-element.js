import {deprecated} from '@helio/wc-utils';
import StateManager from './state-manager';

/**
 * @mixin StatefulElement
 * @description Applied to HTMLElement subclasses registered as Custom Elements, this mixin
 * provides the functionality to bi-directionally synchronize an elements
 * attributes with the page's URL State, as represented in the url fragment.
 * Attributes to attach to state are identified by a static stateAttributes property,
 * which will default to the observedAttributes provided by the Web Component.

 * Call initState() before initializing dom that varies on state, and before beginning to emit state.
 * This allows "default" state to be set as attributes on the element, while url supplied state can override
 *
 * TODO: Back button handling...
 */
export default superclass => class extends superclass {
    constructor(self) {
        self = super(self);
        deprecated('StatefulElement', 'StateManager.onParamChange');
        return self;
    }
    /**
     * @memberOf StatefulElement
     * Define the attributes to be emitted as state. If this is not overriden, the default
     * is to emit all observedAttributes
     */
    static get stateAttributes() {
        return super.stateAttributes || super.observedAttributes;
    }

    static get observedAttributes() {
        let observed = super.observedAttributes || [];
        let stateAttrs = (super.stateAttributes || []).filter(x => observed.indexOf(x) < 0);
        return observed.concat(stateAttrs);
    }

    get stateNamespace() {
        return super.stateNamespace || '';
    }

    get arrayDelimeter() {
        return super.arrayDelimeter || '|';
    }

    get fqnStateAttributes() {
        if (!this.constructor.stateAttributes) return [];
        return this.constructor.stateAttributes.map(attr => {
            let stateVal = this._getStateAttribute(attr);
            let defaultVal = this.getAttribute(attr);
            if (!stateVal && defaultVal) {
                this._setStateAttribute(attr, defaultVal);
            }
            return `${this.stateNamespace}${attr}`;
        });
    }

    _updateState() {
        this.fqnStateAttributes.forEach(attr => {
            let currentVal = this.getAttribute(attr);
            let stateVal = this._getStateAttribute(attr);
            if (stateVal !== currentVal) {
                stateVal ? this.setAttribute(attr, stateVal) : this.removeAttribute(attr);
            }
        });
    }

    connectedCallback() {
        this._stateListener = StateManager.onParamChange(this.fqnStateAttributes, () => this._updateState());
        super.connectedCallback && super.connectedCallback();
    }

    disconnectedCallback() {
        super.disconnectedCallback && super.disconnectedCallback();
        this._stateListener.destroy();
    }
    /**
     * @memberOf StatefulElement
     * [Custom Elements]Called when an attribute is changed, appended, removed, or replaced on the element. Only called for observed attributes.
     *
     */
    attributeChangedCallback(attributeName, oldValue, newValue, namespace) {
        if (!this._stateListener) return;
        let stateIndex = this.constructor.stateAttributes.indexOf(attributeName);
        if (newValue && stateIndex > -1 && this._getStateAttribute(attributeName) !== newValue) {
            this._setStateAttribute(attributeName, newValue);
        }
        if (super.attributeChangedCallback) {
            let observedAttrs = this.constructor.observedAttributes;
            let observedIndex = observedAttrs && observedAttrs.indexOf(attributeName);
            if (observedIndex > -1) {
                super.attributeChangedCallback(attributeName, oldValue, newValue, namespace);
            }
        }
    }
    /**
     * @memberOf StatefulElement
     * @param oldDocument, newDocument
     * @description Called when the element is adopted into a new document
     */
    adoptedCallback(oldDocument, newDocument) {
        super.adoptedCallback && super.adoptedCallback(oldDocument, newDocument);
    }

    _getStateAttribute(attribute) {
        let val = StateManager.getParam(`${this.stateNamespace}${attribute}`);
        if (Array.isArray(val)) val = val.join(this.arrayDelimeter);
        return val || '';
    }

    _setStateAttribute(attribute, val) {
        let parts = val.split(this.arrayDelimeter);
        val = parts.length > 1 ? parts : parts[0];
        StateManager.setParam(`${this.stateNamespace}${attribute}`, val);
    }
};
