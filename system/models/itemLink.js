
Item=require("./item.js");

/**
 * ItemLink holding environment data of items
 * @param {Item/ItemLink} item      item to be linked to or itemlink to be copied
 * @param {[{}/Item]} data      additional environment data (or item holding additional data)
 * @param {[*]} modifiers modifiers to apply at item parsing
 */
function ItemLink(item,data,modifiers) {
  if (item instanceof ItemLink) {
    //copy
    this.item=item.item;
    this.data=item.data;
    this.modifiers=item.modifiers;
    this.dataItem=item.dataItem;
    this.replacements=item.replacements;
  } else {
    this.item=item;
    
    this.setData(data);

    if (typeof modifiers!="undefined") {
      this.modifiers=modifiers;
    }
  }
}

/**
 * checks if the item link can be parsed
 * @return {boolean} returns true if the itemlink is in a valid state
 */
ItemLink.prototype.isValid=function() {
  return ((this.item.isValid()) && ((this.dataItem==undefined) || (this.dataItem.isValid())));
}

/**
 * returns a status string of the item link
 * @param  {boolean} printValid adds status messages of valid items
 * @return {string}            status string of the item link
 */
ItemLink.prototype.getStatusString=function(printValid) {
  var str="";
  if ((!this.item.isValid()) || printValid) {
    str+=this.item.getStatusString(printValid);
  }

  if (this.dataItem) {
    if ((!this.dataItem.isValid()) || printValid) {
      str+=this.dataItem.getStatusString(printValid);
    }
  } else {
    if (printValid) {
      str+="no data item";
    }
  }

  return str;
}

/**
 * sets additional data
 * @param {{}/Item} data data or "data "item holding the data
 */
ItemLink.prototype.setData=function(data) {
  if (data==undefined) {
    this.data={};
  } else {
    if (data instanceof Item) {
      this.data=data.dataObj;
      this.dataItem=data;
    } else {
      this.data=(typeof data != "undefined")?data:{};
      this.dataItem=undefined;
    }
  }
}

/**
 * linked item
 * @type {Item}
 */
ItemLink.prototype.item=undefined;
/**
 * additional environment data
 * @type {Object}
 */
ItemLink.prototype.data={};
/**
 * item which provided the additional data
 * @type {[Object]}
 */
ItemLink.prototype.dataItem=undefined;
/**
 * modifiers to apply on item parsing
 * @type {Object}
 * @todo
 */
ItemLink.prototype.modifiers={post:[]};
/**
 * replacements to be done in data
 * @type {Array}
 */
ItemLink.prototype.replacements=[];
/**
 * scope (in most cases parent) of the itemlink. Used to resolve replacement paths
 * @type {undefindef/itemLink}
 */
ItemLink.prototype.scope=undefined;

module.exports=ItemLink;