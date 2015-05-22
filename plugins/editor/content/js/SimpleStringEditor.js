
/**
 * string editor
 * @param {*} value initial value
 */
function SimpleStringEditor(value) {
  this._dom={
    valField:$("<textarea>",{}).val(value)
  };
}

SimpleStringEditor.prototype=new EditorInterface(undefined);

/**
 * set the value to be displayed in the editor
 * @param {*} value data to be displayed
 */
SimpleStringEditor.prototype.setValue=function setValue(value) {
  this._dom.valField.val(value);
}

/**
 * gives the value currently represented by the editor
 * @return {*} value value represented by the editor
 */
SimpleStringEditor.prototype.getValue=function getValue() {
  return this._dom.valField.val();
}

/**
 * returns the dom node which represents the editor
 * @return {JQuery DOM Node} dom node representing the editor
 */
SimpleStringEditor.prototype.getDom=function getDom() {
  return this._dom.valField;
}

/**
 * sets editor into readonly or read/write mode
 * @param {boolean} readOnly if true readonly is enabled otherwise writing is allowed
 */
SimpleStringEditor.prototype.setReadOnly=function setReadOnly(readOnly) {
  if (readOnly) {
    this._dom.valField.prop('readOnly', true);
  } else {
    this._dom.valField.removeProp('readOnly');
  }
}