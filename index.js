"use strict";
require("./console.js");
require("./console-cmd.js");

const config=require("./conf.json");

const http=require("http"),pm=require("path"),cp=require("child_process");

const mime=require("./mime.js"),file=require("./file.js"),serve=require("./serve.js");

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

        var status=200,headers={},body="";

        var filepath=pm.normalize(req.url);

        // Dynamic content
        if (filepath in file.cache){
                status=200;
                headers["content-type"]=mime.get(filepath);
                body=file.cache[filepath];
                headers["content-length"]=Buffer.byteLength(body);
        }else{
                status=404;
                headers["content-type"]="text/plain";
                body=http.STATUS_CODES[status];
                headers["content-length"]=Buffer.byteLength(body);
        }
        res.writeHead(status,headers);
        res.end(body);
        console.log("%s request %s from %s served. (%s)",req.method,req.url,req.connection.remoteAddress,status);
});

cp.fork("./serve.js");

mime.updateCache(function(){
        file.updateCache(function(){
                console.info("Server initialized!");
                server.listen(config.port,function(){
                        console.info("Server now listening on port %s",config.port);
                });
        });
});

process.on("exit",function(){
        console.log("Bye!");
});
