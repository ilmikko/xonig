"use strict";
require("./console.js");

console.time("Server up in");

const http=require("http"),pm=require("path"),cp=require("child_process");

global.extend=function(a,b){for (var g in b) a[g]=b[g];return b;};

global.config=require("./conf.json");

global.mime=require("./mime.js");
global.file=require("./file.js");

// TODO:
// XXX (STILL A TODO, ALBEIT IT'S SOMEWHAT FINISHED RIGHT NOW) V
// XXX ^ 11. Console!!! So that we don't need to restart the server, ever! Also, get dem stats.
// XXX 1. Templating is now a thing that just happens (when storing to RAM)
// XXX 2. Hidden files won't get served (CACHED AT ALL), nope, just won't serve
// XXX 3. Integration with nginx, apache, whatever. Use their mime.types
// 4. JS processing is now a thing that just happens (to text/node files...)
// XXX 5. Ability to access Node.js serve directory (of course! We don't want to serve _everything_, but we want to BE ABLE TO do that.)
// 6. Serving streams... boooooooring...
// ... SEPARATE MODULES?
// 7. MongoDB
// 8. CAS. The bloody CAS.

var server = http.createServer(function(req,res){
        console.debug("Incoming request");
        // 1. Parse the request path
        // 2. Serve the file in RAM (don't serve ANYTHING else (:security:))

        function serve(o){
                res.writeHead(o.status,o.headers);
                res.end(o.body);
                console.log("%s request %s from %s served. (%s)",req.method,req.url,req.connection.remoteAddress,status);
        }

        var filepath=pm.normalize(req.url);

        // TODO: Dynamic content
        // TODO: Serving content
        if (filepath in file.cache){
                // Lightning serving
                file.cache[filepath].serve(req,res,serve);
        }else{
                // Fallback to 404
                var status=404,body=http.STATUS_CODES[status];
                serve({
                        status:status,
                        body:body,
                        headers:{
                                "Content-Type":"text/plain",
                                "Content-Length":Buffer.byteLength(body)
                        }
                });
        }
});

// SUGGESTION: Instead of killing the processes... nah, nvm
var subprocess=(function(){
        var queue=[];

        return {
                fill:function(){
                        queue.push(cp.fork("./serve.js"));

                        var l=queue.length;
                        console.mass("Filling subprocess queue... (%s->%s)...",l-1,l);
                },
                serve:function(req,res,serve){
                        var sp=queue.shift();

                        function strip(request){
                                // What data do we need on the other side?
                                return {
                                        url:url
                                };
                        }

                        sp.on("message",function(data){
                                serve(JSON.parse(data));
                        });

                        sp.send(strip(req));

                        this.fill(); // fill my place when we're done
                }
        };
})();

for (var g=0;g<2;g++) subprocess.fill();

// DEVELOPMENT! From async back to sync!
// Guess why? Because we're loading things.
// And in this case, we're not loading it for the end-user.
// So it will be a lot easier and more efficient in terms of coding to just
// load everything synchronously. We can then do async updates on the fly if we want to.

mime.update();
file.update();

console.info("Server initialized!");
server.listen(config.port,function(){
        console.timeEnd("Server up in");
        console.info("Server now listening on port %s",config.port);
});

process.on("exit",function(){
        console.log("Bye!");
});
