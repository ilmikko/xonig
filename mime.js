const config=require("./conf.json");

const pm=require("path"),fs=require("fs");

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

// TODO: Paths doesn't remember the order we put everything in. Change this to a better solution
var paths={};

module.exports=(function init(){
        console.info("Mime.js initializing...");

        return {
                update:function(){
                        for (g in paths) this.load(g);
                        console.info("Mime types have been updated!");
                },
                load:function(path){
                        console.log("Loading mime types from disk (%s)",path);
                        paths[path]=true; // Save the path for later if we want to update

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
                        search=this.split(search);
                        mime=this.split(mime);

                        if (mime[0]==search[0]||search[0]=="*")
                                if (mime[1]==search[1]||search[1]=="*") return true;
                        return false;
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
})();
