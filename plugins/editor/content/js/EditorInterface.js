
/**
 * interface for editors
 * @param {*} value initial value
 */
function EditorInterface(value) {}

/**
 * set the value to be displayed in the editor
 * @param {*} value data to be displayed
 */
EditorInterface.prototype.setValue=function setValue(value) {
  throw new Error("not implemented");
}

/**
 * gives the value currently represented by the editor
 * @return {*} value value represented by the editor
 */
EditorInterface.prototype.getValue=function getValue() {
  throw new Error("not implemented");
}

/**
 * if present, changes the mode the editor uses to interpret data
 * @param {string} data mode name
 */
EditorInterface.prototype.setMode=function setMode(data) {
  //if the editor has only 1 mode this can be ignored
};

/**
 * returns the dom node which represents the editor
 * @return {JQuery DOM Node} dom node representing the editor
 */
EditorInterface.prototype.getDom=function getDom() {
  throw new Error("not implemented");
}

/**
 * sets editor into readonly or read/write mode
 * @param {boolean} readOnly if true readonly is enabled otherwise writing is allowed
 */
EditorInterface.prototype.setReadOnly=function setReadOnly(readOnly) {
  throw new Error("not implemented");
}