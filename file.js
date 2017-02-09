const file=require("file"),pm=require("path"),fs=require("fs");

console.info("File.js initializing...");

// OLD TODO: Distinguish between updating just the file contents or actually looping through the directories as well?
// XXX Currently it's just the pricy update.
// TODO: Remove external file npm dependency

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

var exports=module.exports={
        cache:{},
        nodes:{},
        dirpaths:{},
        filepaths:{},
        update:function(){
                console.info("Updating the file cache...");
                for (let g in this.dirpaths) this.loaddir(g);
                for (let g in this.filepaths) this.loadfile(g);
                console.info("The file cache has been updated!");
        },
        loadfile:function(filepath){
                console.info("Loading file (%s)",filepath);
                this.filepaths[filepath]=true;

                load(filepath);
        },
        loaddir:function(dirpath){
                console.info("Loading serve directory recursively (%s)",dirpath);
                this.dirpaths[dirpath]=true;

                var self=this;
                var e=file.walkSync(dirpath,function(dirpath,dirs,files){
                        for (var file of files){
                                let filepath=pm.join(dirpath,file);

                                let filename=pm.basename(filepath);
                                // Ignore some specifics
                                if (filename[0]=="."){
                                        console.warn("Cache ignoring hidden file %s",filepath);
                                }else if (filename[filename.length-1]=="!"){
                                        console.warn("Cache ignoring template file %s",filepath);
                                }else{
                                        try{
                                                load(filepath);
                                        }
                                        catch(err){
                                                console.error("Cannot cache file %s: %s",filepath,err);
                                        }
                                }

                        }
                });
        }
};
