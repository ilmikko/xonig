require("./console.js");
console.info("Initializing...");

const config=require("./conf.json");

const http=require("http");

const mime=require("./mime.js"),file=require("./file.js"),serve=require("./serve.js");

// TODO:
// What am I TRYING TODO here?
// 1. Templating is now a thing that just happens (when storing to RAM)
// 2. Hidden files won't get served, nope, just won't serve
// 3. Integration with nginx, apache, whatever. Use their mime.types
// 4. JS processing is now a thing that just happens (to text/node files...)
// 5. Ability to access Node.js serve directory (of course! We don't want to serve _everything_, but we want to BE ABLE TO do that.)
// 6. Serving streams... boooooooring...
// ... SEPARATE MODULES?
// 7. MongoDB
// 8. CAS. The bloody CAS.

var server = http.createServer(function(req,res){
        console.debug("Incoming request");
        // 1. Parse the request path
        // 2. Serve the file in RAM (don't serve ANYTHING else (:security:))

        var status=200,headers={},body="";

        var filepath=req.url;

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

mime.updateCache(function(){
        file.updateCache(function(){
                console.info("Server initialized!");
                server.listen(config.port,function(){
                        console.info("Server now listening on port %s",config.port);
                });
        });
});
