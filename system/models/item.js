stat=require("../../status.js");
db=require("./database").getInstance();
fs=require("fs");
fsanchor=require("../../fsanchor.js");
http = require('http');

/**
 * checks if the given parameter can be interpreted as a number
 * @param  {*} x parameter to be checked
 * @return {boolean}   whether or not the parameter is a number
 */
function checkNumber(x) {
  return !isNaN(+x);
}

/**
 * Item data representation
 * @param {string/integer} id     id,name or path of the item
 * @param {boolean} asPath if true the id is interpreted as path
 */
function Item(id,asPath) {
  if (id!=undefined) {
    this.id=id;
    this.idType=(asPath==true)?"path":(checkNumber(id))?"id":"name";
  } else {
    this.id=undefined;
    this.idType="string";
  }

  this.statusHeader=new stat.states.items.NOT_LOADED();
  this.statusFile=new stat.states.items.NOT_LOADED();

  this.itemStr=[];
}

/**
 * id of the item
 * @type {[number/string]}
 */
Item.prototype.id=undefined;
/**
 * describes the way the item id has to be interpreted
 * "id": item id
 * "name": item name
 * "string": item does not have a database id
 * @type {string}
 */
Item.prototype.idType=undefined;

/**
 * status of the item header loaded from database
 * @type {Status}
 */
Item.prototype.statusHeader=undefined;
/**
 * status of the item file & item interpretation
 * @type {Status}
 */
Item.prototype.statusFile=undefined;

/**
 * database row if item was loaded from database
 * @type {object/null}
 */
Item.prototype.header=null;
/**
 * Item string of the item
 * @type {[string]}
 */
Item.prototype.file=undefined;
//Item.prototype.dataScope={};

/**
 * parsed file attribute. Item elements have to be parsed and the whole array concernated to get the final item string
 * @type {[array/string]}
 */
Item.prototype.itemStr=[];
/**
 * object resulting from parsed file attribute
 * @type {[object]}
 */
Item.prototype.dataObj=undefined;
/**
 * script object created from the filev attribute
 * @type {[Script]}
 */
Item.prototype.script=undefined;

/**
 * dynamic parent holding this item (-> "including item")
 * @type {[Item]}
 */
Item.prototype.parent=undefined;
/**
 * static parent of the item
 * @type {[Item]}
 */
Item.prototype.staticParent=undefined;
//Item.prototype.modifier={post:[]};

/**
 * checks if the item is in an valid state
 * @return {boolean} returns true if item is valid
 */
Item.prototype.isValid=function() {
  return !(this.hasHeaderErr() || this.hasFileErr());
}

/**
 * checks if the item header is in an valid state
 * @return {boolean} returns false if item header is valid
 */
Item.prototype.hasHeaderErr=function() {
  return !(this.statusHeader instanceof status.proto.item.valid);
}

/**
 * checks if the item file is in an valid state
 * @return {boolean} returns false if item file is valid
 */
Item.prototype.hasFileErr=function() {
  return !(this.statusFile instanceof status.proto.item.valid);
}

/**
 * returns a status string of the item
 * @param  {boolean} printValid adds status of valid states
 * @return {string}            status string of the item
 */
Item.prototype.getStatusString=function(printValid) {
  var str="";
  if ((printValid) || (this.hasHeaderErr())) {
    str+=this.statusHeader.toString();
  }

  if ((printValid) || (this.hasFileErr())) {
    str+=this.statusFile.toString();
  }

  return str;
}

/**
 * loads the header of the item from the database based on item id and idType
 * @param  {function} (Item self) callback if the header was loaded
 * @async
 */
Item.prototype.loadHeader=function(callback) {
  this.header=undefined;

  var self=this;
  function cb(err, result) {
    if ((err!=null) || (result.length!=1)) {
      if ((err==null) && (result.length==0)) {
        self.statusHeader=new stat.states.items.NOT_FOUND();
      } else {
        self.statusHeader=new stat.states.database.DATABASE_ERROR({err:err});
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
    case "string":
      this.statusHeader=new stat.states.items.HAS_NO_HEADER({"idType":this.idType});
      callback.apply(this,[this]);
      break;
  }
}

/**
 * queries the item header by id
 * @private
 * @param  {Function} callback (String err, Object data) callback to return the result
 * @async
 */
Item.prototype._fromId=function(callback) {
  var query=db.query('SELECT * FROM ?? WHERE id=?',[cg.database.pageTable,this.id],callback);
}

/**
 * queries the item header by name
 * @private
 * @param  {Function} callback (String err, Object data) callback to return the result
 * @async
 */
Item.prototype._fromName=function(callback) {
  var query=db.query('SELECT * FROM ?? WHERE name=?',[cg.database.pageTable,this.id],callback);
}

/**
 * queries the item header by path
 * @private
 * @param  {Function} callback (String err, Object data) callback to return the result
 * @async
 */
Item.prototype._fromPath=function(callback) {
  var query=db.query('SELECT * FROM ?? WHERE path=?',[cg.database.pageTable,this.id],callback);
}

/**
 * returns the the item file path
 * @return {string} path to item file
 * @throws {INVALID_ID} If no id was set or loaded from the database
 */
Item.prototype.resolveIdPath=function() {
  var id=this.id;
  if (this.idType!="id") {
    if (this.header!=undefined) {
      id=this.header.id;
    } else {
      throw new stat.states.item.INVALID_ID({id:this.id,type:this.idType});
    }
  }

  return fsanchor.resolve(id,"storage");
}

/**
 * loads the file of the item
 * @param  {function} callback (Item self) callback if the item is loaded
 * @async
 */
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

/**
 * initiates and item from a string
 * @param  {string}   str      item string to be set
 * @param  {string}   type     item string
 * @param  {string}   name     item name
 * @param  {function} callback (Item self) callback to be called if item is initiated
 * @sync
 * @async
 */
Item.prototype.loadString=function(str,type,name,callback) {
  this.id=name;
  this.header={type:type};
  this.idType="string";

  this.file=str;
  this.statusFile=new stat.states.items.FILE_LOADED();

  callback.apply(this,[this]);
}

module.exports=Item;