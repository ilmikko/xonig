const http=xonig.http,file=xonig.file,fs=xonig.fs;

console.debug("Pool.js initializing...");
var configpaths=["./pools.json"];

var pools=[];

// FIXME: The pool needs a cleanup
var statics={},dynamics={};

module.exports={
        dynamics:dynamics,
        statics:statics,
        update:function(){
                this.updateconfigs();
                this.updatepools();
        },
        loadconfig:function(path){
                console.debug("Loading pool config from disk... (%s)",path);
                try{
                        var arr=JSON.parse(fs.readFileSync(path));
                        for (let pool of arr){
                                // If there is a requirement script, execute that script
                                // and extend pool with the return values
                                if (pool.require) extend(pool,require(pool.require));
                                console.debug("New pool: %s",JSON.stringify(pool));
                                pools.push(pool);
                        }
                        console.debug("Pools length: %s",pools.length);
                }
                catch(err){
                        throw new Error("Cannot load pool config: "+err);
                }
        },
        updateconfigs:function(){
                console.debug("Updating pool configs...");
                pools=[];statics={};dynamics={};
                for (let path of configpaths) this.loadconfig(path);
                console.info("Pool configs updated!");
        },
        updatepools:function(){
                console.debug("Updating file pools...");
                for (let pool of pools){
                        console.debug("Pool #%s: dir %s, mime %s",pool.id,pool.dir,pool.match);
                        try{
                                file.dir({
                                        match:pool.match||config.default.match,
                                        path:pool.dir||config.default.dir,
                                        callback:function(file){
                                                console.debug("Parsing file '%s' (%s)...",file.path,file.mime);

                                                try{
                                                        var serve=pool.default||{status:200,body:"",header:{}}; // default serve object that can be expanded upon

                                                        if (pool.path) pool.path.call(serve,file.path);
                                                        // If the pool has a mime handler, show the file mime to the pool
                                                        if (pool.mime) pool.mime.call(serve,file.mime);

                                                        // If the pool has a data handler, show the file data to the pool
                                                        if (pool.data){
                                                                let data=fs.readFileSync(file.path);
                                                                pool.data.call(serve,data);
                                                        }

                                                        // If the pool is dynamic, put into dynamics. Otherwise put into statics
                                                        if (pool.serve){
                                                                dynamics[file.index]=pool.serve(serve);
                                                        }else{
								console.log('Put into statics because '+pool.serve);
                                                                statics[file.index]=serve;
                                                        }
                                                }
                                                catch(err){
                                                        console.error("Could not parse file %s! %s",file.path,err);
                                                }
                                        }
                                });
                        }
                        catch(err){
                                console.error("Could not update file pool #%s: %s",pool.id,err);
                                throw new Error("File pool error");
                        }
                }
                console.info("File pools updated!");
        },
        serve:function(o,callback){
                var path=o.path;

		if (!('header' in o)) o.header={};

		// NOTE DEBUG: pass through header
		if (config.debug&&o.req.headers['debug-pass-through']) o.header['debug-pass-through']=o.req.headers['debug-pass-through'];

                // If we're behind a proxy, use the proxy header instead
                // to determine the ip of the remote address.
                if (config.proxy.enabled){
                        if (config.proxy.header in o.req.headers){
                                o.ip=o.req.headers[config.proxy.header];
                        }else{
                                console.error("CRITICAL: Proxy enabled but proxy header not set. Please check your proxy settings!");

                                o.status=500;
                                o.body=http.STATUS_CODES[500];

				o.res.writeHead(o.status,o.header);
				o.res.end(o.body);

                                return callback(o);
                        }
                }else{
                        o.ip=o.req.connection.remoteAddress;
                }

                if (path in dynamics){
                        dynamics[path](o,callback);
		}else{
                        // 404 Pool is closed
			extend(o,{status:404,body:http.STATUS_CODES[404]});

			o.res.writeHead(o.status,o.header);
			o.res.end(o.body);

                        callback(o);
                }
        }
};
