var cg; //loaded by set config
var db; //loaded by loadDb
fpath=require("path");
fs=require("fs");
readline=require("readline");
rimraf=require("rimraf");
cp=require('child_process');

rl=readline.createInterface({
  input:process.stdin,
  output:process.stdout
});

var backupSettings={
  tempDir:fpath.resolve(__dirname,"temp"),
  systemPath:fpath.resolve(__dirname,"../"),
  backupPathParam:false, //backup path was set by parameter
  backupPath:"",
  forceOverwrite:false //force overwriting existing system was set by parameter
}

for (var i=2; i<process.argv.length; i++) {
  var val=process.argv[i];
  if (val.substr(0,2)=='-l') {
    var p=val.substr(2,val.length);
    if (p!="") {
      backupSettings.backupPathParam=true;
      backupSettings.backupPath=fpath.resolve(p);
    } else {
      console.log("No backup path argument was given with -l");
    }
  }
  if (val=='-f') {
    backupSettings.forceOverwrite=true;
  }
};

console.log("Rise of Light - Backup");
console.log("Setting up system at location: ", backupSettings.systemPath);
console.log("");

function q0() {
  if (!backupSettings.backupPathParam) {
    rl.question("Where do you want the backup to loaded from?",function(answer) {
      backupSettings.backupPath=fpath.resolve(answer);
      console.log("loading backup from ",backupSettings.backupPath);
      nextStage();
    });
  } else {
    console.log("saving backup to ",backupSettings.backupPath," [set by -l]");
    nextStage();
  }
}


var tempExists=false;
function setupTemp() {
  console.log("creating temp dir: ",backupSettings.tempDir);
  fs.mkdir(backupSettings.tempDir,function(err) {
    if (err) throw err;
    tempExists=true;
    nextStage();
  });
}

function clearTemp() {
  if (tempExists) {
    console.log("deleting temp dir: ",backupSettings.tempDir);
    rimraf(backupSettings.tempDir,function(err) {
      tempExists=false;
      if (err) { throw err; }
      nextStage();
    });
  }
}

function extractBackup() {
  console.log("extracting backup");
  
  var zip=cp.spawn('unzip',[backupSettings.backupPath, "-d", backupSettings.tempDir]);

  zip.stderr.on('data', function (data) { console.log('unzip > ',data.toString()); });

  zip.on('exit', function (code) {
    if (code !== 0) {
      console.log('unzip process exited with code ',code);
      nextStage(true);
    } else {
      nextStage();
    }
  });
}

function testBackupInfo() {
  fs.readFile(backupSettings.tempDir+"/backupInfo.json",function(err,data) {
    if (err) { throw err; }
    var info=JSON.parse(data.toString());

    if (info.backupVersion!="1.0") {
      console.log("unknown backup version",info.backupVersion);
      nextStage(true);
    } else {
      nextStage();
    }
  });
}

function q1() {
  fs.exists(backupSettings.systemPath+'/config.js',function(exists) {
    if ((exists) && (!backupSettings.forceOverwrite)) {
      //ask if installation should be overwriten
      rl.question("an other system setup was detected. Overwrite existing? (y)es",function(answer) {
        if (answer.match(/y(es)?/)) {
          nextStage();
        } else {
          nextStage(true);
        }
      });
    } else {
      console.log('overwriting existing system [set by -f]');
      nextStage();
    }
  });
}

function setConfig() {
  console.log("extracting config and page files");
  fs.rename(backupSettings.tempDir+'/config.js',backupSettings.systemPath+'/config.js', function(err) {
    if (err) { throw err; }
    cg=require(backupSettings.systemPath+'/config.js');

    rimraf(backupSettings.systemPath+'/storage',function(err) {
    rimraf(backupSettings.systemPath+'/public' ,function(err) {
      fs.rename(backupSettings.tempDir+'/storage',backupSettings.systemPath+'/storage', function(err) {
        if (err) { throw err; }
        fs.rename(backupSettings.tempDir+'/public',backupSettings.systemPath+'/public', function(err) {
          if (err) { throw err; }
          nextStage();
        });
      });
    });
    });
  });
}

function loadDb() {
  console.log("creating database structure");
  var dbCmds=[
    ["CREATE DATABASE  IF NOT EXISTS ?? /*!40100 DEFAULT CHARACTER SET latin1 */",[cg.database.pageDb]],
    ["USE ??",[cg.database.pageDb]],
    ["DROP TABLE IF EXISTS ??",[cg.database.pageTable]],
    ["CREATE TABLE ?? (\
      `id` int(11) NOT NULL AUTO_INCREMENT,\
      `section` varchar(45) NOT NULL,\
      `path` varchar(45) NOT NULL,\
      `name` varchar(45) NOT NULL,\
      `uri_name` varchar(45) NOT NULL,\
      `title` varchar(45) NOT NULL,\
      `parent` varchar(45) NOT NULL,\
      `type` varchar(45) NOT NULL DEFAULT 'static',\
      `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,\
      PRIMARY KEY (`id`)\
    ) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT=' '",[cg.database.pageTable]]
  ];
  
  var dbSave=cg.database.pageDb;
  cg.database.pageDb=undefined;
  db=require("../system/models/database").getInstance();
  cg.database.pageDb=dbSave;

  var current=0;
  function nextCmd() {
    console.log("SQL > ",dbCmds[current][0],dbCmds[current][1]);
    db.query(dbCmds[current][0],dbCmds[current][1],function(err) {
      if (err) { throw err; }

      current++;
      if (current>=dbCmds.length) {
        fillTable();
      } else {
        nextCmd();
      }
    });
  }
  nextCmd();

  function fillTable() {
    console.log("creating table entries");
    fs.readFile(backupSettings.tempDir+'/table.json',function(err, data) {
      if (err) { throw err; }
      var tbData=JSON.parse(data.toString());

      var maxId=0;
      var query="INSERT INTO ?? VALUES ";
      var rows=[];
      for (var r in tbData) {
        var row=tbData[r];

        rows.push("("
          +db.escape(row.id)+","
          +db.escape(row.section)+","
          +db.escape(row.path)+","
          +db.escape(row.name)+","
          +db.escape(row.uri_name)+","
          +db.escape(row.title)+","
          +db.escape(row.parent)+","
          +db.escape(row.type)+","
          +db.escape(row.created)+")");

        if (row.id>maxId) { maxId=row.id; }
      }
      db.query(query+rows.join(','),[cg.database.pageTable],function(err, result) {
        if (err) { throw err; }

        //set new auto_increment
        maxId++;
        console.log("next auto increment is",maxId);
        db.query("ALTER TABLE ?? AUTO_INCREMENT = ?",[cg.database.pageTable,maxId],function(err,result) {
          if (err) {throw err; }
          nextStage();
        })
      });
    });
  }
}

function q3() {
  console.log("Setup system successfully");
  nextStage();
}

var currentStage=-1;
var stages=[q0,setupTemp,extractBackup,testBackupInfo,q1,setConfig,loadDb,clearTemp,q3];

function nextStage(abort) {
  if ((abort) || (currentStage+1>=stages.length)) {
    exit();
  } else {
    currentStage++;
    try {
      stages[currentStage]();
    } catch(e) {
      console.log("Internal error");
      exit();
      throw e;
    }
  }
}
nextStage();

rl.on('SIGINT',function() {
  exit();
})

function exit() {
  console.log("exit");
  clearTemp();
  rl.close();
  if (db) {
    db.end();
  }
}

