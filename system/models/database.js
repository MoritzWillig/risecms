var gc         = require('../../config.js');
var mysql      = require('mysql');

var pool = mysql.createPool({
  connectionLimit:10,
  queueLimit:0, //no limit to request queue 
  host     : gc.database.host,
  port     : 3306,
  user     : gc.database.user,
  password : gc.database.password,
  database : gc.database.pageDb
});

/*
pool.connect(function(err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }

  console.log('connected to database');
});
*/

database={
  getInstance:function() {
    return {
      pool:pool,
      query:function(sql,values,cb) {
        return pool.query(sql,values,database._createCallback(cb));
        
        /*
        function(err,data,meta) {
          var result=cb.apply(this,[err,data,meta]);

          //delete references to free memory
          delete sql;
          delete values;
          delete cb;

          return result;
        });
        */
      }
    };
  },
  _createCallback:function(cb) {
    return function(err,data,meta) {
      //remove function reference!
      delete this._callback;
      cb(err,data,meta);
      delete cb;
    }
  }
};


module.exports=database;