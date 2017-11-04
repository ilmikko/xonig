// For serving more complex dynamic files (i.e. text/node, streams)
const fs=xonig.fs;

process.on("message",function(data){
        //THE RACE IS ON.
        console.time("serve.js: Request parsed");
        data=JSON.parse(data);

        process.send({
                status:200,
                headers:{},
                body:"This is a test serve."
        });
        console.timeEnd("serve.js: Request parsed");
});
