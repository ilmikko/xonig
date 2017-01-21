const config=require("./conf.json");

const file=require("file"),pm=require("path"),fs=require("fs");

const mime=require("./mime.js");

console.info("File.js initializing...");

var exports=module.exports={
        cache:{},
        updateCache:updateCache
};

function template(data){
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

function updateCache(callback){
        console.info("Updating cache. (%s)",config.dynamic_dir);
        function cache(path){
                var id="/"+pm.relative(config.dynamic_dir,path);

                var mimetype,data;

                //Check if we need templating (if the base name ends with "!", for example, template.txt!)
                if (id[id.length-1]=="!"){
                        console.debug("TEMPLATE:%s",path);
                        id=id.slice(0,-1); // Remove last character (the !)

                        mimetype=mime.get(id);

                        console.mass("Reading %s as it's a template...",path);
                        data=fs.readFileSync(path);

                        console.mass("Templating %s...",path);
                        data=template(data);
                }else{
                        console.debug("CACHING :%s",path);

                        mimetype=mime.get(id);
                        if (mime.first(mimetype)!="text"){
                                console.debug("IGNORING:%s",path);
                                console.warn("Cache ignoring non-text file %s (type %s)",path,mimetype);
                                return;
                        }

                        console.mass("Reading %s...",path);
                        data=fs.readFileSync(path);
                }

                console.mass("Path changed from %s -> %s",path,id);
                exports.cache[id]=data;
        }

        var e=file.walkSync(config.dynamic_dir,function(dirPath,dirs,files){
                for (var g=0,glen=files.length;g<glen;g++){
                        let filepath=pm.join(dirPath,files[g]);

                        // Ignore some specifics
                        if (pm.basename(filepath)[0]=="."){
                                console.warn("Ignoring hidden file %s",filepath);
                        }else{
                                try{
                                        cache(filepath);
                                }
                                catch(err){
                                        console.error("Cannot cache file %s: %s",filepath,err);
                                }
                        }

                }
        });
        console.info("Cache updated!");
        callback();
};
