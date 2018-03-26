import CSSManager from './css-manager.js';
import StateManager from './state-manager.js';
import ConfigManager from './config-manager.js';
const mockState = {
  bodystyle: 'sierra_1500',
  brand: 'gmc',
  carline: 'sierra',
  lang: 'en',
  locale: 'en_US',
  postalcode: '85224',
  region: 'US',
  year: '2017',
  foo: 'bar',
  bad: 'val*ue:omg(76)I\'m a bad string11--1!',
  array: ['is', 'array', 'value'],
};

const listenParams = ['bodystyle', 'brand', 'carline', 'bad', 'array'];


describe('CssManager', ()=>{
  let waitForState;
  beforeEach(()=>{
    waitForState = StateManager.set(mockState);
    ConfigManager.set('stateCss', listenParams.join('|'));
  });
  afterEach(()=>{
    StateManager._params.clear();
    ConfigManager._properties.clear();
  });
  it('should be a singleton instance', ()=>{
    expect(CSSManager instanceof Object).toBe(true);
  });
  describe('constructor', ()=> {
    it('should set up an empty classes array', ()=> {
      expect(CSSManager.classes).toBeDefined();
      expect(CSSManager.classes.length).toEqual(0);
    });
    it('should save a reference to the body', ()=>{
      expect(CSSManager.$body).toBe(window.document.body);
    });
    it ('should call set up a configManager listener', ()=>{
      expect(CSSManager.configListener).toBeDefined();
      expect(CSSManager.configListener.destroy).toBeDefined();
      expect(CSSManager.configListener.destroy).toEqual(jasmine.any(Function));
    });
  });
  describe('When state and config are set', ()=>{
    it('should set the classes on the window body', (done)=> {
      waitForState.then(()=>{
        expect(Array.from(CSSManager.$body.classList)).toEqual(      [
          'bodystyle__sierra_1500',
          'brand__gmc',
          'carline__sierra',
          'bad__val_ue_omg_76_I_m_a_bad_string11__1_',
          'array__is',
          'array__array',
          'array__value'
        ]);
        done();
      });
    });
  });
  describe('_listen', ()=>{
    let destroyed;
    const listener = { destroy: ()=> destroyed = true};

    beforeEach(()=>{
      CSSManager.stateListener = listener;
      CSSManager._listen(listenParams);
    });

    it('should destroy the existing listener', () =>{
      expect(destroyed).toBe(true);
    });

    it('should set up a new listener', () =>{
      expect(CSSManager.stateListener).not.toEqual(listener);
      expect(CSSManager.stateListener.destroy).toBeDefined();
      expect(CSSManager.stateListener.subscriber).toBeDefined();
    });
  });
});
