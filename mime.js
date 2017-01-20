const config=require("./conf.json");

var exts={},types={};

const pm=require("path"),fs=require("fs");

const extend=function(a,b){for (var g in b) a[g]=b[g];return b;}

function extension(path){
        return "."+pm.basename(path).replace(/.*\./,"");
}

module.exports=(function init(){
        console.info("Mime.js initializing...");

        function updateCache(callback){
                console.info("Updating mime type cache...");
                // Currently only nginx's mime file type supported, feel free to make your own parser! :)
                var parser=function(data){
                        data.toString().replace(/types\s*{([\s\S]*)}/g,function(_,_1){
                                (_1||"").replace(/(\S+)\s+([^;]*?);/g,function(_,_1,_2){
                                        _2=_2.split(/\s/);
                                        types[_1]=_2;
                                        for (var g=0,glen=_2.length;g<glen;g++) exts["."+_2[g]]=_1;
                                });
                        });
                };

                console.log("Loading mime types from disk...");
                var data=fs.readFileSync(config.mimetypes_file_path,function(err){
                        if (err){
                                console.warn("Cannot load mime types from disk! "+err);
                        }
                });
                try{
                        extend(types,parser(data));
                        console.info("Mime types updated!");
                        if (callback) callback();
                }
                catch(err){
                        console.warn("Error parsing mime types from disk! "+err);
                }
        }

        return {
                updateCache:updateCache,
                types:types,
                exts:exts,
                get:function(path){
                        return exts[extension(path)]||config.mimetypes_default;
                },
                split:function(mime){
                        return mime.split("/");
                },
                first:function(mime){
                        return this.split(mime)[0];
                },
                last:function(mime){
                        return this.split(mime)[1];
                }
        };
})();
