return {
        dynamic:function(){
                return function(){
                        console.debug("Hello there! Not missing anymore!");
                        return {
                                status:200,
                                body:"Hello World"
                        };
                }
        },
        data:function(data){
                try{
                        this.onrequest=Function(data);
                }
                catch(err){
                        console.error("Cannot parse dynamic: %s",err);
                }
        },
        mime:function(mime){
                this.headers["Content-Type"]="text/html"; // usually, override if needed
        }
};
