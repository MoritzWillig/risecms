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
    return pool;
  }
};


module.exports=database;