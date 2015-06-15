
/**
 * Interface for providing editors
 * Provides editors on request. No editor is instance is delivered twice
 * @interface
 * @extends {Interface}
 */
function IEditorProvider() {}

IEditorProvider.prototype=new Interface();

/**
 * request an editor type by defined constant names
 * @param {string} name constant for an editor type
 * @return {IEditor}           requested editor instance
 * @throws {Error} If name is no known constant
 */
IEditorProvider.prototype.requestEditor=Interface.IfcFunc(function requestEditor(name) {
  throw new InterfaceError("not implemented");
});

/**
 * notify the provider that an editor can be removed
 * @param  {IEditor} instance editor instance to dispose
 */
IEditorProvider.prototype.disposeEditor=Interface.IfcFunc(function disposeEditor(instance) {
  throw new InterfaceError("not implemented");
});

