const pm=require("path"),fs=require("fs");

console.info("Mime.js initializing...");

const JSONRegExp=require("./JSONRegExp.js");

function extension(path){
        return "."+pm.basename(path).replace(/.*\./,"");
}

const parse=function(data){
        var types={},exts={};

        // Parses the default .types file that comes with at least nginx (TODO: Check for other syntaxes)
        data.toString().replace(/types\s*{([\s\S]*)}/g,function(_,_1){
                (_1||"").replace(/(\S+)\s+([^;]*?);/g,function(_,_1,_2){
                        _2=_2.split(/\s/);
                        types[_1]=_2;
                        for (var g=0,glen=_2.length;g<glen;g++) exts["."+_2[g]]=_1;
                });
        });
        return {types:types,exts:exts};
};

var paths=config.mime.file_paths;

module.exports={
        update:function(){
                console.info("Updating mime types...");
                for (var g of paths) this.load(g);
                console.info("Mime types have been updated!");
        },
        load:function(path){
                console.log("Loading mime types from disk (%s)",path);

                var data=fs.readFileSync(path,function(err){
                        if (err){
                                console.warn("Cannot load mime types from disk! "+err);
                        }
                });
                try{
                        data=parse(data);
                        extend(this.types,data.types);
                        extend(this.exts,data.exts);
                }
                catch(err){
                        console.warn("Error parsing mime types from disk! "+err);
                }
        },
        types:{},
        exts:{},
        match:function(mime,search){
                var r=new JSONRegExp(search);
                return r.test(mime);
        },
        get:function(path){
                return this.exts[extension(path)]||config.mime.default;
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
