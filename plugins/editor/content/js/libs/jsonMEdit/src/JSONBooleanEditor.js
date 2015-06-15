
/**
 * Editor for json booleans
 * @class
 * @implements {IEditor}
 * @mixes {EventHandler}
 * @param {*} value initial value
 * @param {string} classPrefix css class prefix for dom elements
 */
function JSONBooleanEditor(value,classPrefix) {
  EventHandler.apply(this,[this]);

  if (classPrefix===undefined) {
    this._classPrefix="";
  } else {
    this._classPrefix=classPrefix;
  }

  var self=this;

  this._dom={};
  this._dom.buttons={
    "true":$("<span>",{
      text:"true",
      "class":this._classPrefix+"boolEditButton",
      click:function() {
        if (!self._readOnly) {
          self.setValue(true);
        }
      }
    }),
    "false": $("<span>",{
      text:"false",
      "class":this._classPrefix+"boolEditButton",
      click:function() {
        if (!self._readOnly) {
          self.setValue(false);
        }
      }
    })
  };

  this._dom.valField=$("<div>",{
    html:[
      this._dom.buttons["true"],
      this._dom.buttons["false"]
    ]
  });

  this.setReadOnly(false);

  this.setValue(value);
}

JSONBooleanEditor.prototype=new IEditor();
ClassHelper.$merge(JSONBooleanEditor,EventHandler);

/**
 * set the value to be displayed in the editor
 * @param {*} value data to be displayed
 */
JSONBooleanEditor.prototype.setValue=function setValue(value) {
  this._undefined=(value===undefined);

  if (this._undefined) {
    this.setReadOnly(true);
    this._value=value;

    this._dom.buttons["true"].removeClass(this._classPrefix+"boolEditButtonActive");
    this._dom.buttons["false"].addClass(this._classPrefix+"boolEditButtonActive");
  } else {
    if (typeof value!="boolean") {
      throw new Error("value is no boolean");
    }

    this._value=value;

    if (this._value) {
      this._dom.buttons["true"].addClass(this._classPrefix+"boolEditButtonActive");
      this._dom.buttons["false"].removeClass(this._classPrefix+"boolEditButtonActive");
    } else {
      this._dom.buttons["true"].removeClass(this._classPrefix+"boolEditButtonActive");
      this._dom.buttons["false"].addClass(this._classPrefix+"boolEditButtonActive");
    }
    this.setReadOnly(false);
  }

  this.trigger(this);
}

/**
 * get the value currently represented in the editor or undefined if not in a valid state
 * @return {boolean|undefined} value value represented in the editor
 */
JSONBooleanEditor.prototype.getValue=function getValue() {
  if (!this._undefined) {
    return this._value;
  } else {
    return undefined;
  }
}

/**
 * determine if the editor is in a valid state
 * @return {Boolean} true if the editor is in a valid state, false otherwise
 */
JSONBooleanEditor.prototype.hasValidState=function hasValidState() {
  return (!this._undefined);
}

/**
 * get the dom node which contains the editor
 * @return {JQueryDOMNode} dom node representing the editor
 */
JSONBooleanEditor.prototype.getDom=function getDom() {
  return this._dom.valField;
}

/**
 * set the editor into readonly or read/write mode
 * @param {boolean} readOnly if true readonly is enabled otherwise writing is allowed
 */
JSONBooleanEditor.prototype.setReadOnly=function setReadOnly(readOnly) {
  this._readOnly=readOnly;
}