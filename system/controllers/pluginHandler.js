var fsanchor=require("../../fsanchor");
var express=require("express");
var stat=require("../../status.js");

/**
 * manages all loaded plugins provides events to system interfaces
 * @type {Object}
 */
pluginHandler={
  
  /**
   * app the plugin handler is bound to
   * @type {express app}
   */
  app:undefined,
  /**
   * routers to the different app paths
   * @type {Array[Router]}
   */
  routers:undefined,

  /**
   * binds the plugin handler to a given app
   * @param  {express app} app express app for the plugin handler
   * @param {[Routers]} routers a list of routers to be used by plugins
   * @return {undefined}
   */
  setup:function(app,routers) {
    this.app=app;
    this.routers=routers;
  },

  /**
   * contains the plugin objects
   * @type {Object}
   */
  plugins:{},

  /**
   * registers an plugin and adds it to the plugins list
   * @param  {String} name name of the plugin
   * @param  {Object} path path to the plugin folder
   * @return {undefined}
   */
  registerPlugin:function(name,path) {
    //get and save plugin function
    var plugin=require(path);
    this.plugins[name]=plugin;
    
    var pluginsContent=fsanchor.resolve(name+"/content","plugins");
    this.registerRoute("content","/"+name,express.static(pluginsContent));

    //start plugin
    plugin(this);
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
    if (this.isRegisteredEvent(name)) { throw new stat.states.system.plugins.KNOWN_EVENT({name:name}); }

    this.eventChains[name]=[];
  },

  /**
   * deletes an event and its event chain
   * @param  {String} name
   * @return {undefined}
   */
  unregisterEvent:function(name) {
    if (!isRegisteredEvent(name)) { throw new stat.states.system.plugins.UNKNOWN_EVENT({name:name}); }

    delete this.eventChains[name];
  },

  /**
   * registers an event in an event chain
   * @param  {String}   name name of the event chain
   * @param  {Function} callback function to be called
   * @return {undefined}
   */
  on:function(name,callback) {
    if (!this.isRegisteredEvent(name)) { throw new stat.states.system.plugins.UNKNOWN_EVENT({name:name}); }

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
    if (!this.isRegisteredEvent(name)) { throw new stat.states.system.plugins.UNKNOWN_EVENT({name:name}); }

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
    if (!this.isRegisteredEvent(name)) { throw new stat.states.system.plugins.UNKNOWN_EVENT({name:name}); }

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
  },

  /**
   * registers a route for a plugin
   * @param  {String} name    name of the router to be used
   * @param  {String/Regex} path    route path
   * @param  {Function} handler handler to be called on path match
   * @return {undefined}
   */
  registerRoute:function(name,path,handler) {
    //TODO: move into register function and pass as parameter to plugin
    this.routers[name].use(path,handler);
  }
};

module.exports=pluginHandler;