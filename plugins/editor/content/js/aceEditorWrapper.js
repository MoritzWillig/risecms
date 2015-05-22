
function AceEditorWrapper() {
  this._dom=$("<div>",{
     style:"height:100%"
  });

  this._ace=ace.edit(this._dom[0]);
  this._ace.setTheme("ace/theme/kr_theme");

  this._ace.getSession().setTabSize(2);
  this._ace.getSession().setUseSoftTabs(true);
  this._ace.getSession().setUseWrapMode(false);
  this._ace.setHighlightActiveLine(false);

  this.setValue("");
  this.setReadOnly(true);
}

AceEditorWrapper.prototype.getDom=function getDom() {
  return this._dom;
}

AceEditorWrapper.prototype.setValue=function setValue(value) {
  this._ace.setValue(value,-1);
};

AceEditorWrapper.prototype.getValue=function getValue() {
  return this._ace.getValue();
};

AceEditorWrapper.prototype.setReadOnly=function setReadOnly(readOnly) {
  this._ace.setReadOnly(readOnly);
}

AceEditorWrapper.prototype.setMode=function setMode(data) {
  if ((data!=undefined) && (typeof data!="string")) {
    throw new Error("invalid mode value type");
  }

  var mode;
  if (data==undefined) {
    mode="ace/mode/text";
  } else {
    mode=data;
  }

  this._ace.getSession().setMode(mode);
  this._ace.getSession().getUndoManager().markClean();
};