
/**
 * Editor for json objects
 * @class
 * @implements {IEditor}
 * @mixes {EventHandler}
 * @param {*} value initial value
 * @param {IEditorProvider} provider a editor provider providing a json editor for "json"
 * @param {string} classPrefix css class prefix for dom elements
 */
function JSONObjectEditor(value,provider,classPrefix) {
  EventHandler.apply(this,[this]);

  this._provider=provider;

  if (classPrefix===undefined) {
    this._classPrefix="";
  } else {
    this._classPrefix=classPrefix;
  }

  var self=this;
  this._dom={
    root:$("<div>",{
      "class":this._classPrefix+"JSONObjectEditor"
    }),
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

  this._wrappers=[];
  this._wrapperNames=[];

  this.setValue(value);
}

JSONObjectEditor.prototype=new IEditor();
ClassHelper.$merge(JSONObjectEditor,EventHandler);

/**
 * set the value to be displayed in the editor
 * @param {*} value data to be displayed
 */
JSONObjectEditor.prototype.setValue=function setValue(value) {
  this._undefined=(value===undefined);

  //remove old nodes
  for (var i in this._wrappers) {
    var wrapper=this._wrappers[i];
    wrapper.wrapper.detach();
  }
  this._wrappers.length=0;
  this._wrapperNames.length=0;

  //check for valid value
  if (this._undefined) {
    this.setReadOnly(true);
  } else {
    if ((typeof value!="object")) {
      throw new Error("invalid value type");
    }

    //add sub nodes
    for (var i in value) {
      var val=value[i];

      var wrapper=this._createWrapper(i,val);
      this._wrappers.push(wrapper);
      this._wrapperNames.push(i);

      this._dom.nodes.append(wrapper.wrapper);
    }

    this.setReadOnly(false);
  }

  this.trigger(this);
}

/**
 * create a wrapper for an object item
 * @private
 * @param  {string} name  key of the item
 * @param  {*} value value of the item
 * @return {JQueryDOMNode}       wrapper representing the item
 */
JSONObjectEditor.prototype._createWrapper=function _createWrapper(name,value) {
  var node=this._provider.requestEditor("json");
  node.setValue(value);

  //create node wrapper to insert new elements
  var self=this;
  var wrapperGUI=$("<div>",{
    html:[
      $("<button>",{
        text:"-",
        click:function() {
          self._removeNode(wrapper);
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

/**
 * append a new node to the items list
 * @private
 * @param {string} name key of the item
 * @throws {Error} If the name already exists
 */
JSONObjectEditor.prototype._addNode=function _addNode(name) {
  if (this._readOnly) { return; }

  if (this._wrapperNames.indexOf(name)!=-1) {
    throw new Error("name existing");
  }

  //create empty string by default
  var wrapper=this._createWrapper(name,"");

  this._wrappers.push(wrapper);
  this._wrapperNames.push(name);

  this._dom.nodes.append(wrapper.wrapper);
}

/**
 * remove a node from the item list
 * @private
 * @param  {object} wrapper wrapper to remove
 */
JSONObjectEditor.prototype._removeNode=function _removeNode(wrapper) {
  if (this._readOnly) { return; }

  var idx=this._getIdxByWrapper(wrapper);

  var wrapper=this._wrappers[idx];
  wrapper.wrapper.detach();

  this._wrappers.splice(idx,1);
  this._wrapperNames.splice(idx,1);
}

/**
 * get the index of a wrapper in the wrappers list
 * @private
 * @param  {object} wrapper wrapper object to search for
 * @return {integer}         index of the wrapper in the list
 * @throws {Error} If the wrapper is not in the list
 */
JSONObjectEditor.prototype._getIdxByWrapper=function _getIdxByWrapper(wrapper) {
  var idx=this._wrappers.indexOf(wrapper);
  if (idx==-1) { throw new Error("invalid wrapper"); }

  return idx;
}

/**
 * get the value currently represented in the editor or undefined if not in a valid state
 * @return {*|undefined} value value represented in the editor
 */
JSONObjectEditor.prototype.getValue=function getValue() {
  if (this._undefined) {
    return undefined;
  } else {
    var value={};
    for (var i=0; i<this._wrappers.length; i++) {
      var wrapper=this._wrappers[i];
      var name=this._wrapperNames[i];
      value[name]=wrapper.node.getValue();
    }
    return value;
  }
}

/**
 * determine if the editor is in a valid state
 * @return {Boolean} true if the editor is in a valid state, false otherwise
 */
JSONObjectEditor.prototype.hasValidState=function hasValidState() {
  return (!this._undefined);
}

/**
 * get the dom node which contains the editor
 * @return {JQueryDOMNode} dom node representing the editor
 */
JSONObjectEditor.prototype.getDom=function getDom() {
  return this._dom.root;
}

/**
 * set the editor into readonly or read/write mode
 * @param {boolean} readOnly if true readonly is enabled otherwise writing is allowed
 */
JSONObjectEditor.prototype.setReadOnly=function setReadOnly(readOnly) {
  this._readOnly=readOnly;

  for (var i in this._wrappers) {
    var wrapper=this._wrappers[i];

    wrapper.node.setReadOnly(this._readOnly);
  }
}