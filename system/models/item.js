stat=require("../../status.js");
db=require("./database").getInstance();
fs=require("fs");
fsanchor=require("../../fsanchor.js");
http = require('http');

/**
 * checks if the given parameter can be interpreted as a number
 * @param  {*} x parameter to be checked
 * @return {boolean}   wheter or not the parameter is a number
 */
function checkNumber(x) {
  return !isNaN(+x);
}

function Item(id,asPath) {
  this.id=id;
  this.idType=(asPath==true)?"path":(checkNumber(id))?"id":"name";

  this.statusHeader=new stat.states.items.NOT_LOADED();
  this.statusFile=new stat.states.items.NOT_LOADED();
}

Item.prototype.id=undefined;
Item.prototype.idType=undefined;

Item.prototype.statusHeader=undefined;
Item.prototype.statusFile=undefined;


Item.prototype.header=null;
Item.prototype.file=undefined;
Item.prototype.dataScope={};

Item.prototype.itemStr=[]; //[string/Item]
Item.prototype.dataObj=undefined; //object
Item.prototype.dataObjItem=undefined; //object - set if dataObj was loaded from an item
Item.prototype.script=undefined; //Script object

Item.prototype.parent=undefined; //parent including this item
Item.prototype.staticParent=undefined; //static parent from database
Item.prototype.modifier={post:[]};

Item.prototype.isValid=function() {
  return !(this.hasHeaderErr() || this.hasFileErr());
}

Item.prototype.hasHeaderErr=function() {
  return !(this.statusHeader instanceof status.proto.item.valid);
}

Item.prototype.hasFileErr=function() {
  return !(this.statusFile instanceof status.proto.item.valid);
}

Item.prototype.loadHeader=function(callback) {
  this.header=undefined;

  var self=this;
  function cb(err, result) {
    if ((err!=null) || (result.length!=1)) {
      if ((err==null) && (result.length==0)) {
        self.statusHeader=new stat.states.items.NOT_FOUND({this:self});
      } else {
        self.statusHeader=new stat.states.database.DATABASE_ERROR({err:err,this:self});
      }
    } else {
      self.header=result[0];
      self.statusHeader=new stat.states.items.HEADER_LOADED();
    }
    callback.apply(self,[self]);
  }

  switch (this.idType) {
    case "path":
      this._fromPath(cb);
      break;
    case "id":
      this._fromId(cb);
      break;
    case "name":
      this._fromName(cb);
      break;
  }
}

Item.prototype._fromId=function(callback) {
  var query=db.query('SELECT * FROM ?? WHERE id=?',[cg.database.pageTable,this.id],callback);
}

Item.prototype._fromName=function(callback) {
  var query=db.query('SELECT * FROM ?? WHERE name=?',[cg.database.pageTable,this.id],callback);
}

Item.prototype._fromPath=function(callback) {
  var query=db.query('SELECT * FROM ?? WHERE path=?',[cg.database.pageTable,this.id],callback);
}

Item.prototype.resolveIdPath=function() {
  var id=this.id;
  if (this.idType!="id") {
    if (this.header!=undefined) {
      id=this.header.id;
    } else {
      throw new stat.states.item.INVALID_ID({id:this.id,type:this.idType,this:this});
    }
  }

  return fsanchor.resolve(id,"storage");
}

Item.prototype.loadFile=function(callback) {
  this.file=undefined;

  var path=this.resolveIdPath();
  var self=this;
  fs.readFile(path,function(err,data) {
    if (err!=null) {
      self.statusFile=new stat.states.items.NO_FILE({err:err,this:self});
    } else {
      self.file=data.toString();

      self.statusFile=new stat.states.items.FILE_LOADED();
    }
    callback.apply(self,[self]);
  });
}


module.exports=Item;