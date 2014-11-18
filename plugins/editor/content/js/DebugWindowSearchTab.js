
DebugWindowSearchTab=function DebugWindowSearchTab() {
  this._cache={
    status:200,
    description:"ok",

    header:{},
    results:[],

    validCallback:undefined
  };

  for (var i in editorAPI.headerColumns) {
    this._cache.header[editorAPI.headerColumns[i]]="";
  }
};

DebugWindowSearchTab.prototype.setActive=function(state) {
  //TODO add tab gui
};

DebugWindowSearchTab.prototype.getResults=function(callback,forceReload) {
  callback(this._cache.results);
};

DebugWindowSearchTab.prototype.getHeader=function(callback,forceReload) {
  callback(this._cache.header);
};

DebugWindowSearchTab.prototype.setHeader=function(header) {
  this._cache.header=header;
  this._cache.validCallback=undefined;
}

DebugWindowSearchTab.prototype.setResults=function(results) {
  this._cache.results=results;
}

DebugWindowSearchTab.prototype.save=function(callback) {
  throw new Error("search tab does not support saving");
}

DebugWindowSearchTab.prototype.updateResults=function(callback) {
  var self=this;

  this.getHeader(function(header) {
    //filter empty header cells
    var query={};
    for (var i in header) {
      //check & convert to cell type 
      switch (editorAPI.headerType[editorAPI.headerColumns.indexOf(i)]) {
      case "string":
        if (header[i]!="") {
          query[i]=header[i];
        }
        break;
      case "int":
      case "timestamp":
        var intCell=header[i];
        if (intCell[0]=="") {
          if (intCell[1]=="") {
            continue;
          } else {
            intCell[0]=intCell[1];
          }
        }

        query[i]=[undefined,undefined];
        query[i][0]=(+intCell[0]);
        if (intCell[1]=="") {
          query[i][1]=(+intCell[0]);
        } else {
          query[i][1]=(+intCell[1]);
        }
        break;
      default:
        throw new Error("unknown header type");
      }  
    }

    var cb=function(status,data) {
      var headerValid=(self._cache.validCallback==cb);
        
      self._cache.status=(status==undefined)?200:status;
      self._cache.description=data.error||data.description||"";
      self.setResults(data.results);

      callback(self._cache.results,headerValid);
    }

    self._cache.validCallback=cb;
    editorAPI.queryItem(query,cb);
  });
}

DebugWindowSearchTab.prototype.isValid=function() {
  return (this._cache.status==200);
};

DebugWindowSearchTab.prototype.getStatusString=function() {
  return (this.isValid())?"":this._cache.description;
}