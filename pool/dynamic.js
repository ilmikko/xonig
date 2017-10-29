return {
        path:function(path){
                this.realpath=path;
        },
        serve:function(serve){
                return function(o,callback){
                        // Construct the context (yes, every time.)
			// Convention: UPPERCASE is for stuff that already exists, or comes from the client. lowercase is for stuff that you, as a server, set.
			// For example: IP is the client ip address, but status is the status you're going to send to the client.
                        var context={
                                _die:false,
                                _async:false,
                                RESPONSE:o.res,
                                REQUEST:o.req,
                                PATH:pm.dirname(o.path),
                                REALPATH:pm.dirname(serve.realpath),
				FILENAME:pm.basename(o.path),
                                IP:o.IP,
                                METHOD:o.req.method,
                                SECURE:(o.req.connection.encrypted===true),
                                DATA:o.data,
                                COOKIES:(function(ch){
                                        return qs.parse(ch);
                                })(o.req.headers.cookie),
                                HEADERS:o.req.headers,
				FS:(function(){
					function prependCurrentPathIfPossible(val){
						if (typeof val==='function'){
							return function(){
								// change argument paths, context dependent
								// context.FS.dirname(context.REALPATH)
								for (let g=0,gg=arguments.length;g<gg;g++) if (typeof arguments[g]==='string') {
									// replace . with real path
									var firstCharacter=arguments[g][0];
									if (firstCharacter=='.'){
										arguments[g]=context.REALPATH+'/'+arguments[g];
									}else if (firstCharacter=='/'){
										arguments[g]='.'+arguments[g];
									}
								}
								val.apply(val,arguments);
							}
						}else{
							return val;
						}
					}
					var custom={
						listdir:function(path,callback){
							// Wrapper around fs.readdir
							fs.readdir(path,(err,files)=>{
								if (err) callback(err); else{
									path=pm.relative(context.REALPATH,path);
									for (var g=0,gg=files.length;g<gg;g++){
										files[g]=pm.normalize('./'+context.PATH+'/'+path+'/'+files[g]);
									}
									callback(null,files);
								}
							});
						}
					}
					return new Proxy({},{
						get:function(obj,key){
							if (key in fs) {
								return prependCurrentPathIfPossible(fs[key]);
							}else if (key in pm){
								return prependCurrentPathIfPossible(pm[key]);
							}else if (key in custom){
								return prependCurrentPathIfPossible(custom[key]);
							}else return obj;
						}
					});
				})(),
				DB:(function(){
					var dbdata={};
					var currentdb=null;
					return {
						use:function(dbname){
							return db.connect(dbname)
							.catch(function(err){
								context.REJECT(err);
							})
							.then(function(db){
								dbdata[currentdb=dbname]=db;
							});
						},
						get:function(collection){
							return dbdata[currentdb].collection(collection);
						}
					};
				})(),
                                status:200,
                                fs:fs, //debug
                                db:db, //debug
                                body:'',
                                read:function(fn){
                                        return fs.readFileSync(pm.dirname(serve.realpath)+'/'+fn);
                                },
                                // NOTE: There is a difference between header and HEADERS
                                // You can check if $.HEADERS['thing'] was true
                                // But you can also set $.header['return'] to true
                                console:console,
                                header:new Proxy({},{
                                        // Proxy to default all header cases to lowercase
                                        // use arrays instead of replacing
                                        set:function(obj,key,val){
                                                key=key.toLowerCase();
                                                if (!(key in obj)) obj[key]=[];
                                                obj[key].push(val);
                                        }
                                }),
                                cookie:{},
                                error:function(code){
                                        context.status=code;
                                        context.die(http.STATUS_CODES[code]);
                                },
                                print:function(){
                                        context.body+=Array.prototype.join.call(arguments,'')+'\n';
                                },
                                die:function(){
                                        context._die=true;
                                        context.body=Array.prototype.join.call(arguments,'');
                                }
                        };

                        // Start parsing the chunks (and scripts)
                        (function next(chunks,i,done){
                                context._async=false;

                                if (context._die) return done(callback);

                                let chunk=chunks[i++];
                                //console.mass("L:%s, i:%s",chunks.length,i);
                                if (chunk instanceof vm.Script){
                                        // Run script and append to body
                                        try{
                                                context.FULFILL=function(){
                                                        delete context.FULFILL;
                                                        next(chunks,i,done);
                                                };
						context.REJECT=function(err){
                                                        delete context.FULFILL;
							console.warn("Script error: ",err);
							context.error(500);
                                                        next(chunks,i,done);
						}

                                                //console.debug("Aftermath: %s",JSON.stringify(context));
                                                chunk.runInNewContext(context);

                                                //console.warn(context.times);
                                        }
                                        catch(err){
                                                context.REJECT(err);
                                        }
                                }else{
                                        // Append to body immediately
                                        context.body+=chunk;
                                }
                                if (chunks.length==i) context._die=true;
                                if (!context._async) return next(chunks,i,done);
                        })(serve.chunks,0,function(callback){
                                // Default content-type
                                if (!('content-type' in context.header))
                                        context.header['content-type']='text/html; charset=utf-8';

                                // Calculate content-length
                                if (!('content-length' in context.header))
                                        context.header['content-length']=Buffer.byteLength(context.body,'utf-8');

                                // Set cookie headers
                                for (let c in context.cookie){
                                        context.header['set-cookie']=c+'='+context.cookie[c]+';';
                                }

                                callback(extend(serve,context));
                        });
                }
        },
        data:function(data){
                console.debug('Parsing dynamic data into scripts...');
                this.chunks=[];

                data=data.toString();

                var self=this;

                // Parse the data as a .node script
                while(data) data=data.replace(/^([\s\S]*?)(<%|%>|$)/,function(_,text,type){
                        if (type=='%>'){
                                // Parsing a script

                                // Conveniences
				if (text[0]=='#') {
					// this block is commented out
					return '';
				}
                                if (text[0]=='=') {
					// this block is a shorthand echo
					text='body+'+text;
				}
                                if (text[0]=='!') {
                                        // async
                                        text='_async=true;'+text.slice(1);
                                }

                                console.mass("Script: %s",text);
                                self.chunks.push(new vm.Script(text));
                                //self.chunks.push(Function('$',text));
                        }else{
                                // Parsing plaintext
                                self.chunks.push(text);
                        }
                        return '';
                });
        }
};
