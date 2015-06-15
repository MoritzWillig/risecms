
/**
 * Provider for JSON editors
 * Provides JSON editors for JSON type names, a "json" editor and a "text" editor
 * @param {string} [classPrefix] prefix for css classes
 * @class
 * @implements {IEditorProvider}
 */
function DefaultJSONEditorProvider(classPrefix) {
  this._classPrefix=classPrefix;
}

DefaultJSONEditorProvider.prototype=new IEditorProvider();

/**
 * request an JSON editor for json type names, "json" and "text"
 * @param {string} name type name for an editor type
 * @return {IEditor}           requested editor instance
 * @throws {Error} If name is no known constant
 */
DefaultJSONEditorProvider.prototype.requestEditor=function requestEditor(name) {
  var editor;
  switch (name) {
    case "string":
      editor=new SimpleStringEditor(undefined,this._classPrefix);
      break;
    case "number":
      editor=new JSONNumberEditor(undefined,this._classPrefix);
      break;
    case "boolean":
      editor=new JSONBooleanEditor(undefined,this._classPrefix);
      break;
    case "null":
      editor=new JSONNullEditor(undefined,this._classPrefix);
      break;
    case "array":
      editor=new JSONArrayEditor(undefined,this,this._classPrefix);
      break;
    case "object":
      editor=new JSONObjectEditor(undefined,this,this._classPrefix);
      break;
    case "json":
      editor=new JSONDynamicNode(undefined,this,this._classPrefix);
      break;
    case "text":
      editor=new SimpleStringEditor(undefined,this._classPrefix);
      break;
    default:
      throw new Error("unknown json type");
  }

  return editor;
};

/**
 * notify the provider that an editor can be removed
 * @param  {IEditor} instance editor instance to dispose
 */
DefaultJSONEditorProvider.prototype.disposeEditor=function disposeEditor(instance) {
  instance.getDom().detach();
  //FIXME IEditor should also require a dispose method
};