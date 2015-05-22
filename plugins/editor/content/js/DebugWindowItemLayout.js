DebugWindowItemLayout=function(onSaveRequest) {
  DebugWindowLayout.apply(this,[]);

  this.gui={
    header:{
      headerNames:undefined,
      headerValues:undefined,
      values:{} //inputs by header field name
    },
    layout:undefined,
    activeButtons:[]
  };

  this.gui.header.headerNames=debugWindow.gui.elements.tr.clone().addClass("editScreenTitleDesc");
  this.gui.header.headerValues=debugWindow.gui.elements.tr.clone();
  this.gui.editorScreen=debugWindow.gui.elements.div.clone().addClass("editScreen");
  var saveButton=debugWindow.gui.elements.button.clone().click(function() {
    onSaveRequest(self);
  }).text("save all");

  var self=this;
  this.gui.layout=debugWindow.gui.elements.div.clone().append([
    debugWindow.gui.elements.div.clone().addClass("editScreenHeaderWrapper").append(
      debugWindow.gui.elements.table.clone().addClass("editScreenHeader").append([
        this.gui.header.headerNames,
        this.gui.header.headerValues
      ])
    ),
    this.gui.editorScreen,
    debugWindow.gui.elements.div.clone().addClass("editScreenFooter").append([
      //this.gui.elements.button.clone().click(function() { self.saveCurrent(true,false); }).text("save content"),
      //this.gui.elements.button.clone().click(function() { self.saveCurrent(false,true); }).text("save header"),
      saveButton
    ])
  ]);
  this.gui.activeButtons.push(saveButton);

  for (var i in editorAPI.headerColumns) {
    this.gui.header.values[editorAPI.headerColumns[i]]=debugWindow.gui.elements.input.clone()
      .addClass("editScreenHead").text("").prop("disabled",!editorAPI.headerEditable[i]);

    this.gui.header.headerNames.append(
      debugWindow.gui.elements.td.clone().text(editorAPI.headerColumns[i])
    );
    this.gui.header.headerValues.append(
      debugWindow.gui.elements.td.clone().append(
        this.gui.header.values[editorAPI.headerColumns[i]]
      )
    );
  }

  this._setupEditors();

  this.setReadOnly(true);
};

DebugWindowItemLayout.prototype=new DebugWindowLayout();

DebugWindowItemLayout.prototype.acceptedTabTypes=[DebugWindowTab];

DebugWindowItemLayout.prototype.editorTypes={
  "static":{ mode:"ace/mode/html", editor:"ace" },
  "script":{ mode:"ace/mode/javascript", editor:"ace" },
  "data":{ mode:undefined, editor:"json" },
  "text":{ mode:"ace/mode/text", editor:"ace" }
};

DebugWindowItemLayout.prototype._setupEditors=function() {
  this.editors={};

  this.editors.ace=new AceEditorWrapper();
  this.editors.json=new JSONEditor();

  this.setMode("text");
};

DebugWindowItemLayout.prototype.getGUI=function() {
  return this.gui.layout;
}

DebugWindowItemLayout.prototype.display=function(tab) {
  this.reset("loading item");

  //load new tab
  this.activeTab=tab;
  if (this.activeTab!=undefined) {
    var dataLoaded=false;
    var headerLoaded=false;
    var states=[];
    var dataData=undefined;
    var headerData=undefined;

    var self=this;
    var load=function() {
      if (dataLoaded && headerLoaded) {
        if (states.length!=0) {
          self.setMode("text");
          self.reset("loading error: \n"+states.join("\n")+"\n"+self.activeTab.getStatusString());
        } else {
          var jsonTypes=["data","branch"];

          if ((self.activeTab._cache) && (jsonTypes.indexOf(self.activeTab._cache.header.type)!=-1)) {
            self.setMode("data");
          } else {
            self.setMode("text");
          }

          self.editor.setValue(dataData);
          self.setReadOnly(false);

          for (var i in editorAPI.headerColumns) {
            self.gui.header.values[editorAPI.headerColumns[i]].val(headerData[editorAPI.headerColumns[i]]);
            self.gui.header.values[editorAPI.headerColumns[i]].attr("disabled",!editorAPI.headerEditable[i]);
          }
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
    this.activeTab.getHeader(function(header) {
      headerLoaded=true;
      if (header==undefined) {
        states.push("could not load header");
      }
      headerData=header;

      load();
    });
  } else {
    this.reset();
  }
}

DebugWindowItemLayout.prototype.store=function() {
  if (this.activeTab!=undefined) {
    this.activeTab.setData(this._getData());
    this.activeTab.setHeader(this._getHeader());
  }
}

DebugWindowItemLayout.prototype._getData=function() {
  if (this.activeTab) {
    return this.editor.getValue();
  } else {
    throw new Error("no active tab");
  }
};

DebugWindowItemLayout.prototype._getHeader=function() {
  if (this.activeTab) {
    var header={};

    for (var i in editorAPI.headerColumns) {
      header[editorAPI.headerColumns[i]]=this.gui.header.values[editorAPI.headerColumns[i]].val();
    }

    return header;
  } else {
    throw new Error("no active tab");
  }
};

DebugWindowItemLayout.prototype.reset=function(message) {
  if (message==undefined) { message=""; }
  //store current tab
  this.store();
  this.activeTab=undefined;

  this.setReadOnly(true);

  //clear header
  for (var i in editorAPI.headerColumns) {
    this.gui.header.values[editorAPI.headerColumns[i]].val("");
  }

  //clear editor
  this.editor.setValue(message);
}

DebugWindowItemLayout.prototype.setReadOnly=function(readOnly) {
  this.editor.setReadOnly(readOnly);

  for (var i in editorAPI.headerColumns) {
    this.gui.header.values[editorAPI.headerColumns[i]].prop("disabled",readOnly);
  }
  $(this.gui.activeButtons).each(function() { this.prop("disabled",readOnly); });
}

DebugWindowItemLayout.prototype.setMode=function(mode) {
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