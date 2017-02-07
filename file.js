const file=require("file"),pm=require("path"),fs=require("fs");

console.info("File.js initializing...");

// OLD TODO: Distinguish between updating just the file contents or actually looping through the directories as well?
// XXX Currently it's just the pricy update.
// TODO: Remove external file npm dependency

var dirpaths={};

var exports=module.exports={
        cache:{},
        nodes:{},
        update:function(){
                for (let g in dirpaths) this.loaddir(g);
                console.info("The file cache has been updated!");
        },
        load:function(oldpath){
                var path="/"+pm.relative(config.dynamic_dir,oldpath);

                var mimetype,data;

                var template=false;

                //Check if we need templating (if the base name ends with "!", for example, template.txt!), and do that first
                if (path[path.length-1]=="!"){
                        path=path.slice(0,-1); // Remove last character from the template file name (the !)
                        template=true; // Set the template flag for later
                }

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

                if (data&&template){
                        console.debug("Templating %s -> %s...",oldpath,path);
                        data=template(data);
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
        },
        loaddir:function(dirpath){
                console.info("Loading serve directory recursively (%s)",dirpath);
                dirpaths[dirpath]=true;

                var self=this;
                var e=file.walkSync(dirpath,function(dirpath,dirs,files){
                        for (var file of files){
                                let filepath=pm.join(dirpath,file);

                                // Ignore some specifics
                                if (pm.basename(filepath)[0]=="."){
                                        console.warn("Cache ignoring hidden file %s",filepath);
                                }else{
                                        try{
                                                self.load(filepath);
                                        }
                                        catch(err){
                                                console.error("Cannot cache file %s: %s",filepath,err);
                                        }
                                }

                        }
                });
        }
};

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
