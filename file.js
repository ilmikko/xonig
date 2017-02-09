const file=require("file"),pm=require("path"),fs=require("fs");

console.info("File.js initializing...");

// OLD TODO: Distinguish between updating just the file contents or actually looping through the directories as well?
// XXX Currently it's just the pricy update.
// TODO: Remove external file npm dependency

function direach(dirpath,callback){
        dirpath=pm.normalize(dirpath);
        console.debug("Loading directory recursively (%s)",dirpath);
        file.walkSync(dirpath,function(dp,dirs,files){
                for (var file of files){
                        let filepath=pm.join(dp,file),filename=pm.basename(file);

                        // Ignore hidden files
                        if (filename[0]=="."){
                                console.warn("Ignoring hidden file %s",filepath);
                        }else{
                                callback(filepath.replace(dirpath,""));
                        }
                }
        });
}

function load(oldpath){
        var path="/"+pm.relative(config.dynamic_dir,oldpath);

        var mimetype,data;

        mimetype=mime.get(path);

        function testcache(){
                for (type of config.mime.cache_types){
                        // check if mime type matches (if we need to cache this file)
                        if (mime.match(mimetype,type)){
                                console.mass("Caching %s...",oldpath);
                                data=fs.readFileSync(oldpath);
                                return true;
                        }
                }
                return false;
        }

        function testserve(){
                for (type of config.mime.serve_types){
                        // check if mime type matches and we need to serve this file
                        if (mime.match(mimetype,type)){
                                console.mass("Serve match: %s",oldpath);
                                data=fs.readFileSync(oldpath);
                                return true;
                        }
                }
                return false;
        }

        if (testcache()){
                this.cache[path]={
                        status:200,
                        body:data,
                        headers:{
                                "content-length":Buffer.byteLength(data),
                                "content-type":mime.get(path)
                        }
                };
        }else if (testserve()){
                this.nodes[path]=data;
        }else{
                console.warn("Ignoring %s",oldpath);
        }
}

var static=(function(){
        return {
                dir:config.static_dir,
                update:function(){
                        var dirpath=this.dir;
                        console.log("Loading static files from (%s)...",dirpath);

                        var cache={};

                        direach(dirpath,function(filepath){
                                var mimetype=mime.get(filepath),realpath=dirpath+filepath;

                                if (!mime.match(mimetype,config.mime.cache_types)){
                                        console.mass("Skipping %s (mime mismatch (%s doesn't match regex %s))",realpath,mimetype,config.mime.cache_types);
                                        return;
                                }

                                try{
                                        var data=fs.readFileSync(realpath,"utf-8");
                                        cache[filepath]={
                                                status:200,
                                                body:data,
                                                headers:{
                                                        "Content-Type":mimetype,
                                                        "Content-Length":Buffer.byteLength(data)
                                                }
                                        };
                                }
                                catch(err){
                                        console.warn("Cannot load static file: %s!",realpath);
                                }
                        });
                }
        };
})();

var dynamic=(function(){
        return {
                dir:config.dynamic_dir,
                update:function(){
                        var dirpath=this.dir;
                        console.log("Loading dynamic files from (%s)...",dirpath);
                        direach(dirpath,function(filepath){

                        });
                }
        };
})();

var template=(function(){
        function template(data){
                // TODO: cleanup
                return data.toString().replace(/<~<([\s\S]*?)>~>/g,function(_,_1){
                        try{
                                return Function(_1)()||"";
                        }
                        catch(err){
                                console.error("Cannot parse templating script!");
                                console.mass("Error near: %s",_1);
                                throw new Error("Templating error");
                        }
                });
        }

        return {
                dir:config.template_dir,
                update:function(){
                        var dirpath=this.dir;
                        console.log("Loading template files from (%s)...",dirpath);
                        direach(dirpath,function(filepath){

                        });
                }
        };
})();

var exports=module.exports={
        cache:{},
        static:static,
        dynamic:dynamic,
        template:template,
        update:function(){
                console.info("Updating the file cache...");
                var cache={};
                extend(cache,this.static.update());
                extend(cache,this.dynamic.update());
                extend(cache,this.template.update());
                this.cache=cache;
                console.info("The file cache has been updated!");
        }
};
