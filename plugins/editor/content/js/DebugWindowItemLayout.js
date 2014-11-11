DebugWindowItemLayout=function() {
  DebugWindowLayout.apply(this,[]);

  this.activeTab=undefined;

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
  var saveButton=debugWindow.gui.elements.button.clone().click(function() { self._saveActiveItem(); }).text("save all");

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
  
  this._setupEditor();

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
};

DebugWindowItemLayout.prototype=new DebugWindowLayout();

DebugWindowItemLayout.prototype.acceptedTabTypes=[DebugWindowTab];

DebugWindowItemLayout.prototype.editorTypes={
  "static":{ mode:"ace/mode/html" },
  "script":{ mode:"ace/mode/javascript" },
  "data":{ mode:"ace/mode/json" },
  "text":{ mode:"ace/mode/text" }
};

DebugWindowItemLayout.prototype._setupEditor=function() {
  this.editor=ace.edit(this.gui.editorScreen[0]);
  this.editor.setTheme("ace/theme/kr_theme");
  
  this.editor.getSession().setTabSize(2);
  this.editor.getSession().setUseSoftTabs(true);
  this.editor.getSession().setUseWrapMode(false);
  this.editor.setHighlightActiveLine(false);
  this.editor.setValue("");
  this.editor.setReadOnly(true);
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
          self.reset("loading error: \n"+states.join("\n")+"\n"+self.activeTab.getStatusString());
        } else {
          var mode=self.editorTypes[headerData.type].mode;
          if (mode==undefined) {
            mode="ace/mode/text";
          }
          
          self.editor.getSession().setMode(mode);
          self.editor.setValue(dataData,-1);
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

DebugWindowItemLayout.prototype.acceptsTab=function(tab) {
  if (tab==undefined) { return true; }

  for (var i in this.acceptedTabTypes) {
    if (tab instanceof this.acceptedTabTypes[i]) {
      return true;
    }
  }
  return false;
}

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
  this.editor.getSession().setMode("ace/mode/text");
  this.editor.setValue(message,-1);
  this.editor.getSession().getUndoManager().markClean();
}

DebugWindowItemLayout.prototype.setReadOnly=function(readOnly) {
  this.editor.setReadOnly(readOnly);

  for (var i in editorAPI.headerColumns) {
    this.gui.header.values[editorAPI.headerColumns[i]].prop("disabled",readOnly);
  }

  $(this.gui.activeButtons).each(function() { this.prop("disabled",readOnly); });
}

DebugWindowItemLayout.prototype._saveActiveItem=function() {
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
