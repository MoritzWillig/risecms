
/**
 * Interface for EventHandlers
 * @interface
 * @extends {Interface}
 */
function IEventHandler() {
}

IEventHandler.prototype=new Interface();

/**
 * register a listener to the EventHandler
 * @param  {function} listener listener to be registered
 * @throws {Error} If the listener is already registered
 */
IEventHandler.prototype.register=Interface.IfcFunc(function register(handler) {
  throw new InterfaceError("not implemented");
});

/**
 * unregister a listener from the EventHandler
 * @param  {function} listener listener to unregister
 * @throws {Error} If the listener was not registered
 */
IEventHandler.prototype.unregister=Interface.IfcFunc(function unregister(handler) {
  throw new InterfaceError("not implemented");
});

/**
 * removes all listenerss from the EventHandler
 */
IEventHandler.prototype.clear=Interface.IfcFunc(function clear() {
  throw new InterfaceError("not implemented");
});

/**
 * check if a listener is currently registered
 * @param  {function}  listener listener to check for
 * @return {Boolean}   true if the listener is registered, false otherwise
 */
IEventHandler.prototype.isRegistered=Interface.IfcFunc(function(handler) {
  throw new InterfaceError("not implemented");
});

/**
 * notify all registered listeners
 * @param {...Mixed} data data to be passed to the listeners
 */
IEventHandler.prototype.trigger=Interface.IfcFunc(function() {
  throw new InterfaceError("not implemented");
});