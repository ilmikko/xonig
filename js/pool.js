const fs=require("fs");

var configpaths=["./pools.json"];

var pools=[];

var statics={},dynamics={};

module.exports={
        dynamics:dynamics,
        statics:statics,
        update:function(){
                this.updateconfigs();
                this.updatepools();
        },
        loadconfig:function(path){
                console.log("Loading pool config from disk... (%s)",path);
                try{
                        var arr=JSON.parse(fs.readFileSync(path));
                        for (let pool of arr){
                                if (pool.require) extend(pool,file.js(pool.require));
                                console.debug("Pushing %s",JSON.stringify(pool));
                                pools.push(pool);
                        }
                        console.debug("Pools length: %s",pools.length);
                }
                catch(err){
                        console.error("Cannot load pool config: %s",err);
                }
        },
        updateconfigs:function(){
                console.info("Updating pool configs...");
                pools=[];
                for (let path of configpaths) this.loadconfig(path);
                console.info("Pool configs have been updated!");
        },
        updatepools:function(){
                console.info("Updating file pools...");
                for (let pool of pools){
                        console.debug("Pool #%s: dir %s, mime %s",pool.id,pool.dir,pool.match);
                        file.dir({
                                match:pool.match||config.default.match,
                                path:pool.dir||config.default.dir,
                                callback:function(file){
                                        var serve={status:200,body:"",headers:{}}; // default serve object that can be expanded upon

                                        if (pool.mime) pool.mime.call(serve,file.mime);

                                        if (pool.data){
                                                try{
                                                        let data=fs.readFileSync(file.path);
                                                        pool.data.call(serve,data);
                                                }
                                                catch(err){
                                                        console.error("Cannot open file! %s",err);
                                                }
                                        }

                                        if (pool.dynamic){
                                                dynamics[file.index]=pool.dynamic(serve);
                                        }else{
                                                statics[file.index]=serve;
                                        }

                                }
                        });
                }
                console.info("File pools updated!");
        },
        serve:function(o,callback){
                var path=o.path;
                if (path in statics){
                        callback(statics[path]);
                }else if (path in dynamics){
                        callback(dynamics[path]());
                }else{
                        // 404
                        callback({
                                status:404,
                                body:"404 - Squee Not Found"
                        });
                }
        }
};
