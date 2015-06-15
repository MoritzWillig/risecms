
/**
 * Interface for editors
 * @interface
 * @extends {Interface}
 * @implements {IEventHandler}
 * @param {*} value initial value
 */
function IEditor(value) {}

IEditor.prototype=new Interface();
IEditor.prototype.$include(IEventHandler);

/**
 * set the value to be displayed in the editor
 * @param {*} value data to be displayed
 */
IEditor.prototype.setValue=Interface.IfcFunc(function setValue(value) {
  throw new InterfaceError("not implemented");
});

/**
 * get the value currently represented in the editor or undefined if not in a valid state
 * @return {*|undefined} value value represented in the editor
 */
IEditor.prototype.getValue=Interface.IfcFunc(function getValue() {
  throw new InterfaceError("not implemented");
});

/**
 * change the mode the editor uses to interpret data
 * @optional
 * @param {string} mode mode name
 */
IEditor.prototype.setMode=Interface.IfcFunc(function setMode(mode) {
  //if the editor has only 1 mode this can be ignored
},true);

/**
 * get the dom node which contains the editor
 * @return {JQueryDOMNode} dom node representing the editor
 */
IEditor.prototype.getDom=Interface.IfcFunc(function getDom() {
  throw new InterfaceError("not implemented");
});

/**
 * set the editor into readonly or read/write mode
 * @param {boolean} readOnly if true readonly is enabled otherwise writing is allowed
 */
IEditor.prototype.setReadOnly=Interface.IfcFunc(function setReadOnly(readOnly) {
  throw new InterfaceError("not implemented");
});

/**
 * determine if the editor is in a valid state
 * @return {Boolean} true if the editor is in a valid state, false otherwise
 */
IEditor.prototype.hasValidState=Interface.IfcFunc(function hasValidState() {
  throw new InterfaceError("not implemented");
});
