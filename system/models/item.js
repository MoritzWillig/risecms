stat=require("../../status.js");
db=require("./database").getInstance();
fs=require("fs");
fsanchor=require("../../fsanchor.js");

function ItemLink(item,data,modifiers) {
  this.item=item;
  this.data=(typeof data != "undefined")?data:{};
  this.modifiers=(typeof modifiers != "undefined")?modifiers:[];
}

ItemLink.prototype.item=undefined;
ItemLink.prototype.data={};
ItemLink.prototype.modifier={post:[]};


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

Item.prototype.itemStr=undefined; //[string/Item]
Item.prototype.dataObj=undefined; //object

Item.prototype.parent=undefined;

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
    if (result!=null) {
      self.statusHeader=new stat.states.database.DATABASE_ERROR({err:err,this:this});
    } else {
      self.header=result[0];
      self.statusHeader=new stat.states.items.HEADER_LOADED();
      callback(self);
    }
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
  fs.readFile(path,function(err,data) {
    if (err!=null) {
      this.statusFile=new stat.states.items.NO_FILE({err:err,this:this});
    } else {
      this.file=data.toString();
      this.statusFile=new stat.states.items.FILE_LOADED();
      callback(this);
    }
  });
}

module.exports=Item;