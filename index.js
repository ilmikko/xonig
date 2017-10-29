"use strict";
require('./js/console.js');

console.time('Server up in');

console.debug('Starting in '+__dirname);
process.chdir(__dirname);

console.debug('Loading modules...');

console.mass('Internal modules...');
const cp=require('child_process');

global.vm=require('vm');
global.pm=require('path');
global.fs=require('fs');
global.http=require('http');
global.https=require('https');

(function loadModules(){
        global.extend=function(a,b){for (var g in b) a[g]=b[g];return a;};

        console.mass('Reading configs...');
        global.config=require("./conf.json");

        console.mass('Own modules...');
        global.qs=require('./js/qs.js');
        global.mime=require('./js/mime.js');
        global.file=require('./js/file.js');

        global.db=require('./js/db.js');

        global.pool=require('./js/pool.js');

        global.subprocess=(function(){
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
        })();
})();
console.info('All modules loaded.');

// TODO:
// Console stats
// MongoDB integration (for dynamic scripts, easy connect/disconnect, retrieval of values, full access to db)
// Physical cache: Serving streams... boooooooring...
//
// Not strictly part of the server, but dynamic files should also include the CAS with Mongo / other DB auth

(function(){
        let max=config.max_processes;
        console.debug("Filling processes (max: %s)...",max);
        for (var g=0;g<max;g++) subprocess.fill();
        console.info("Processes filled to max (%s)",max);
})();

// DEVELOPMENT! From async back to sync!
// Guess why? Because we're loading things.
// And in this case, we're not loading it for the end-user.
// So it will be a lot easier and more efficient in terms of coding to just
// load everything synchronously. We can then do async updates on the fly if we want to.

// XXX HOWEVER, we still need to handle a race condition when we have async modules like MongoDB.
// TODO: Handle race condition

mime.update();
pool.update();
console.info('Server initialized!');

function parseRequest(req,res,success,error){
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
                console.log('CONNECTION LOST');
        });
        req.on('end',function(){
                console.log('CONNECTION FIN');
        });
        res.on('error',function(err){
                console.error('RES '+err);
        });

        var url=decodeURIComponent(req.url); // TODO: normalize the URI
        var headers=req.headers;

        // URI variables (sync)
        var data={};
        var si=url.indexOf('?')+1;
        var path=url;
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

                success({
                        req:req,
                        res:res,
                        path:path,
                        data:data
                });
        });
}

// TODO: Launch server only when everything has loaded (race condition)
console.info('Launching server...');
(function launchServer(){
        global.server = http.createServer(function(req,res){
                console.debug('Incoming request');

                // Parse request first
                parseRequest(req,res,function success(o){
                        // Loop through pools, see if the path matches
                        pool.serve(o,function final(r){
                                res.writeHead(r.status,r.header);
                                res.end(r.body);
                                console.info("%s: %s request served. (%s)",r.IP,req.method,req.url,r.status);
                        });
                });

        }).listen(config.port,function(){
                console.info("Server now listening on port %s",config.port);

                console.timeEnd('Server up in');
        });
})();

// XXX: SSL/TLS
if (config.tls.enabled) {
        console.debug('Launching SSL/TLS server...');
        (function launchTLSServer(){
                console.debug('Initializing SSL/TLS server...');
                global.server_tls = https.createServer({
                        key: file.get(config.tls.key),
                        cert: file.get(config.tls.cert),
                        passphrase: config.tls.pass || null
                },function(req,res){
                        console.debug('Incoming request (SSL/TLS)');

                        // Parse request
                        parseRequest(req,res,function success(o){
                                // Loop through pools, see if the path matches
                                pool.serve(o,function final(r){
                                        res.writeHead(r.status,r.header);
                                        res.end(r.body);
                                        console.info("%s: %s request (SSL/TLS) served. (%s)",r.IP,req.method,req.url,r.status);
                                });
                        });
                }).listen(config.tls.port,function(){
                        console.info("Server (SSL/TLS) now listening on port %s",config.tls.port);
                });
        })();
}

process.on('exit',function(){
        // XXX: Things to do when exiting
        console.log('Bye!');
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
