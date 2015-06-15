
/**
 * Editor for json numbers
 * @class
 * @implements {IEditor}
 * @mixes {EventHandler}
 * @param {*} value initial value
 * @param {string} classPrefix css class prefix for dom elements
 */
function JSONNumberEditor(value,classPrefix) {
  EventHandler.apply(this,[this]);

  if (classPrefix===undefined) {
    this._classPrefix="";
  } else {
    this._classPrefix=classPrefix;
  }

  var self=this;
  this._dom={
    valField:$("<textarea>",{
      "class":this._classPrefix+"JSONNumberEditor"
    }).change(function() {
      self._checkTextarea();
    })
  };

  this.setValue(value);
}

JSONNumberEditor.prototype=new IEditor();
ClassHelper.$merge(JSONNumberEditor,EventHandler);

/**
 * modify the textarea whether or not an invalid value is entered
 * @private
 */
JSONNumberEditor.prototype._checkTextarea=function _checkTextarea() {
  if (this.getValue()===undefined) {
    this._dom.valField.css("background-color","#a20").css("color","#fff");
  } else {
    this._dom.valField.css("background-color","").css("color","");
  }
}

/**
 * test if the value is a number
 * @private
 * @param  {*}  value value to be tested
 * @return {Boolean}       wether or not the value is a number
 */
JSONNumberEditor.prototype._isValid=function _isValid(value) {
  return (typeof value=="number");
}

/**
 * parse a value to a number
 * @private
 * @param  {*} value value to be parsed
 * @return {number/undefined}       the parsed number or undefined on error
 */
JSONNumberEditor.prototype._parseNumber=function _parseNumber(value) {
  var val;
  try {
    val=JSON.parse(value);
  } catch(e) {}
  return val;
}

/**
 * set the value to be displayed in the editor
 * @param {*} value data to be displayed
 */
JSONNumberEditor.prototype.setValue=function setValue(value) {
  this._undefined=(value===undefined);
  if (this._undefined) {
    this.setReadOnly(true);
    this._dom.valField.val("");
  } else {
    this._dom.valField.val(value);
    this._checkTextarea();
    this.setReadOnly(false);
  }

  this.trigger(this);
}

/**
 * get the value currently represented in the editor or undefined if not in a valid state
 * @return {number|undefined} value value represented in the editor
 */
JSONNumberEditor.prototype.getValue=function getValue() {
  var val=this._dom.valField.val();
  var num=this._parseNumber(val);
  if ((!this._undefined) && (this._isValid(num))) {
    return num;
  } else {
    return undefined;
  }
}

/**
 * determine if the editor is in a valid state
 * @return {Boolean} true if the editor is in a valid state, false otherwise
 */
JSONNumberEditor.prototype.hasValidState=function hasValidState() {
  return (!this._undefined);
}

/**
 * get the dom node which contains the editor
 * @return {JQueryDOMNode} dom node representing the editor
 */
JSONNumberEditor.prototype.getDom=function getDom() {
  return this._dom.valField;
}

/**
 * set the editor into readonly or read/write mode
 * @param {boolean} readOnly if true readonly is enabled otherwise writing is allowed
 */
JSONNumberEditor.prototype.setReadOnly=function setReadOnly(readOnly) {
  if (readOnly) {
    this._dom.valField.prop('readOnly', true);
  } else {
    this._dom.valField.removeProp('readOnly');
  }
}
