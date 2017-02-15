"use strict";
require("./js/console.js");

console.time("Server up in");

const http=require("http"),pm=require("path"),cp=require("child_process");

global.extend=function(a,b){for (var g in b) a[g]=b[g];return a;};

global.config=require("./conf.json");

global.mime=require("./js/mime.js");
global.file=require("./js/file.js");

global.pool=require("./js/pool.js");

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

global.server = http.createServer(function(req,res){
        console.debug("Incoming request");
        var path=pm.normalize(req.url);

        // Loop through pools, see if the path matches
        pool.serve({req:req,res:res,path:path},function final(o){
                res.writeHead(o.status,o.headers);
                res.end(o.body);
                console.log("%s request %s from %s served. (%s)",req.method,req.url,req.connection.remoteAddress,o.status);
        });
});

// SUGGESTION: Instead of killing the processes... nah, nvm
global.subprocess=(function(){
        var queue=[];

        return {
                fill:function(){
                        queue.push(cp.fork("./js/serve.js"));

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
pool.update();
file.update();

console.info("Server initialized!");
server.listen(config.port,function(){
        console.timeEnd("Server up in");
        console.info("Server now listening on port %s",config.port);
});

process.on("exit",function(){
        console.log("Bye!");
});
