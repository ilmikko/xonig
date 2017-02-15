var paths=["./pools.json"];

module.exports={
        update:function(){
                console.info("Updating pools...");
                for (let path of paths) this.load(path);
                console.info("Pools have been updated!");
        },
        load:function(path){
                console.log("Loading pools from disk... (%s)",path);
                try{
                        var data=fs.readFileSync(path);
                }
                catch(err){

                }
        }
};
