DebugWindowFileLayout=function(onSaveRequest) {
  DebugWindowLayout.apply(this,[]);

  this.gui={
    layout:undefined,
    activeButtons:[]
  };

  this.gui.editorScreen=debugWindow.gui.elements.div.clone().addClass("editFileScreen");
  var saveButton=debugWindow.gui.elements.button.clone().click(function() {
    onSaveRequest(self);
  }).text("save all");

  var self=this;
  this.gui.layout=debugWindow.gui.elements.div.clone().append([
    this.gui.editorScreen,
    debugWindow.gui.elements.div.clone().addClass("editScreenFooter").append([
      saveButton
    ])
  ]);
  this.gui.activeButtons.push(saveButton);

  this._setupEditors();

  this.setReadOnly(true);
};

DebugWindowFileLayout.prototype=new DebugWindowLayout();

DebugWindowFileLayout.prototype.acceptedTabTypes=[DebugWindowFileTab];

DebugWindowFileLayout.prototype.editorTypes={
  "static":{ mode:"ace/mode/html", editor:"ace" },
  "script":{ mode:"ace/mode/javascript", editor:"ace" },
  "data":{ mode:"json", editor:"json" },
  "text":{ mode:"ace/mode/text", editor:"ace" }
};

DebugWindowFileLayout.prototype._setupEditors=function() {
  this.editors={};

  this.editors.ace=new AceEditorWrapper();
  this.editors.json=new JSONEditor();

  this.setMode("text");
};

DebugWindowFileLayout.prototype.getGUI=function() {
  return this.gui.layout;
}

DebugWindowFileLayout.prototype.display=function(tab) {
  this.reset("loading item");

  //load new tab
  this.activeTab=tab;
  if (this.activeTab!=undefined) {
    var dataLoaded=false;
    var states=[];
    var dataData=undefined;

    var self=this;
    var load=function() {
      if (dataLoaded) {
        if (states.length!=0) {
          self.reset("loading error: \n"+states.join("\n")+"\n"+self.activeTab.getStatusString());
        } else {
          this.setMode("text");
          self.editor.setValue(dataData);
          self.setReadOnly(false);
        }
      }
    };

    this.activeTab.getData(function(data) {
      dataLoaded=true;
      if (data==undefined) {
        states.push("could not load data");
      }
      dataData=data;

      load();
    });
  } else {
    this.reset();
  }
}

DebugWindowFileLayout.prototype.store=function() {
  if (this.activeTab!=undefined) {
    this.activeTab.setData(this._getData());
  }
}

DebugWindowFileLayout.prototype._getData=function() {
  if (this.activeTab) {
    return this.editor.getValue();
  } else {
    throw new Error("no active tab");
  }
};

DebugWindowFileLayout.prototype.reset=function(message) {
  if (message==undefined) { message=""; }
  //store current tab
  this.store();
  this.activeTab=undefined;

  this.setReadOnly(true);

  //clear editor
  this.editor.setValue(message);
}

DebugWindowFileLayout.prototype.setReadOnly=function(readOnly) {
  this.editor.setReadOnly(readOnly);

  $(this.gui.activeButtons).each(function() { this.prop("disabled",readOnly); });
}

DebugWindowFileLayout.prototype.setMode=function(mode) {
  var type=this.editorTypes[mode];
  if (type==undefined) {
    throw new Error("undefined editor mode");
  }

  var editor=this.editors[type.editor];
  if (!editor) {
    throw new Error("editor is not defined");
  }
  if (this.editor) {
    this.editor.getDom().detach();
  }
  this.editor=editor;
  this.gui.editorScreen.append(this.editor.getDom());

  this.editor.setMode(type.mode);

  this.editor.setValue(undefined);
}