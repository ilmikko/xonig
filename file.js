const file=require("file"),pm=require("path"),fs=require("fs");

console.info("File.js initializing...");

// OLD TODO: Distinguish between updating just the file contents or actually looping through the directories as well?
// XXX Currently it's just the pricy update.

var dirpaths={};

var exports=module.exports={
        cache:{},
        update:function(){
                for (let g in dirpaths) this.loaddir(g);
                console.info("The file cache has been updated!");
        },
        load:function(path){
                // TODO: clean this up

                var id="/"+pm.relative(config.dynamic_dir,path);

                var mimetype,data;

                //Check if we need templating (if the base name ends with "!", for example, template.txt!)
                if (id[id.length-1]=="!"){
                        console.debug("TEMPLATE:%s",path);
                        id=id.slice(0,-1); // Remove last character from the template file name (the !)

                        mimetype=mime.get(id); // Now we can get the "real" mime type

                        console.mass("Reading %s as it's a template...",path);
                        data=fs.readFileSync(path);

                        console.mass("Templating %s...",path);
                        data=template(data);
                }else{
                        mimetype=mime.get(id);

                        // Non-text files will be streamed later by the serve process
                        if (mime.first(mimetype)=="text"){
                                console.mass("Reading %s...",path);
                                data=fs.readFileSync(path);
                        }else{
                                console.warn("Cache ignoring non-text file %s (type %s)",path,mimetype);
                                return;
                        }
                }

                console.mass("Path changed from %s -> %s",path,id);
                this.cache[id]={
                        status:200,
                        body:data,
                        headers:{
                                "x-server":"Hello there, you were served by this and this server",
                                "content-length":Buffer.byteLength(data),
                                "content-type":mime.get(id)
                        }
                };
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
