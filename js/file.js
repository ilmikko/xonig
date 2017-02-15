const file=require("file"),pm=require("path"),fs=require("fs");

console.info("File.js initializing...");

// OLD TODO: Distinguish between updating just the file contents or actually looping through the directories as well?
// XXX Currently it's just the pricy update.
// TODO: Remove external file npm dependency

function direach(dirpath,callback){
        console.debug("Loading directory recursively (%s)",dirpath);
        try{
        dirpath=pm.normalize(dirpath);
		file.walkSync(dirpath,function(dp,dirs,files){
			for (var file of files){
				let filepath=pm.join(dp,file),filename=pm.basename(file);

				// Ignore hidden files
				if (filename[0]=="."){
					console.warn("Ignoring hidden file %s",filepath);
				}else{
					callback(filepath.replace(dirpath,""));
				}
			}
		});
	}
	catch(err){
		console.error("Cannot load directory! %s",err);
	}
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
                                                cache[filepath]={
                                                        status:200,
                                                        body:data,
                                                        headers:{
                                                                "Content-Type":mimetype,
                                                                "Content-Length":Buffer.byteLength(data)
                                                        }
                                                };
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
        static:static,
        dynamic:dynamic,
        physical:physical,
        template:template,
        update:function(){
                console.info("Updating the file cache...");
                var pools=config.pools;
                for (let pool of pools){
                        console.mass("File cache: pool #%s",pool.id);
                        
                }
                console.info("The file cache has been updated!");
        }
};
