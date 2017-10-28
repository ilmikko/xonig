return {
        path:function(path){
                this.realpath=path;
        },
        dynamic:function(serve){
                return function(o,callback){
                        // Construct the context (yes, every time.)
                        var context={
                                _die:false,
                                _async:false,
                                RESPONSE:o.res,
                                REQUEST:o.req,
                                PATH:o.path,
                                REALPATH:serve.realpath,
                                IP:o.IP,
                                METHOD:o.req.method,
                                SECURE:(o.req.connection.encrypted===true),
                                DATA:o.data,
                                COOKIES:(function(ch){
                                        return qs.parse(ch);
                                })(o.req.headers.cookie),
                                HEADERS:o.req.headers,
                                status:200,
                                fs:fs,
                                db:db,
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
                                        context.body+=Array.prototype.join.call(arguments,'');
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
                                                context.DONE=function(err){
                                                        delete context.DONE;
                                                        if (err){
                                                                console.warn("Script error:",err);
                                                                context.error(500);
                                                        }
                                                        next(chunks,i,done);
                                                };

                                                //console.debug("Aftermath: %s",JSON.stringify(context));
                                                chunk.runInNewContext(context);

                                                //console.warn(context.times);
                                        }
                                        catch(err){
                                                context.DONE(err);
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
                                if (text[0]=='=') text='body+'+text;
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
