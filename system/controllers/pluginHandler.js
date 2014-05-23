
/**
 * manages all loaded plugins provides events to system interfaces
 * @type {Object}
 */
pluginHandler={
  /**
   * contains the plugin objects
   * @type {Object}
   */
  plugins:{},

  /**
   * registers an plugin and adds it to the plugins list
   * @param  {String} name
   * @param  {Object} object
   * @return {undefined}
   */
  registerPlugin:function(name,object) {
    this.plugins[name]=object;
  },

  /**
   * contains the event chains for every registered event
   * @type {Object}
   */
  eventChains:{},

  /**
   * returns whether or not an event was registered for the given name
   * @param  {String}  name
   * @return {Boolean}
   */
  isRegisteredEvent:function(name) {
    return (typeof this.eventChains[name]!="undefined");
  },

  /**
   * registers an new event chain under the given name
   * @param  {String} name
   * @return {undefined}
   */
  registerEvent:function(name) {
    if (this.isRegisteredEvent(name)) { throw {desc:"event was already registered",name:name}; }

    this.eventChains[name]=[];
  },

  /**
   * deletes an event and its event chain
   * @param  {String} name
   * @return {undefined}
   */
  unregisterEvent:function(name) {
    if (!isRegisteredEvent(name)) { throw {desc:"event was not registered",name:name}; }

    delete this.eventChains[name];
  },

  /**
   * registers an event in an event chain
   * @param  {String}   name name of the event chain
   * @param  {Function} callback function to be called
   * @return {undefined}
   */
  on:function(name,callback) {
    if (!this.isRegisteredEvent(name)) { throw {desc:"Unknown event",name:name}; }

    var idx=this.eventChains[name].indexOf(callback);
    if (idx==-1) {
      this.eventChains[name].push(callback);
    }
  },

  /**
   * removes an event from an event chain
   * @param  {String}   name
   * @param  {Function} callback
   * @return {undefined}
   */
  off:function(name,callback) {
    if (!this.isRegisteredEvent(name)) { throw {desc:"Unknown event",name:name}; }

    var idx=this.eventChains[name].indexOf(callback);
    if (idx!=-1) {
      this.eventChains[name].splice(idx,1);
    }
  },

  /**
   * returns the whole event chain array of a given event
   * @param  {String} name
   * @return {Array} the event chain for name
   */
  getEventChain:function(name) {
    if (!this.isRegisteredEvent(name)) { throw {desc:"Unknown event",name:name}; }

    return this.eventChains[name];
  },

  /**
   * calls all registered callbacks for an event
   * @param {String} name name of the event
   * @param {*} data additional data to be passed to the event handlers
   * @return {undefined}
   */
  trigger:function(name,data) {
    var chain=this.getEventChain(name);
    for (var i in chain) { chain[i](name,data); }
  }
};

module.exports=pluginHandler;