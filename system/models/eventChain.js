stat=require("../../status.js");

/**
 * Object for handling events
 * @param {[string]} events list of events which can be triggered
 * @param {Object} parent object to be applied as this for events
 */
EventChain=function(events,parent) {
  if (events) {
    for (var e in events) {
      this.registerEvent(events[e]);
    }
  }
  setEventParent(parent?parent:this);
};

EventChain.setEventParent(parent) {
  this.parent=parent;
}

EventChain.prototype.events={};

/**
 * returns whether or not an event was registered for the given name
 * @param  {String}  name
 * @return {Boolean}
 */
EventChain.prototype.isRegisteredEvent=function(name) {
  return (typeof this.events[name]!="undefined");
};

/**
 * registers an new event chain under the given name
 * @param  {String} name
 * @return {undefined}
 */
EventChain.prototype.registerEvent=function(name) {
  if (this.isRegisteredEvent(name)) { throw new stat.states.system.plugins.KNOWN_EVENT({name:name}); }

  this.events[name]=[];
};

/**
 * deletes an event and its event chain
 * @param  {String} name
 * @return {undefined}
 */
EventChain.prototype.unregisterEvent=function(name) {
  if (!isRegisteredEvent(name)) { throw new stat.states.system.plugins.UNKNOWN_EVENT({name:name}); }

  delete this.events[name];
};

/**
 * registers an event in an event chain
 * @param  {String}   name name of the event
 * @param  {Function} callback function to be called
 * @return {undefined}
 */
EventChain.prototype.on=function(name,callback) {
  if (!this.isRegisteredEvent(name)) { throw new stat.states.system.plugins.UNKNOWN_EVENT({name:name}); }

  var idx=this.events[name].indexOf(callback);
  if (idx==-1) {
    this.events[name].push(callback);
  }
};

/**
 * removes an event from an event chain
 * @param  {String}   name of the event 
 * @param  {Function} callback function to be called
 * @return {undefined}
 */
EventChain.prototype.off=function(name,callback) {
  if (!this.isRegisteredEvent(name)) { throw new stat.states.system.plugins.UNKNOWN_EVENT({name:name}); }

  var idx=this.events[name].indexOf(callback);
  if (idx!=-1) {
    this.events[name].splice(idx,1);
  }
},

/**
 * returns the whole event chain array of a given event
 * @param  {String} name
 * @return {Array} the event chain for name
 */
EventChain.prototype.getEventChain=function(name) {
  if (!this.isRegisteredEvent(name)) { throw new stat.states.system.plugins.UNKNOWN_EVENT({name:name}); }

  return this.events[name];
};

/**
 * calls all registered callbacks for an event
 * @param {String} name name of the event
 * @param {[*]} data additional data to be passed to the event handlers
 * @return {undefined}
 */
EventChain.prototype.trigger=function(name,data) {
  var chain=this.getEventChain(name);
  for (var i in chain) { chain[i].apply(this.parent,data); }
};


module.exports=EventChain;