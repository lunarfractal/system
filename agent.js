var rotator = require('stream-rotate');
var child = require('child_process'),
	Log = require('log'),
	Stream = require('stream'),
	destStream = new Stream(),
  	log = exports.log = new Log('debug', destStream);

var serverChild;

var shuttingDown = false;

destStream.writable = true;

writeStream = rotator({
    path: './logs'
  , name: 'server'
  , size: '10m'
  , retention: 10
  });
writeStream.on('error', function(err){
	log.error('Error ' + err);
});  
writeStream.on('rotated',function () {
});

destStream.write = function(data) {
	writeStream.write(data);
};
destStream.end = function(){
}

function spawnServer(){
	serverChild = child.spawn('./server_bin', []);
	log.info("Run ./server_bin");
	serverChild.on('exit', function (code, signal) {
		if(code == 0 || shuttingDown){
			process.exit();
		}

		log.critical('FATAL - SERVER SHUTDOWN');
		if(code)
			log.critical('Exit code ' + code);
		if(signal)
			log.critical('Kill Signal: ' + signal);
		log.critical('Starting server again...');
		serverChild = null;
		setTimeout(spawnServer, 1000);
	});

	serverChild.stdout.pipe(destStream);
	//serverChild.stdin.pipe(destStream);
	serverChild.stderr.pipe(destStream);
}

process.on('SIGINT', function() {
    log.critical("Agent received SIGINT");
    serverChild.kill('SIGINT');
    process.exit();
});

spawnServer()
