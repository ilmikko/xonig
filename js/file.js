console.debug("File.js initializing...");

// OLD TODO: Distinguish between updating just the file contents or actually looping through the directories as well?
// XXX Currently it's just the pricy update.

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
                let directories=o.path,matchmimes=o.match||".*",callback=o.callback||function(){};

                if (!(directories instanceof Array)) directories=[directories];
                if (!(matchmimes instanceof Array)) matchmimes=[matchmimes];

                for (let dir of directories){
                        console.debug("Loading directory recursively (%s)",dir);
                        dir=pm.normalize(dir);

                        let all=(function loadall(path){
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
                                        console.log("Ignoring hidden file %s",filepath);
                                }else{
                                        for (let matchmime of matchmimes){
                                                if (mime.match(mimetype,matchmime)){
                                                        console.mass("File matches: %s %s, (%s)",filepath,filename,mimetype);
                                                        callback({
                                                                path:filepath,
                                                                name:filename,
                                                                index:filepath.replace(dir,""),
                                                                mime:mimetype
                                                        });
                                                        break;
                                                }else{
                                                        console.debug("Ignoring file %s, mime mismatch (%s not in %s)",filepath,mimetype,matchmime);
                                                }
                                        }
                                }
                        }
                }
                console.info("File cache updated!");
        }
};
