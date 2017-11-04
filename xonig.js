"use strict";
require('./js/console.js');

console.time('Server up in');

console.mass('Load internal modules...');
const cp=require('child_process'),pm=require('path'),fs=require('fs'),http=require('http'),https=require('https'),etag=require('etag');
var qs;

console.debug('Starting in '+__dirname);
process.chdir(__dirname);

global.extend=function(a,b){
	for (var g in b) if (typeof a[g]==='object'&&typeof b[g]==='object') a[g]=extend(a[g],b[g]); else a[g]=b[g];
	return a;
};

module.exports=global.xonig={
	cp:cp,
	pm:pm,
	fs:fs,
	http:http,
	https:https,
	etag:etag,
	config:{},
	checkConfig:function(){
		if (config.production){
			// Production mode
			if (config.debug) {
				this.closeServer(); // Refuse to serve anything
				throw new Error("FATAL: Both debug and production flags are true; refusing to start.");
			}
			console.important('Production mode active.');
		}else{
			// Warn about debug mode
			if (config.debug) console.important('Debug mode is active, make sure to disable this before production!');
		}
	},
	reloadConfig:function(){
		console.debug('Reading configs...');
		global.config=JSON.parse(fs.readFileSync('./conf.json'));
	},
	loadModules:function(){
		console.debug('Loading modules...');

		console.mass('Own modules...');
		this.qs=qs=require('./js/qs.js');
		this.mime=require('./js/mime.js');
		this.file=require('./js/file.js');

		this.db=require('./js/db.js');

		this.pool=require('./js/pool.js');

		console.info('All modules loaded.');
	},
	serve:function(req,res){
		return new Promise(function(fulfill,reject){
			/*
		                HTTP body variables take a precedence over URI variables.
		                It's not advisable to use variables on GET requests to change the body content
		                (https://tools.ietf.org/html/rfc2616#section-4.3)
		                but that is up for the server-side script programmer to keep in mind.
		                This tool combines all of the data to the DATA object - no matter what
		                their origin was.
		        */

			req.on('error',function(err){
		                console.error('REQ '+err);
		        });
		        req.on('close',function(){
		                console.mass('CONNECTION LOST');
		        });
		        req.on('end',function(){
		                console.mass('CONNECTION FIN');
		        });
		        res.on('error',function(err){
		                console.error('RES '+err);
		        });

		        var url=decodeURIComponent(req.url); // TODO: normalize the URI
		        var headers=req.headers;

		        // URI variables (sync)
		        var data={};
			var path=url;
		        var si=url.indexOf('?')+1;
		        if (si){
		                path=url.slice(0,si-1);
		                data=qs.parse(url.slice(si));
		        }

		        // HTTP Body variables (async)
		        var body='';

		        req.on('data',function(data){
		                body+=data;
		        });
		        req.on('end',function(){
		                // Parse body
		                if (body) extend(data,qs.parse(body));

				xonig.pool.serve({
		                        req:req,
		                        res:res,
		                        path:path,
		                        data:data
		                },function final(r){
					fulfill({
						ip:r.ip,
						method:req.method,
						path:req.url,
						status:r.status
					});
				});
		        });
		}).catch((err,info)=>{
			console.error("%s: %s request to %s failed: %s (%s)",info.ip,info.method,info.path,err,info.status);
		}).then((info)=>{
			console.info("%s: %s request to %s served. (%s)",info.ip,info.method,info.path,info.status);
		});
	},
	closeServer:function(){
		console.info('Closing server...');
		if (this.server){
			this.server.close();
			delete this.server;
		}
	},
	restartServer:function(){
		if (this.server){
			console.debug('Kill previous server');
			this.closeServer();
		}

		var self=this;

		// TODO: Launch server only when everything has loaded (race condition)
		console.info('Launching server...');
		this.server = this.http.createServer(this.serve).listen(config.port,function(){
			console.info("Server now listening on port %s",config.port);
			console.timeEnd('Server up in');
		});

		// XXX: SSL/TLS
		if (config.tls.enabled) {
		        console.debug('Launching SSL/TLS server...');
			global.server_tls = this.https.createServer({
				key: file.get(config.tls.key),
				cert: file.get(config.tls.cert),
				passphrase: config.tls.pass||null
			},this.serve).listen(config.tls.port,function(){
				console.info("Server (SSL/TLS) now listening on port %s",config.tls.port);
			});
		}
	},
	init:function(){
		this.loadModules();

		// TODO: clean this up
		this.subprocess=(function(){
			var queue=[];

			return {
				fill:function(){
					queue.push(cp.fork('./js/serve.js'));

					var l=queue.length;
					console.mass("Filling subprocess queue... (%s->%s)...",l-1,l);
				},
				serve:function(req,res,serve){
					var sp=queue.shift();

					function strip(request){
						// What data do we need on the other side (subprocess fork)?
						return {
							url:url
						};
					}

					sp.on('message',function(data){
						serve(JSON.parse(data));
					});

					sp.send(strip(req));

					this.fill(); // fill my place when we're done
				}
			};

			/*(function(){
			        let max=config.max_processes;
			        console.debug("Filling processes (max: %s)...",max);
			        for (var g=0;g<max;g++) subprocess.fill();
			        console.info("Processes filled to max (%s)",max);
			})();*/
		})();

		this.mime.update();
		this.pool.update();
		console.info('Server initialized!');
	},
	start:function(_config){
		return new Promise((fulfill,reject)=>{
			// XXX HOWEVER, we still need to handle a race condition when we have async modules like MongoDB.

			try{
				this.reloadConfig();
				extend(global.config,_config);
				this.checkConfig();

				this.init();

				this.restartServer();
			}
			catch(err){
				reject(err);
				throw err;
			}
			// TODO: Handle race condition
			fulfill();
		});
	},
	close:function(){
	        // XXX: Things to do when exiting
		return new Promise((fulfill,reject)=>{
			console.mass('Bye!');
			xonig.closeServer();
			fulfill();
		});
	}
};

// TODO:
// Console stats
// Not strictly part of the server, but dynamic files should also include the CAS with Mongo / other DB auth

// DEVELOPMENT! From async back to sync!
// Guess why? Because we're loading things.
// And in this case, we're not loading it for the end-user.
// So it will be a lot easier and more efficient in terms of coding to just
// load everything synchronously. We can then do async updates on the fly if we want to.


process.on('exit',function(){
	// make sure to close xonig on exit
	xonig.close();
});

// DEBUG: Console command 'flush'
console.command.add('flush',function(path){
        console.info('Fast flush of pools and mime types...');
        pool.update();
        mime.update();
},{
        help:"Flush the pools and mime types.\nUsage: flush\nThis command is lazily used for debugging purposes when there needs to be a fast update of the pools or mime types or whatever.\nIn production environments it is recommended to update everything by hand by using 'pool.update()' or 'mime.update()' (please use 'inspect' for more information), or alternatively perform a hard reset on the server service.\nHowever, for convenience, this command flushes all the needed information for easy scripting."
});

// DEBUG: Console command 'request'
console.command.add('request',function(path){
        // Return help if path is undefined
        if (!path) return console.command.run['help']('request');

        console.debug("GET Request (Console): %s",path);

        var req=http.request({
                path:path,
                port:config.port,
                hostname:'localhost',
                method:'GET'
        },function(res){
                console.debug("Response: %s",res.statusCode);
                console.log("Headers: %s",JSON.stringify(res.headers));
                var data='';
                res.on('data',function(chunk){
                        data+=chunk;
                });
                res.on('end',function(){
                        console.back(data);
                });
                res.on('error',function(err){
                        console.error("Response error: %s",err);
                });
        });
        req.on('error',function(err){
                console.error("Request error: %s",err);
        });
        req.end();
},{
        help:"Make a request to the server\nUsage: request [path]\nThis command makes a request to the server 'itself', and then prints out what the server responds."
});
