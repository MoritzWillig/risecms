
//FIXME most of the vars named "node" are actually wrappers (*1). rename ...
//(*1) _createNode no longer creates nodes. it returns wrapper objects

/**
 * editor for json objects
 * @param {*} value initial value
 */
function JSONObjectEditor(value) {
  var self=this;
  this._dom={
    root:$("<div>",{}),
    insertName:$("<input>",{}),
    insertNew:$("<button>",{
      text:"+",
      click:function() {
        self._addNode(self._dom.insertName.val());
      }
    }),
    nodes:$("<div>",{})
  };

  this._dom.root.append(this._dom.insertName);
  this._dom.root.append(this._dom.insertNew);
  this._dom.root.append(this._dom.nodes);

  this._readOnly=false;

  //TODO check if this can already be replaced by a map
  this._wrappers=[];
  this._wrapperNames=[];

  this.setValue(value);
}

JSONObjectEditor.prototype=new EditorInterface(undefined);

/**
 * set the value to be displayed in the editor
 * @param {*} value data to be displayed
 */
JSONObjectEditor.prototype.setValue=function setValue(value) {
  //remove old nodes
  for (var i in this._wrappers) {
    var node=this._wrappers[i];
    node.wrapper.detach();
  }
  this._wrappers.length=0;
  this._wrapperNames.length=0;

  //check for valid value
  if (value==undefined) {
    return;
  }

  if ((typeof value!="object")) {
    throw new Error("invalid value type");
  }

  //add sub nodes
  for (var i in value) {
    var val=value[i];

    var node=this._createNode(i,val);
    this._wrappers.push(node);
    this._wrapperNames.push(i);

    this._dom.nodes.append(node.wrapper);
  }
}

JSONObjectEditor.prototype._createNode=function _createNode(name,value) {
  var node=new JSONEditNode(value);
  //create node wrapper to insert new elements
  var self=this;
  var wrapperGUI=$("<div>",{
    html:[
      $("<button>",{
        text:"-",
        click:function() {
          self._removeNode(wrapper,node);
        }
      }),
      $("<span>",{
        text:name,
        click:function() {
          //TODO allow renameing
        }
      }),
      node.getDom()
    ]
  });

  var wrapper={
    wrapper:wrapperGUI,
    node:node
  };
  return wrapper;
}

JSONObjectEditor.prototype._addNode=function _addNode(name) {
  if (this._readOnly) { return; }

  if (this._wrapperNames.indexOf(name)!=-1) {
    throw new Error("name existing");
  }

  /*
   * FIXME use some value type ... (=> use/document some explicit strategy)
  */
  var node=this._createNode(name,"");

  this._wrappers.push(node);
  this._wrapperNames.push(name);

  this._dom.nodes.append(node.wrapper);
}

JSONObjectEditor.prototype._removeNode=function _removeNode(wrapper,node) {
  if (this._readOnly) { return; }

  var idx=this._getIdxByWrapper(wrapper);

  var node=this._wrappers[idx];
  node.wrapper.detach();

  this._wrappers.splice(idx,1);
  this._wrapperNames.splice(idx,1);
}

JSONObjectEditor.prototype._getIdxByWrapper=function _getIdxByWrapper(wrapper) {
  var idx=this._wrappers.indexOf(wrapper);
  if (idx==-1) { throw new Error("invalid wrapper"); }

  return idx;
}

/**
 * gives the value currently represented by the editor
 * @return {*} value value represented by the editor
 */
JSONObjectEditor.prototype.getValue=function getValue() {
  var value={};
  for (var i=0; i<this._wrappers.length; i++) {
    var node=this._wrappers[i];
    var name=this._wrapperNames[i];
    value[name]=node.node.getValue();
  }
  return value;
}

/**
 * returns the dom node which represents the editor
 * @return {JQuery DOM Node} dom node representing the editor
 */
JSONObjectEditor.prototype.getDom=function getDom() {
  return this._dom.root;
}

/**
 * sets editor into readonly or read/write mode
 * @param {boolean} readOnly if true readonly is enabled otherwise writing is allowed
 */
JSONObjectEditor.prototype.setReadOnly=function setReadOnly(readOnly) {
  this._readOnly=readOnly;

  for (var i in this._wrappers) {
    var node=this._wrappers[i];

    node.node.setReadOnly(this._readOnly);
  }
}