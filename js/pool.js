const fs=require("fs");

var paths=["./pools.json"];

var pools=[];

var cache={};

module.exports={
        pools:pools,
        cache:cache,
        update:function(){
                console.info("Updating pools...");
                for (let path of paths) this.load(path);
                console.info("Pools have been updated!");
        },
        load:function(path){
                console.log("Loading pools from disk... (%s)",path);
                try{
                        var arr=JSON.parse(fs.readFileSync(path));
                        for (let pool of arr){
                                if (pool.require) pool.stuff=require("../"+pool.require);
                                pools.push(pool);
                        }
                }
                catch(err){
                        console.error("Cannot load pools: %s",err);
                }
        },
        serve:function(o,callback){
                var path=o.path;
                if (path in cache){
                        callback(cache[path]);
                }else{
                        // 404
                        callback({
                                status:404,
                                body:"404 - Squee Not Found"
                        });
                }
        }
};
