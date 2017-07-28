"use strict";
require('./js/console.js');

console.time('Server up in');

console.info('Loading modules...');

console.mass('Internal modules...');
const http=require('http'),https=require('https'),pm=require('path'),cp=require('child_process');

(function loadModules(){
        global.extend=function(a,b){for (var g in b) a[g]=b[g];return a;};

        console.mass('Reading configs...');
        global.config=require("./conf.json");

        console.mass('Own modules...');
        global.mime=require("./js/mime.js");
        global.file=require("./js/file.js");

        global.pool=require("./js/pool.js");

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
        console.info("Filling processes (max: %s)...",config.max_processes);
        for (var g=0;g<config.max_processes;g++) subprocess.fill();
        console.info('Processes filled');
})();

// DEVELOPMENT! From async back to sync!
// Guess why? Because we're loading things.
// And in this case, we're not loading it for the end-user.
// So it will be a lot easier and more efficient in terms of coding to just
// load everything synchronously. We can then do async updates on the fly if we want to.

mime.update();
pool.update();
console.info("Server initialized!");

function parseQueryString(qs){
        var data={};

        qs=qs.split('&');
        for (let p of qs){
                // Parse key-value pairs
                let pi=p.indexOf('=')+1;

                // If there is an '=' in p
                if (pi){
                        var k=decodeURIComponent(p.slice(0,pi-1)), v=decodeURIComponent(p.slice(pi));
                        data[k]=v;
                }else{
                        // XXX: 'empty' URL data is true because it exists
                        // For example: /path/to/my/application?debugmode
                        data[p]=true;
                }
        }

        return data;
}

function parseRequest(req,res,success,error){
        /*
                HTTP body variables take a precedence over URI variables.
                It's not advisable to use variables on GET requests to change the body content
                (https://tools.ietf.org/html/rfc2616#section-4.3)
                but that is up for the server-side script programmer to keep in mind.

                This tool combines all of the variables into one combined $.data object.
                For convenience, we could also provide $.dataURI and $.dataBody to separate data
                So you can use code like
                if ($.method=='GET'){
                        // use $.dataURI
                }
                else if ($.method=='POST')
                {
                        // use $.dataBody
                }

                But I think we're fine using just $.data.
        */

        var url=req.url; // TODO: normalize the URI
        var headers=req.headers;

        console.info("HEADERS:");
        console.info(JSON.stringify(headers));

        var data={};
        var si=url.indexOf('?')+1;
        var path=url;
        if (si){
                // parse URI variables
                path=url.slice(0,si-1);
                data=parseQueryString(url.slice(si));
        }

        // HTTP Body variables (async)
        var body='';

        req.on('error',function(err){
                console.error("Request connection error %s",err);
                error(err);
        });
        req.on('data',function(data){
                body+=data;
        });
        req.on('end',function(){
                // Parse body
                console.log('Body: '+body);
                extend(data,parseQueryString(body));

                success({
                        req:req,
                        res:res,
                        path:path,
                        data:data
                });
        });
}

console.info('Launching server...');
(function launchServer(){
        global.server = http.createServer(function(req,res){
                console.debug('Incoming request');

                // Parse request first
                parseRequest(req,res,function success(o){
                        // Loop through pools, see if the path matches
                        pool.serve(o,function final(o){
                                res.writeHead(o.status,o.headers);
                                res.end(o.body);
                                console.log("%s request %s from %s served. (%s)",req.method,req.url,req.connection.remoteAddress,o.status);
                        });
                },function error(){
                        console.error('Did not serve request');
                });

        }).listen(config.port,function(){
                console.info("Server now listening on port %s",config.port);

                console.timeEnd('Server up in');
        });
})();

// XXX: SSL/TLS
if (config.tls.enabled) {
        console.info("Launching SSL/TLS server...");
        (function launchTLSServer(){
                console.info("Initializing SSL/TLS server...");
                global.server_tls = https.createServer({
                        key: file.get(config.tls.key),
                        cert: file.get(config.tls.cert),
                        passphrase: config.tls.pass || null
                },function(req,res){
                        console.debug("Incoming request (SSL/TLS)");
                        var path=pm.normalize(req.url);

                        // Loop through pools, see if the path matches
                        pool.serve({req:req,res:res,path:path},function final(o){
                                res.writeHead(o.status,o.headers);
                                res.end(o.body);
                                console.log("%s request (SSL/TLS) %s from %s served. (%s)",req.method,req.url,req.connection.remoteAddress,o.status);
                        });
                }).listen(config.tls.port,function(){
                        console.info("Server (SSL/TLS) now listening on port %s",config.tls.port);
                });
        })();
}

process.on("exit",function(){
        // XXX: Things to do when exiting
        console.log("Bye!");
});

// DEBUG: Console command 'request'
console.command.add('request',function(path){
        // Return help if path is undefined
        if (!path) return console.command.run['help']('request');

        console.debug("GET Request (Console): %s",path);

        var req=http.request({
                path:path,
                port:config.port,
                hostname:"localhost",
                method:"GET"
        },function(res){
                console.debug("Response: %s",res.statusCode);
                console.log("Headers: %s",JSON.stringify(res.headers));
                var data="";
                res.on("data",function(d){
                        data+=d;
                });
                res.on("end",function(){
                        console.back(data);
                });
                res.on("error",function(err){
                        console.error("Response error: %s",err);
                });
        });
        req.on("error",function(err){
                console.error("Request error: %s",err);
        });
        req.end();
},{
        help:"Make a request to the server\nUsage: request [path]\nThis command makes a request to the server 'itself', and then prints out what the server responds."
});
