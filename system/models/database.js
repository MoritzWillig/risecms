var gc         = require('../../config.js');
var mysql      = require('mysql');

var connection = mysql.createConnection({ //TODO: create pool
  host     : gc.database.host,
  port     : 3306,
  user     : gc.database.user,
  password : gc.database.password,
  database : gc.database.pageDb
});

//TODO: reconnect on connection loss

connection.connect(function(err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }

  console.log('connected to database');
});

database={
  getInstance:function() {
    return connection;
  }
};


module.exports=database;