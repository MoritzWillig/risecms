
/**
 * editor for json arrays
 * @param {*} value initial value
 */
function JSONArrayEditor(value) {
  var self=this;
  this._dom={
    root:$("<div>",{}),
    insertFirst:$("<button>",{
      text:"+",
      click:function() {
        self._addNodeFirst();
      }
    }),
    nodes:$("<div>",{})
  };

  this._dom.root.append(this._dom.insertFirst);
  this._dom.root.append(this._dom.nodes);

  this._readOnly=false;

  this._nodes=[];

  this.setValue(value);
}

JSONArrayEditor.prototype=new EditorInterface(undefined);

/**
 * set the value to be displayed in the editor
 * @param {*} value data to be displayed
 */
JSONArrayEditor.prototype.setValue=function setValue(value) {
  //remove old nodes
  for (var i in this._nodes) {
    var node=this._nodes[i];
    node.wrapper.detach();
  }
  this._nodes.length=0;

  //check for valid value
  if (value==undefined) {
    return;
  }

  if (!Array.isArray(value)) {
    throw new Error("invalid value type");
  }

  //add sub nodes
  for (var i=0; i<value.length; i++) {
    var val=value[i];

    var node=this._createNode(val);
    this._nodes.push(node);
    this._dom.nodes.append(node.wrapper);
  }
}

JSONArrayEditor.prototype._createNode=function _createNode(value) {
  var node=new JSONEditNode(value);
  //create node wrapper to insert new elements
  var self=this;
  var wrapperGUI=$("<div>",{
    html:[
      $("<button>",{
        text:"+",
        click:function() {
          self._addNode(wrapper,node);
        }
      }),
      $("<button>",{
        text:"-",
        click:function() {
          self._removeNode(wrapper,node);
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

JSONArrayEditor.prototype._addNodeFirst=function _addNodeFirst() {
  if (this._readOnly) { return; }

  /*
   * FIXME use the same value type like the node after (if there is any)
  */
  var node=this._createNode("");

  var idx=0;
  this._nodes.splice(idx,0,node);
  this._dom.nodes.prepend(node.wrapper);
}


JSONArrayEditor.prototype._addNode=function _addNode(wrapper,node) {
  if (this._readOnly) { return; }

  var idx=this._getIndexByWrapper(wrapper);

  /*
   * FIXME use the same value type like the node given
  */
  var node=this._createNode("");

  this._nodes.splice(idx+1,0,node);
  this._nodes[idx].wrapper.after(node.wrapper);
}

JSONArrayEditor.prototype._removeNode=function _removeNode(wrapper,node) {
  if (this._readOnly) { return; }

  var idx=this._getIndexByWrapper(wrapper);

  //detach gui
  var node=this._nodes[idx];
  node.wrapper.detach();

  //remove node
  this._nodes.splice(idx,1);
}

JSONArrayEditor.prototype._getIndexByWrapper=function _getIndexByWrapper(wrapper) {
  var idx=this._nodes.indexOf(wrapper);
  if (idx==-1) { throw new Error("invalid wrapper"); }

  return idx;
}

/**
 * gives the value currently represented by the editor
 * @return {*} value value represented by the editor
 */
JSONArrayEditor.prototype.getValue=function getValue() {
  var value=[];
  for (var i=0; i<this._nodes.length; i++) {
    var node=this._nodes[i];
    value.push(node.node.getValue());
  }
  return value;
}

/**
 * returns the dom node which represents the editor
 * @return {JQuery DOM Node} dom node representing the editor
 */
JSONArrayEditor.prototype.getDom=function getDom() {
  return this._dom.root;
}

/**
 * sets editor into readonly or read/write mode
 * @param {boolean} readOnly if true readonly is enabled otherwise writing is allowed
 */
JSONArrayEditor.prototype.setReadOnly=function setReadOnly(readOnly) {
  this._readOnly=readOnly;

  for (var i in this._nodes) {
    var node=this._nodes[i];

    node.node.setReadOnly(this._readOnly);
  }
}