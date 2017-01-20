const config=require("./conf.json");

const file=require("file"),pm=require("path"),fs=require("fs");

const mime=require("./mime.js");

var g=module.exports=(function init(){
        console.info("File.js initializing...");

        function updateCache(callback){
                console.info("Updating cache. (%s)",config.dynamic_dir);
                function cache(path){
                        var id="/"+pm.relative(config.dynamic_dir,path);
                        console.mass("Path changed from %s -> %s",path,id);
                        fs.readFile(path,function(err,data){
                                if (err) return console.error(err);
                                g.cache[id]=data;
                        });
                }

                var e=file.walkSync(config.dynamic_dir,function(dirPath,dirs,files){
                        for (var g=0,glen=files.length;g<glen;g++){
                                let filename=pm.join(dirPath,files[g]),mimetype=mime.get(filename);

                                console.mass("The mime type of %s is %s",filename,mimetype);
                                if (mime.first(mimetype)=="text") {
                                        console.debug("Caching %s (type %s)",filename,mimetype);
                                        cache(filename);
                                } else {
                                        console.debug("Not caching %s (type %s)",filename,mimetype);
                                }
                        }
                });
                console.info("Cache updated!");
                callback();
        };

        return {
                cache:{},
                updateCache:updateCache
        };
})();
