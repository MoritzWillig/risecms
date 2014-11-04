
debugWindow={
  _visible:false,
  _headerEnabled:[false,true     ,true  ,true  ,true      ,true   ,true    ,true  ,false    ],

  _contentRoot:{
    type:"directory",
    fullPath:"/",
    sub:[],
    gui:undefined
  },
  _itemList:{},

  //TODO: add function to clone gui elements
  gui:{
    elements:{},
    background:undefined,
    window:undefined,
    header:{
      headerNames:undefined,
      headerValues:undefined,
      values:{}
    }
  },
  activeTab:undefined,
  
  _setup:function() {
    var self=this;

    //build gui structure
    this.gui.elements.div=$(document.createElement("div"));
    this.gui.elements.input=$(document.createElement("input"));
    this.gui.elements.button=$(document.createElement("button"));
    this.gui.elements.table=$(document.createElement("table"));
    this.gui.elements.tr=$(document.createElement("tr"));
    this.gui.elements.td=$(document.createElement("td"));

    this.gui.background=this.gui.elements.div.clone().addClass("editScreenBg");
    this.gui.window    =this.gui.elements.div.clone().addClass("editScreenWindow");
    
    this.gui.items   =this.gui.elements.div.clone().addClass("ess");
    this.gui.contents=this.gui.elements.div.clone().addClass("esc");

    this.gui.header.headerNames=this.gui.elements.tr.clone().addClass("editScreenTitleDesc");
    this.gui.header.headerValues=this.gui.elements.tr.clone();

    this.gui.editorScreen=this.gui.elements.div.clone().addClass("editScreen");

    this.gui.window.append([
      this.gui.elements.div.clone().addClass("editScreenTitlebar").append(
        this.gui.elements.div.clone().addClass("editScreenClose").click(function() { self.closeEditor() }).text("x")
      ),
      this.gui.elements.div.clone().addClass("editScreenSources").append([
        //TODO: add element to switch to item filters
        this.gui.items,
        this.gui.contents
      ]),
      this.gui.elements.div.clone().addClass("editScreenHeaderWrapper").append(
        this.gui.elements.table.clone().addClass("editScreenHeader").append([
          this.gui.header.headerNames,
          this.gui.header.headerValues
        ])
      ),
      //TODO: add tab bar to display open files
      this.gui.editorScreen,
      this.gui.elements.div.clone().addClass("editScreenFooter").append([
        //this.gui.elements.button.clone().click(function() { self.saveCurrent(true,false); }).text("save content"),
        //this.gui.elements.button.clone().click(function() { self.saveCurrent(false,true); }).text("save header"),
        this.gui.elements.button.clone().click(function() { self.saveCurrent(); }).text("save all")
      ])
    ]);

    this._setupEditor();
    
    for (var i in editorAPI.headerColumns) {
      this.gui.header.values[editorAPI.headerColumns[i]]=this.gui.elements.input.clone()
        .addClass("editScreenHead").text("").prop("disabled",!this._headerEnabled[i]);

      this.gui.header.headerNames.append(
        this.gui.elements.td.clone().text(editorAPI.headerColumns[i])
      );
      this.gui.header.headerValues.append(
        this.gui.elements.td.clone().append(
          this.gui.header.values[editorAPI.headerColumns[i]]
        )
      );
    }

    this._contentRoot.gui=this._createDirectoryGui("root",function() {});
    this._contentRoot.gui.title.remove();
    this.gui.contents.append(this._contentRoot.gui.node);

    this.gui.background.append(this.gui.window);
    $(document.body).append(this.gui.background);

    this.setVisibility(true);
  },

  isVisible:function() {
    return this._visible;
  },

  setVisibility:function(visible) {
    this._visible=visible;

    if (this._visible) {
      this.gui.background.css("display","initial");
    } else {
      this.gui.background.css("display","none");
    }

    return this.isVisible();
  },

  saveCurrent:function(content,header) {
    if (content!==false) { content=true; }
    if (header!==false) { header=true; }

    if ((this.activeTab) && (this.activeTab.isValid())) {
      this.storeTab();
      var tab=this.activeTab;

      if (tab.item) {
        tab.getData(function(data) {
          tab.getHeader(function(header) {
            editorAPI.setItem(tab.item.id,data,header,function(status,data) {
              if (status) {
                display(status);
              }
            });
          });
        });
      } else {
        throw new Error("save new item - not implemented");
      }
    } else {
      throw new Error("no active tab");
    }

  },
  closeEditor:function() {
    this.setVisibility(false);
  },

  getContentDirectory:function(path) {
    var current=this._contentRoot;
    for (var i in path) {
      var section=path[i];
      if (current.type=="directory") {
        if (current.sub[section]) {
          current=current.sub[section];
        } else {
          throw new Error("path "+path.join("/")+" section "+i+" does not exist");
        }
      } else {
        throw new Error("in path "+path.join("/")+" section "+i+" is no directory");
      }
    }
    return current;
  },
  addContentDirectory:function(directory,name) {
    var self=this;
    if (directory.type=="directory") {
      if (!directory.sub[name]) {
        var dir={
          type:"directory",
          visible:true,
          fullPath:directory.fullPath+"/"+name,
          sub:{},
          gui:this._createDirectoryGui(name,function() { self._toogleDir(dir); })
        };
        directory.sub[name]=dir;
        this._appendToGui(directory,directory.sub[name]);
      } else {
        throw new Error(name+" does already exist");
      }
    } else {
      throw new Error("given data is no directory");
    }
  },
  addContentFile:function(directory,name) {
    if (directory.type=="directory") {
      if (!directory.sub[name]) {
        directory.sub[name]={
          type:"file",
          fullPath:directory.fullPath+"/"+name,
          gui:this._createFileGui(name,function() { self._showFile(dir); })
        };
        this._appendToGui(directory,directory.sub[name]);
      } else {
        throw new Error(name+" does already exist");
      }
    } else {
      throw new Error("given data is no directory");
    }
  },
  /**
   * adds the data structure to the content elements
   * @param {object} data nested (non cirular) object. Objects are inserted as folders, strings as files
   */
  addContent:function(data,directory) {
    if (!directory) { directory=this._contentRoot; }

    for (var name in data) {
      var element=data[name];
      if (typeof element=="string") {
        debugWindow.addContentFile(directory,name);
      } else {
        debugWindow.addContentDirectory(directory,name);
        this.addContent(element,directory.sub[name]);
      }
    }
  },

  _toogleDir:function(directory) {
    directory.visible=!directory.visible;
    directory.gui.css("display",directory.visible?"initial":"none")
  },
  _createFileGui:function(name,callback) {
    var gui={
      node:this.gui.elements.div.clone().addClass("scrContEl").addClass("srcContFile").text(name).click(callback)
    };
    return gui;
  },
  _createDirectoryGui:function(name,callback) {
    var title=this.gui.elements.div.clone().addClass("scrContEl").addClass("srcContNodeName").text(name);
    var content=this.gui.elements.div.clone().addClass("srcContNodeSub");
    var gui={
      node:this.gui.elements.div.clone().addClass("scrContNode").append([
        title,
        content
      ]).click(callback),
      title:title,
      content:content
    };
    return gui;
  },
  _appendToGui:function(directory,element) {
    directory.gui.content.append(element.gui.node);
  },
  _setupEditor:function() {

    this.editor=ace.edit(this.gui.editorScreen[0]);
    this.editor.setTheme("ace/theme/kr_theme");
    
    this.editor.getSession().setTabSize(2);
    this.editor.getSession().setUseSoftTabs(true);
    this.editor.getSession().setUseWrapMode(false);
    this.editor.setHighlightActiveLine(false);
    this.editor.setValue("");
    this.editor.setReadOnly(true);
  },
  getWindowItem:function(id) {
    return this._itemList[id];
  },
  setWindowItem:function(item) {
    var self=this;
    var existingItem=this.getWindowItem(item.id);
    if (existingItem!=item) {
      if (existingItem!=undefined) {
        this.removeWindowItem(existingItem.id);
      }

      this._itemList[item.id]=item;
      item.gui.appendTo(this.gui.items).click(function() {
        self.displayItem(item);
      });
    }
  },
  removeWindowItem:function(id) {
    var item=this.getWindowItem(id);
    if (item!=undefined) {
      item.gui.detach();
      delete this._itemList[id];
    }
  },
  displayItem:function(item) {
    var self=this;

    if (this.getWindowItem(item.id)!=item) {
      this.setWindowItem(item);
    }
    
    if (!item.tab) {
      item.tab=new DebugWindowTab(item);
    }
    self.loadTab(item.tab);
  },
  getData:function() {
    if (this.activeTab) {
      return this.editor.getValue();
    } else {
      throw new Error("no active tab");
    }
  },
  getHeader:function() {
    if (this.activeTab) {
      var header={};

      for (var i in editorAPI.headerColumns) {
        header[editorAPI.headerColumns[i]]=this.gui.header.values[editorAPI.headerColumns[i]].val();
      }

      return header;
    } else {
      throw new Error("no active tab");
    }
  },
  storeTab:function() {
    if ((this.activeTab) && (this.activeTab.isValid())) {
      this.activeTab.setData(this.getData());
      this.activeTab.setHeader(this.getHeader());
    } else {
      throw new Error("no active tab");
    }
  },
  loadTab:function(tab) {
    if (this.activeTab) {
      //store & deactivate active tab
      this.storeTab();
      this.activeTab=undefined;
      tab.setActive(false);
    }

    //lock editor
    this.editor.setReadOnly(true);
    this.editor.getSession().getUndoManager().markClean();

    var self=this;
    var dataB=false;
    var headB=false;
    var dataN=undefined;
    var headerN=undefined;

    tab.getData(function(data) {
      dataB=true;
      dataN=data;
      load();
    });
    tab.getHeader(function(header) {
      headB=true;
      headerN=header;
      load();
    });
  
    function load() {
      if (dataB && headB) {
        if (tab.isValid()) {
          tab.setActive(true);
          self.activeTab=tab;
          var types={
            "static":{ mode:"ace/mode/html" },
            "script":{ mode:"ace/mode/javascript" },
            "data":{ mode:"ace/mode/json" },
            "text":{ mode:"ace/mode/text" }
          };
          var mode=types[headerN.type].mode;

          if (mode==undefined) {
            mode="ace/mode/text";
          }
          
          //TODO: set editor to write-only if item type has no data
          self.editor.setReadOnly(false);
          self.editor.getSession().setMode(mode);
          self.editor.setValue(dataN,-1);
        } else {
          self.activeTab=undefined;
          self.editor.setReadOnly(true);
          self.editor.setValue("error while loading",-1);
          display(tab._cache.status+" - "+tab._cache.description);
        }

        for (var i in editorAPI.headerColumns) {
          if (tab.isValid()) {
            self.gui.header.values[editorAPI.headerColumns[i]].val(headerN[editorAPI.headerColumns[i]]);
            self.gui.header.values[editorAPI.headerColumns[i]].attr("disabled",!self._headerEnabled[i]);
          } else {
            self.gui.header.values[editorAPI.headerColumns[i]].val("");
            self.gui.header.values[editorAPI.headerColumns[i]].attr("disabled",true); 
          }
        }
      }
    }
  }
};

(function() {
  $(window).ready(function() {
    debugWindow._setup();
  });
})();