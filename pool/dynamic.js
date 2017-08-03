return {
        dynamic:function(serve){
                return function(o){
                        var ip;

                        if (config.proxy.enabled)
                                ip=o.req.headers[config.proxy.header];
                        else
                                ip=o.req.connection.remoteAddress;

                        // Construct the $ object (yes, every time.)
                        var $={
                                response:o.res,
                                request:o.req,
                                path:o.path,
                                ip:ip,
                                method:o.req.method,
                                secure:(o.req.connection.encrypted==true),
                                data:o.data,
                                status:200,
                                body:'',
                                header:{
                                        'content-type':'text/html; charset=utf-8'
                                }
                        };

                        // Start parsing the chunks (and scripts)
                        for (let chunk of serve.chunks){
                                if (typeof chunk === 'function'){
                                        // Run script and append to body
                                        try{
                                                $.body+=chunk($)||"";
                                        }
                                        catch(err){
                                                console.warn("Error parsing script block: %s",err);

                                                $.status=500;
                                                $.body='Internal Squeever Error';
                                                break;
                                        }
                                }else{
                                        // Append to body immediately
                                        $.body+=chunk;
                                }
                        }

                        // Calculate content-length
                        if (!('content-length' in $.header))
                                $.header['content-length']=Buffer.byteLength($.body,'utf-8');

                        return extend(serve,$);
                }
        },
        data:function(data){
                console.debug('Parsing dynamic data into scripts...');
                this.chunks=[];

                data=data.toString();

                var self=this;

                while(data) data=data.replace(/^([\s\S]*?)(<%|%>|$)/,function(_,text,type){
                        if (type=='%>'){
                                // Parsing a script
                                // Conveniences
                                if (text[0]=='='){
                                        text='return '+text.slice(1);
                                }
                                try{
                                        self.chunks.push(Function('$',text));
                                }
                                catch(err){
                                        console.error("Cannot parse chunk! %s",err);
                                }
                        }else{
                                // Parsing plaintext
                                self.chunks.push(text);
                        }
                        return '';
                });
        }
};
