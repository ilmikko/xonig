return {
        dynamic:function(serve){
                return function(o){
                        // Construct the $ object (yes, every time.)
                        var $={
                                response:o.res,
                                request:o.req,
                                path:o.path,
                                ip:o.res.connection.remoteAddress,
                                method:o.req.method,
                                secure:(o.req.connection.encrypted==true),
                                data:o.data
                        };

                        /*
                                $.ip or $['ip']
                                $.path - the requested path
                                $.ip - the remote IP address
                                $.secure - if the socket is encrypted
                        */
                        try{
                                var ret=serve.onrequest($);
                        }
                        catch(err){
                                console.warn("Error in script %s: %s",o.path,err);
                                return {
                                        status:500,
                                        body:"Internal squeever error"
                                };
                        }

                        if (ret){
                                if (typeof ret==="string"){
                                        ret = {body:ret};
                                }else if (typeof ret!=="object"){
                                        console.error("Dynamic script returned garbage!");
                                        return {
                                                status:500,
                                                body:"Internal squeever error"
                                        };
                                }

                                extend(serve,ret);
                        }

                        return serve;
                }
        },
        data:function(data){
                try{
                        this.onrequest=Function("$",data);
                }
                catch(err){
                        console.error("Cannot parse dynamic: %s",err);
                }
        },
        mime:function(mime){
                this.headers["Content-Type"]="text/html"; // usually, overrided in scripts if needed
        }
};
