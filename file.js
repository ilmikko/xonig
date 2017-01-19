const config=require("./conf.json");

const file=require("file"),pm=require("path"),fs=require("fs");

const mime=require("./mime.js");

var cache={};

function ext(path){
        return "."+pm.basename(path).replace(/.*\./,"");
}

module.exports=(function init(){
        console.info("File.js initializing...");

        function updateCache(){
                console.log("Updating cache. (%s)",config.dynamic_dir);
                function cache(path){
                        var id="/"+pm.relative(config.dynamic_dir,path);
                        console.debug("Caching %s -> %s",path,id);
                        fs.readFile(path,function(err,data){
                                if (err) return console.error(err);
                                cache[id]=data;
                        });
                }

                file.walk(config.dynamic_dir,function(a,b,c,files){
                        if (files) for (var g=0,glen=files.length;g<glen;g++){
                                let filename=files[g];

                                var mimetype=mime.exts[ext(filename)];
                                //console.debug("The mime type of %s is %s",filename,mimetype);
                                if (mime.first(mimetype)=="text") cache(files[g]);
                        }
                });
        };

        return {
                updateCache:updateCache
        };
})();
