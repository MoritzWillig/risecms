DebugWindowFileLayout=function() {
  DebugWindowLayout.apply(this,[]);

  this.activeTab=undefined;

  this.gui={
    layout:undefined,
    activeButtons:[]
  };

  this.gui.editorScreen=debugWindow.gui.elements.div.clone().addClass("editFileScreen");
  var saveButton=debugWindow.gui.elements.button.clone().click(function() { self._saveActiveItem(); }).text("save all");

  var self=this;
  this.gui.layout=debugWindow.gui.elements.div.clone().append([
    this.gui.editorScreen,
    debugWindow.gui.elements.div.clone().addClass("editScreenFooter").append([
      saveButton
    ])
  ]);
  this.gui.activeButtons.push(saveButton);
  
  this._setupEditor();
};

DebugWindowFileLayout.prototype=new DebugWindowLayout();

DebugWindowFileLayout.prototype.acceptedTabTypes=[DebugWindowFileTab];

DebugWindowFileLayout.prototype.editorTypes={
  "static":{ mode:"ace/mode/html" },
  "script":{ mode:"ace/mode/javascript" },
  "data":{ mode:"ace/mode/json" },
  "text":{ mode:"ace/mode/text" }
};

DebugWindowFileLayout.prototype._setupEditor=function() {
  this.editor=ace.edit(this.gui.editorScreen[0]);
  this.editor.setTheme("ace/theme/kr_theme");

  this.editor.getSession().setTabSize(2);
  this.editor.getSession().setUseSoftTabs(true);
  this.editor.getSession().setUseWrapMode(false);
  this.editor.setHighlightActiveLine(false);
  this.editor.setValue("");
  this.editor.setReadOnly(true);
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
          var mode=self.editorTypes["text"].mode;
          if (mode==undefined) {
            mode="ace/mode/text";
          }
          
          self.editor.getSession().setMode(mode);
          self.editor.setValue(dataData,-1);
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

DebugWindowFileLayout.prototype.acceptsTab=function(tab) {
  if (tab==undefined) { return true; }

  for (var i in this.acceptedTabTypes) {
    if (tab instanceof this.acceptedTabTypes[i]) {
      return true;
    }
  }
  return false;
}

DebugWindowFileLayout.prototype.reset=function(message) {
  if (message==undefined) { message=""; }
  //store current tab
  this.store();
  this.activeTab=undefined;

  this.setReadOnly(true);

  //clear editor
  this.editor.getSession().setMode("ace/mode/text");
  this.editor.setValue(message,-1);
  this.editor.getSession().getUndoManager().markClean();
}

DebugWindowFileLayout.prototype.setReadOnly=function(readOnly) {
  this.editor.setReadOnly(readOnly);

  $(this.gui.activeButtons).each(function() { this.prop("disabled",readOnly); });
}

DebugWindowFileLayout.prototype._saveActiveItem=function() {
  if (this.activeTab) {
    this.store();
    this.activeTab.save(function(status) {
      if (status!=undefined) {
        display("error saving item: "+status);
      } else {
        display("saved item");
      }
    });
  } else {
    throw new Error("no active tab");
  }
}
