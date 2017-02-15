const file=require("file");

function template(data){
        // TODO: cleanup
        return data.toString().replace(/<~<([\s\S]*?)>~>/g,function(_,_1){
                try{
                        return Function(_1)()||"";
                }
                catch(err){
                        console.error("Cannot parse templating script!");
                        console.mass("Error near: %s",_1);
                        throw new Error("Templating error");
                }
        });
}

/*
        TODO: template.load("/this/fancy/template.template","/template.robot");
*/

module.exports={
        dirpaths:{},
        filepaths:{},
        update:function(){
                console.info("Updating the file cache...");
                for (let g in this.dirpaths) this.loaddir(g);
                for (let g in this.filepaths) this.loadfile(g);
                console.info("The file cache has been updated!");
        },
        loadfile:function(filepath){
                console.info("Loading file (%s)",filepath);
                this.filepaths[filepath]=true;

                load(filepath);
        },
        loaddir:function(dirpath){
                console.info("Loading template directory recursively (%s)",dirpath);
                this.dirpaths[dirpath]=true;

                var self=this;
                var e=file.walkSync(dirpath,function(dirpath,dirs,files){
                        for (var file of files){
                                let filepath=pm.join(dirpath,file);

                                let filename=pm.basename(filepath);

                                if (filename[filename.length-1]=="!"){
                                        // Ignore some specifics
                                        if (filename[0]=="."){
                                                console.warn("Template ignoring hidden file %s",filepath);
                                        }else{
                                                try{
                                                        load(filepath);
                                                }
                                                catch(err){
                                                        console.error("Cannot cache file %s: %s",filepath,err);
                                                }
                                        }
                                }
                        }
                });
        }
};
