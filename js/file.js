const pm=require("path"),fs=require("fs");

console.debug("File.js initializing...");

// OLD TODO: Distinguish between updating just the file contents or actually looping through the directories as well?
// XXX Currently it's just the pricy update.
// TODO: Remove external file npm dependency

module.exports={
        get:function(path){
                try{
                        return fs.readFileSync(path);
                }
                catch(err){
                        console.error("Cannot read file! %s",err);
                        throw err;
                }
        },
        js:function(path){
                var data=this.get(path);
                try{
                        return Function(data)();
                }
                catch(err){
                        console.error("Error in js file: %s",err);
                        throw err;
                }
        },
        dir:function(o){
                let dir=o.path,matchmime=o.match||".*",callback=o.callback||function(){};
                console.debug("Loading directory recursively (%s)",dir);
                try{
                        dir=pm.normalize(dir);

                        var all=(function loadall(path){
                                var contents=fs.readdirSync(path),all=[];
                                for (item of contents){
                                        let newpath=path+'/'+item;
                                        let stats=fs.statSync(newpath);
                                        if (stats.isDirectory()){
                                                Array.prototype.push.apply(all,loadall(newpath));
                                        }else{
                                                all.push(newpath);
                                        }
                                }
                                return all;
                        })(dir);

                        for (let filepath of all){
                                let filename=pm.basename(filepath),mimetype=mime.get(filepath);

                                console.mass("Parsing file (%s)...",filepath);

                                // Ignore hidden files
                                if (filename[0]=="."){
                                        console.warn("Ignoring hidden file %s",filepath);
                                }else{
                                        if (mime.match(mimetype,matchmime)){
                                                callback({
                                                        path:filepath,
                                                        name:filename,
                                                        index:filepath.replace(dir,""),
                                                        mime:mimetype
                                                });
                                        }else{
                                                console.warn("Ignoring file %s, mime mismatch (%s not in %s)",filepath,mimetype,matchmime);
                                        }
                                }
                        }
                }
                catch(err){
                        console.error("Cannot load directory! %s",err);
                        throw err;
                }
                console.info("File cache updated!");
        }
};
