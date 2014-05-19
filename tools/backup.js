cg=require('../config.js');
db=require("../system/models/database").getInstance();
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
  backupPathParam:false,
  backupPath:""
}

for (var i=2; i<process.argv.length; i++) {
  var val=process.argv[i];
  
  if (val.substr(0,2)=='-p') {
    var p=val.substr(2,val.length);
    if (p!="") {
      backupSettings.backupPathParam=true;
      backupSettings.backupPath=fpath.resolve(p);
    } else {
      console.log("No backup path argument was given with -p");
    }
  }
};


console.log("Rise of Light - Backup");
console.log("Backup system at location: ", backupSettings.systemPath);
console.log("");

function q0() {
  if (!backupSettings.backupPathParam) {
    rl.question("Where do you want the backup to be saved?",function(answer) {
      backupSettings.backupPath=fpath.resolve(answer);
      console.log("saving backup to ",backupSettings.backupPath);
      nextStage();
    });
  } else {
    console.log("saving backup to ",backupSettings.backupPath," [set by -p]");
    nextStage();
  }
}

function q1() {
  console.log("starting backup");
  nextStage();
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

function writeBackupInfo() {
  var info={
    backupVersion:"1.0"
  };

  fs.writeFile(backupSettings.tempDir+'/backupInfo.json',JSON.stringify(info),function(err) {
    if (err) { throw err; }
    nextStage();
  });
}

function dumpDb() {
  console.log("querying database");
  var query=db.query('SELECT * FROM ??',[cg.database.pageTable],function(err, result) {
    if (err) { throw err; }

    console.log("saving database");
    var table=JSON.stringify(result);
    fs.writeFile(backupSettings.tempDir+'/table.json', table, function(err) {
      if (err) throw err;
      nextStage();
    });
  });
}

function copyConfig() {
  console.log("saving config file");
  copyFile(backupSettings.systemPath+'/config.js',backupSettings.tempDir+'/config.js',function(err) {
    if (err) { throw err; }
    nextStage();
  });
}

function copyFile(source, target, cb) {
  var cbCalled = false;

  var rd = fs.createReadStream(source);
  rd.on("error", function(err) { done(err); });
  var wr = fs.createWriteStream(target);
  wr.on("error", function(err) { done(err); });

  wr.on("close", function(ex) { done(); });
  rd.pipe(wr);

  function done(err) {
    if (!cbCalled) {
      cb(err);
      cbCalled = true;
    }
  }
}

var compressPaths=[
  [backupSettings.tempDir   ,'.'],
  [backupSettings.systemPath,'config.js'],
  [backupSettings.systemPath,'storage'],
  [backupSettings.systemPath,'public']
];
function compressTemp() {
  console.log("compressing backup");
  
  var current=0;

  function compressNext() {
    console.log('compressing ',compressPaths[current]);

    var zip=cp.spawn('zip',['-r', backupSettings.backupPath, compressPaths[current][1]],{
      cwd:compressPaths[current][0]
    });

    zip.stderr.on('data', function (data) { console.log('zip > ',data.toString()); });

    zip.on('exit', function (code) {
      if (code !== 0) {
        console.log('zip process exited with code ',code);
        nextStage(true);
      } else {
        current++;
        if (current>=compressPaths.length) {
          nextStage();
        } else {
          compressNext();
        }
      }
    });
  }

  compressNext();
}

function q3() {
  console.log("Finished backup");
  nextStage();
}

var currentStage=-1;
var stages=[q0,q1,setupTemp,writeBackupInfo,dumpDb,copyConfig,compressTemp,clearTemp,q3];

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
  db.end();
}

