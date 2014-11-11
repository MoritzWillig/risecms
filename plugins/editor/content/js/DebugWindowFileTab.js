DebugWindowFile=function(path,name) {
  this.path=path;
  this.name=name;
  this.gui=this._createFileGui(name,function() {
    //TODO "setup correct callback"
    debugWindow.displayFile(this);
  });
}

DebugWindowFile.prototype._createFileGui=function(name,callback) {
  var self=this;
  var gui={
    node:debugWindow.gui.elements.div.clone().addClass("scrContEl").addClass("srcContFile").text(name).click(function(e) {
      e.stopPropagation();
      callback.apply(self,arguments);
    })
  };
  return gui;
};

//TODO: implement abstract Tab class

DebugWindowFileTab=function DebugWindowFileTab(file) {
  this._cache={
    status:undefined,
    description:undefined,

    data:undefined,

    queried:false,
    callbackQueue:[]
  };

  this.file=file;
  if (!this.file) {
    this._cache.status=200;
    this._cache.description="ok";
    this.data="";
  }
};

DebugWindowFileTab.prototype.setActive=function(state) {
  //TODO add tab gui
};

DebugWindowFileTab.prototype.getData=function(callback,forceReload) {
  var self=this;
  if ((!this.isValid()) || forceReload) {
    this._updateCache(function() {
      callback(self._cache.data);
    });
  } else {
    callback(self._cache.data);
  }
};

DebugWindowFileTab.prototype.setData=function(data) {
  this._cache.data=data;
}

DebugWindowFileTab.prototype.save=function(callback) {
  self=this;
  self.getData(function(data) {
    if (self.isValid() && (data!=undefined)) {
      if (self.file) {
        editorAPI.setContent(self.file.path,data,function(status,data) {
          callback(status);
        });
      } else {
        throw new Error("save new file - not implemented");
      }
    } else {
      callback("file is not valid");
    }
  });
}

DebugWindowFileTab.prototype._updateCache=function(callback) {
  var self=this;
  
  this._cache.callbackQueue.push(callback);

  if (this.file) {
    if (this._cache.queried==false) {
      this._cache.queried=true;
      
      editorAPI.getContent(this.file.path,function(status,data) {
        self._cache.status=(status==undefined)?200:status;
        self._cache.description=data.error||data.description||"";
        self._cache.data=data.data;
        
        self._finishCacheUpdate();
      });
    }
  } else {
    //local data
    self._finishCacheUpdate();
  }
};

DebugWindowFileTab.prototype._finishCacheUpdate=function() {
  this._cache.queried=false;
  var queue=this._cache.callbackQueue;
  this._cache.callbackQueue=[];
  
  for (var i in queue) {
    queue[i].apply(this);
  }
};

DebugWindowFileTab.prototype.isValid=function() {
  return (this._cache.status==200);
};

DebugWindowFileTab.prototype.getStatusString=function() {
  return (this.isValid())?"":this._cache.description;
}