
function EventHandler(owner) {
  this._listeners=[];
  this._owner=owner;
}

EventHandler.prototype.register=function register(listener) {
  this._listeners.push(listener);
}

EventHandler.prototype.clear=function clear() {
  this._listeners.length=0;
}

EventHandler.prototype.trigger=function trigger() {
  for (var i in this._listeners) {
    var l=this._listeners[i];

    l.apply(this._owner,arguments);
  }
}
