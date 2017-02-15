const file=require("file"),pm=require("path"),fs=require("fs");

console.info("File.js initializing...");

// OLD TODO: Distinguish between updating just the file contents or actually looping through the directories as well?
// XXX Currently it's just the pricy update.
// TODO: Remove external file npm dependency

function dirmatch(dirpath,mimetype,callback){

}



var static=(function(){
        return {
                dir:config.static_dir,
                cache:{},
                update:function(){
                        var dirpath=this.dir;
                        console.log("Loading static files from (%s)...",dirpath);

                        var cache={};

                        direach(dirpath,function(filepath){
                                var mimetype=mime.get(filepath),realpath=dirpath+filepath;
                                var cachetype=cachefor(mimetype);
                                if (cachetype=="static"){
                                        try{
                                                var data=fs.readFileSync(realpath,"utf-8");
                                                cache[filepath]=todo;
                                        }
                                        catch(err){
                                                console.warn("Cannot load file to cache: %s!",err);
                                        }
                                }else{
                                        console.mass("Skipping %s (mime mismatch, cache for mime %s: %s)",realpath,mimetype,cachetype);
                                }
                        });

                        this.cache=cache;
                }
        };
})();

var dynamic=(function(){
        return {
                dir:config.dynamic_dir,
                cache:{},
                update:function(){
                        var dirpath=this.dir;
                        console.log("Loading dynamic files from (%s)...",dirpath);

                        var cache={};

                        direach(dirpath,function(filepath){
                                var mimetype=mime.get(filepath),realpath=dirpath+filepath;

                                if (!mime.match(mimetype,config.mime.types.dynamic)){
                                        console.mass("Skipping %s (mime mismatch (%s doesn't match regex %s))",realpath,mimetype,config.mime.types.dynamic);
                                        return;
                                }

                                try{
                                        var data=fs.readFileSync(realpath,"utf-8");
                                        cache[filepath]=Function(data);
                                }
                                catch(err){
                                        console.warn("Cannot load dynamic file: %s!",err);
                                }
                        });

                        this.cache=cache;
                }
        };
})();

var physical=(function(){
        return {
                dir:config.physical_dir,
                cache:{},
                update:function(){
                        var dirpath=this.dir;
                        console.log("Loading physical files from (%s)...",dirpath);

                        var cache={};

                        direach(dirpath,function(filepath){
                                var mimetype=mime.get(filepath),realpath=dirpath+filepath;

                                if (!mime.match(mimetype,config.mime.types.physical)){
                                        console.mass("Skipping %s (mime mismatch (%s doesn't match regex %s))",realpath,mimetype,config.mime.types.physical);
                                        return;
                                }

                                cache[filepath]={
                                        status:206,
                                        src:realpath,
                                        headers:{
                                                'Content-Type':mimetype
                                        }
                                };
                        });

                        this.cache=cache;
                }
        };
})();

var template=(function(){
        return {
                dir:config.template_dir,
                update:function(){
                        var dirpath=this.dir;
                        console.log("Loading template files from (%s)...",dirpath);

                        var cache={};

                        function template(data){
                                // TODO: cleanup
                                return data.toString().replace(/<~<([\s\S]*?)>~>/g,function(_,_1){
                                        return Function(_1)()||"";
                                });
                        }

                        direach(dirpath,function(filepath){
                                var mimetype=mime.get(filepath),realpath=dirpath+filepath;

                                if (!mime.match(mimetype,config.mime.types.template)){
                                        console.mass("Skipping %s (mime mismatch (%s doesn't match regex %s))",realpath,mimetype,config.mime.types.physical);
                                        return;
                                }

                                try{
                                        var data=fs.readFileSync(realpath,"utf-8");
                                        cache[realpath]=template(data);
                                }
                                catch(err){
                                        console.warn("Cannot template file: %s!",err);
                                }
                        });

                        // Determine where the templated files go
                        for (var g in cache){

                        }
                }
        };
})();



var exports=module.exports={
        update:function(){
                console.info("Updating the file cache...");
                for (let p of pool.pools){
                        var id=p.id,dir=p.dir||config.default.dir,matchmime=p.match||config.default.match;
                        console.debug("Pool #%s: dir %s, mime %s",id,dir,matchmime);

                        var po=p.stuff;

                        // TODO: CLEAN UP
                        console.debug("Loading directory recursively (%s)",dir);
                        try{
                                dir=pm.normalize(dir);
                		file.walkSync(dir,function(dirpath,dirs,files){
                			for (var file of files){
                                                let filepath=pm.join(dirpath,file),filename=pm.basename(file),mimetype=mime.get(filepath);

                                                console.mass("Parsing file (%s)...",filepath);

                				// Ignore hidden files
                				if (filename[0]=="."){
                					console.warn("Ignoring hidden file %s",filepath);
                				}else{
                                                        if (mime.match(mimetype,matchmime)){
                                                                let path=filepath.replace(dir,"");

                                                                var poolobj={status:200,headers:{},body:""};

                                                                if (po.mime) po.mime.call(poolobj,mimetype);

                                                                if (po.data){
                                                                        try{
                                                                                let data=fs.readFileSync(filepath);
                                                                                po.data.call(poolobj,data);
                                                                        }
                                                                        catch(err){
                                                                                console.error("Cannot open file! %s",err);
                                                                        }
                                                                }

                                                                pool.cache[path]=poolobj;
                                                        }else{
                                                                console.warn("Ignoring file %s, mime mismatch (%s not in %s)",filepath,mimetype,matchmime);
                                                        }
                				}
                			}
                		});
                	}
                	catch(err){
                		console.error("Cannot load directory! %s",err);
                	}
                }
                console.info("The file cache has been updated!");
        }
};
