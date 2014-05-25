var fsanchor=require("../../fsanchor");
var express=require("express");

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
   * binds the plugin handler to a given app
   * @param  {express app} app express app for the plugin handler
   * @return {undefined}
   */
  setup:function(app) {
    this.app=app;
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
    this.registerRoute("/content/plugins/"+name,express.static(pluginsContent));

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
  },
  

  pluginPaths:[],

  /**
   * registers an route for an plugin to be handled differently than by the default cms mechanism
   * @param  {String/Regex} path    path to be handled
   * @param  {Function} handler handler to be called
   * @return {undefined}
   */
  registerRoute:function(path,handler) {
    this.pluginPaths.push({
      path:path,
      handler:handler
    });
  },

  /**
   * plugin path middleware. bind this as middleware to check if a path was reigstered by a plugin
   * @param  {Request}   req  default req parameter
   * @param  {Response}   res  default res parameter
   * @param  {Function} next default next parameter
   * @return {undefined}
   */
  handlePluginPaths:function(req,res,next) {
    var match=false;
    
    for (var i=0; i<this.pluginPaths.length; i++) {
      var path=this.pluginPaths[i];
      if (typeof path.path=="string") {
        if (req.path.substr(0,path.path.length)==path.path) { match=true; }
      } else {
        if (req.path.match(path.path)) { match=true; }
      }

      if (match) {
        if (typeof path.path=="string") {
          req.url=req.url.substr(path.path.length,req.url.length);
        } else {
          var res=path.path.exec(req.url);
          req.url=req.url.substr(res[0].length,req.url.length);
        }

        path.handler(req,res,next); return;
      }
    }

    next();
  }
};

module.exports=pluginHandler;