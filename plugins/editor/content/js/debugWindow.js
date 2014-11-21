
debugWindow={
  _visible:false,
  _headerEnabled:[false,true     ,true  ,true  ,true      ,true   ,true    ,true  ,false    ],

  _contentRoot:{
    type:"directory",
    fullPath:"",
    sub:[],
    gui:undefined
  },
  _itemList:{},

  //TODO: add function to clone gui elements
  gui:{
    elements:{},
    background:undefined,
    window:undefined,
  },
  activeTab:undefined,

  layoutMgr:undefined,
  
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
    this.gui.layout=this.gui.elements.div.clone().addClass("editScreenLayout");

    this.gui.items   =this.gui.elements.div.clone().addClass("ess");
    this.gui.contents=this.gui.elements.div.clone().addClass("esc");
    this.gui.toolbar =this.gui.elements.div.clone().addClass("editScreenToolBar");

    this.gui.tabbar=this.gui.elements.div.clone().addClass("editScreenTabBar");

    this.gui.window.append([
      this.gui.elements.div.clone().addClass("editScreenTitlebar").append(
        this.gui.elements.div.clone().addClass("editScreenClose").click(function() { self.closeEditor() }).text("x")
      ),
      this.gui.elements.div.clone().addClass("editScreenSources").append([
        this.gui.items,
        this.gui.contents,
        this.gui.toolbar
      ]),
      this.gui.tabbar,
      this.gui.layout
    ]);

    this._contentRoot.gui=this._createDirectoryGui("root",function() {});
    this._contentRoot.gui.title.remove();
    this.gui.contents.append(this._contentRoot.gui.node);

    this.gui.background.append(this.gui.window);
    $(document.body).append(this.gui.background);

    this.layoutMgr=new DebugWindowLayoutManager(this.gui.layout);
    var itemLayout=new DebugWindowItemLayout();
    this.defaultLayout=itemLayout;

    this.layoutMgr.layouts.push(itemLayout);
    this.layoutMgr.layouts.push(new DebugWindowFileLayout());
    this.layoutMgr.layouts.push(new DebugWindowSearchLayout(function(id) {
      var item=self.getWindowItem(id);
      if (item==undefined) {
        //create item
        //TODO get name of item when item is loaded
        item=new DebugWindowItem(nodes[i].dataset.id,nodes[i].dataset.name);
      }

      self.displayItem(item);
    }));

    //setup toolbar
    var searchButton=this.gui.elements.div.clone().click(function() {
      tab=new DebugWindowSearchTab();
      self._setTabByData(tab,tab);
      
      self.displayTab(tab);
    }).text("search item");
    this.gui.toolbar.append([
      searchButton
    ]);

    this.layoutMgr.display(undefined,this.defaultLayout);
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
    var self=this;
    if (directory.type=="directory") {
      if (!directory.sub[name]) {
        var file=new DebugWindowFile(directory.fullPath+"/"+name,name);

        directory.sub[name]=file;
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
    if (this.getWindowItem(item.id)!=item) {
      this.setWindowItem(item);
    }

    var tab=this._getTabByData(item);
    if (!tab) {
      tab=new DebugWindowTab(item);
      this._setTabByData(item,tab);
    }
    
    this.displayTab(tab);
  },
  
  displayFile:function(file) {
    if (!(file instanceof DebugWindowFile)) {
      throw new Error("data is no file");
    }

    var tab=this._getTabByData(file);
    if (!tab) {
      tab=new DebugWindowFileTab(file);
      this._setTabByData(file,tab);
    }

    this.displayTab(tab);
  },

  tabGuis:new Map(),
  displayTab:function(tab) {
    //remove focus from currently active tab
    var activeTab=this.layoutMgr.getActiveTab();
    if (activeTab) {
      var activeGui=this.tabGuis.get(activeTab);
      if (activeGui==undefined) {
        throw new Error("unknown active tab gui");
      }

      activeGui.removeClass("editScreenTabBarTabActive");
    }

    //display tab
    this.layoutMgr.display(tab);

    this.addHistory(tab);

    //add new tab gui if not displayed
    var gui=this.tabGuis.get(tab);
    if (gui==undefined) {
      var self=this;

      var close=this.gui.elements.div.clone().addClass("editScreenTabBarTabClose").text("x").click(function() {
        self.closeTab(tab);
      });
      var label=this.gui.elements.div.clone().addClass("editScreenTabBarTabLabel").text(tab.getTabLabel());
      gui=this.gui.elements.div.clone().addClass("editScreenTabBarTab").clone().append([
        label,
        close
      ]).click(function() {
        self.displayTab(tab);
      });
      this.tabGuis.set(tab,gui);

      this.gui.tabbar.append(gui);
    }

    //activate tab gui
    gui.addClass("editScreenTabBarTabActive");
  },

  closeTab:function(tab) {
    //display another tab
    this.removeFromHistory(tab);
    if (this.tabHistory.length!=0) {
      this.displayTab(this.tabHistory[this.tabHistory.length-1]);
    } else {
      //display empty layout
      this.layoutMgr.display(undefined,this.defaultLayout);
    }

    //remove tab gui
    var gui=this.tabGuis.get(tab);
    if (gui==undefined) {
      throw new Error("unknown tab");
    }
    
    gui.remove();
    this.tabGuis.delete(tab);

    //remove data-tab link
    var data=this._getDataByTab(tab);
    if (data==undefined) {
      throw new Error("unknown data-tab binding");
    }
    this.tabsByData.delete(data);
    this.dataByTabs.delete(tab);
  },

  tabHistory:[],
  addHistory:function(tab) {
    var idx=this.tabHistory.indexOf(tab);
    if (idx!=-1) {
      this.tabHistory.splice(idx,1);
    }
    this.tabHistory.push(tab);
  },
  removeFromHistory:function(tab) {
    var idx=this.tabHistory.indexOf(tab);
    if (idx!=-1) {
      this.tabHistory.splice(idx,1);
    }
  },

  tabsByData:new Map(),
  dataByTabs:new Map(),
  _getTabByData:function(data) {
    return this.tabsByData.get(data);
  },
  _getDataByTab:function(tab) {
    return this.dataByTabs.get(tab);
  },
  _setTabByData:function(data,tab) {
    this.tabsByData.set(data,tab);
    this.dataByTabs.set(tab,data);
  },
  
  storeTab:function() {
    if ((this.activeTab) && (this.activeTab.isValid())) {
      this.activeTab.setData(this.getData());
      this.activeTab.setHeader(this.getHeader());
    } else {
      throw new Error("no active tab");
    }
  }
};

(function() {
  $(window).ready(function() {
    debugWindow._setup();
  });
})();