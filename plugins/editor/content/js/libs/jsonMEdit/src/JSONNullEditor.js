
/**
 * Editor for json null objects
 * @class
 * @implements {IEditor}
 * @mixes {EventHandler}
 * @param {*} value initial value
 * @param {string} classPrefix css class prefix for dom elements
 */
function JSONNullEditor(value,classPrefix) {
  EventHandler.apply(this,[this]);

  if (classPrefix===undefined) {
    this._classPrefix="";
  } else {
    this._classPrefix=classPrefix;
  }

  this._dom=$();

  this.setValue(value);
}

JSONNullEditor.prototype=new IEditor();
ClassHelper.$merge(JSONNullEditor,EventHandler);

/**
 * set the value to be displayed in the editor
 * @param {*} value data to be displayed
 */
JSONNullEditor.prototype.setValue=function setValue(value) {
  this._undefined=(value===undefined);

  if (this._undefined) {
    this.setReadOnly(true);
    this.trigger(this);
  } else {
    if (value!==null) {
      this.setValue(undefined);
    } else {
      this.setReadOnly(false);
      this.trigger(this);
    }
  }
}

/**
 * get the value currently represented in the editor or undefined if not in a valid state
 * @return {null|undefined} value value represented in the editor
 */
JSONNullEditor.prototype.getValue=function getValue() {
  if (!this._undefined) {
    return null;
  } else {
    return undefined;
  }
}

/**
 * determine if the editor is in a valid state
 * @return {Boolean} true if the editor is in a valid state, false otherwise
 */
JSONNullEditor.prototype.hasValidState=function hasValidState() {
  return (!this._undefined);
}

/**
 * get the dom node which contains the editor
 * @return {JQueryDOMNode} dom node representing the editor
 */
JSONNullEditor.prototype.getDom=function getDom() {
  return this._dom;
}

/**
 * set the editor into readonly or read/write mode
 * @param {boolean} readOnly if true readonly is enabled otherwise writing is allowed
 */
JSONNullEditor.prototype.setReadOnly=function setReadOnly(readOnly) {
  //we are always readonly do nothing
}