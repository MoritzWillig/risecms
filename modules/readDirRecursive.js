var fs = require('fs')
var p = require('path')

/**
 * read an directory structure into an object
 * @param  {string}   path     path to be read
 * @param  {Function} callback callback returning an error an the objcet
 */
function readDirRecursive(path,callback) {
  var obj={};
  readdir(path,obj,function(err) {
    callback(err,obj);
  });
}

function readdir(path, obj, callback) {
  var pending=0;
  fs.readdir(path, function (err, files) {
    if (err) {
      return callback(err)
    }

    var pending = files.length+1;
    var err=null;
    function checkCb(error) {
      pending--;

      //an error was already set
      if (err!=null) { return; }

      if (error!=null) {
        callback(err);
        err=error;
        return;
      }
      if (pending==0) {
        callback(null);
      }
    }
    checkCb(null);

    for (var f in files) {
      var file=files[f];
      var nPath=p.join(path, file);

      (function(path,file) {
        fs.stat(path,function(err,stat) {
          if (stat.isDirectory()) {
            obj[file]={};
            readdir(path, obj[file], function (err) {
              checkCb(err);
            });
          } else {
            obj[file]="file";
            checkCb(null);
          }
        });
      })(nPath,file);
    }
  });
}

module.exports=readDirRecursive;
