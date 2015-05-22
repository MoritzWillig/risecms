/**
 * displays messages at the top of the screen which fade over time
 * @type {Object}
 */
var notificationForm={
  /**
   * dom node containing the notifications
   * @type {dom node}
   */
  gui:undefined,
  config: {
    /**
     * time step after the first message in queue begins fading
     * @type {Number}
     */
    fadeAfter:1500,
    /**
     * time of the fade animation
     * @type {Number}
     */
    fadeDurration:500,
    /**
     * whether or not a mouse move of the messages prevents fading
     * @type {Boolean}
     */
    mouseMoveReset:true,
    /**
     * whether or not a click on the messages removes them directly
     * @type {Boolean}
     */
    mouseClickRemove:true,
    /**
     * margin between the first message and the window
     * @type {Number}
     */
    windowTopSpacing:10,
    /**
     * margin between messages
     * @type {Number}
     */
    elementSpacing:5
  },
  /**
   * queue of currently displayed messages
   * @type {Array}
   */
  queue:[],
  updateQueue:function() {

    if (this.queue.length==0) {
      //clear timer
      clearInterval(this._timer);
      this._timer=undefined;
      return;
    } else {
      if (this._timer==undefined) {
        //this is the first update after an item insert to an empty queue
        var self=this;
        this._timer=setInterval(function() {
          self.updateQueue();
        },80);
        this._resetTimeStep();
      }
    }

    //update first item
    var diff=this._getTimestamp()-this._lastTimestep;

    if (diff>=this.config.fadeAfter+this.config.fadeDurration) {
      //remove item
      this._removeElement(0);
      this._resetTimeStep();
    } else {
      diff-=this.config.fadeAfter;

      //item is fading
      if (diff>=0) {
        //update opacity
        var transparency=diff/this.config.fadeDurration;
        this.queue[0].gui.css("opacity",1-transparency);
      }

      //check if items are already at the right position according to the queue
      var top=0; //initial top value for queue item 0

      //get difference
      var topDiff=this.queue[0].gui.position().top-top;
      if (Math.abs(topDiff)>=1) {
        //items aren't positioned right

        //strategy: half position difference at each step
        topDiff=Math.floor(topDiff/2);

        for (var i=0; i!=this.queue.length; i++) {
          var element=this.queue[i];

          //update position
          element.gui.css("top",top+topDiff);

          //update top value for the next item
          top+=element.gui.outerHeight()+this.config.elementSpacing;
        }
      }
    } //else: timer<config.fadeAfter => do nothing
  },
  /**
   * helper function which returns the current timestamp
   * @return {integer}   current time as timestamp
   */
  _getTimestamp:function() {
    return (+new Date())
  },
  /**
   * displays a message
   * @param  {string} message message to be displayed
   */
  display:function(message) {
    var self=this;
    var element={
      gui:$(document.createElement("div")).addClass("displayElement")
        .text(message).appendTo(this.gui)
        .css("top",this._getQueueTop(this.queue.length)).click(function() {
        if (self.config.mouseClickRemove) {
          self._removeElement(self.queue.indexOf(element));
        }
      }).mousemove(function() {
        if (self.config.mouseMoveReset) {
          //reset remove timer
          self._resetTimeStep();
        }
      })
    };

    this.queue.push(element);
    this.updateQueue();
  },
  _getQueueTop:function(index) {
    var top=0;
    for (var i in this.queue) {
      top+=this.queue[i].gui.outerHeight();
    }
    top+=this.config.elementSpacing*index;

    return top;
  },
  /**
   * removed a message from the current queue
   * @param  {integer} index queue index of the message
   */
  _removeElement:function(index) {
    var element=this.queue.splice(index,1)[0];
    element.gui.remove();
  },
  _timer:undefined,
  /**
   * last timestamp of an item beeing removed
   * @type {Number}
   */
  _lastTimestep:0,
  /**
   * sets _lastTimestep to the current timestep
   * and aborts any message fading
   */
  _resetTimeStep:function() {
    this._lastTimestep=this._getTimestamp();

    //reset opacity of first item
    if (this.queue.length>0) {
      this.queue[0].gui.css("opacity",1);
    }
  },
  /**
   * registers the gui to body to display messages
   */
  _setup:function() {
    var oGui=$(document.createElement("div")).addClass("displayForm")
    .css("top",this.config.windowTopSpacing).appendTo($("body"));

    this.gui=$(document.createElement("div")).addClass("displayFormWrapper")
    .appendTo(oGui);

  }
};

(function() {
  $(document).ready(function() {
    notificationForm._setup();
  });
})();