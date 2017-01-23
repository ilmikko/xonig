const readline=require("readline"),rl=readline.createInterface({input:process.stdin,output:process.stdout});

console.info("Initializing command module...");

function parseInput(input){
        // FIXME: Make this console a bad boy. Currently it's very simple.
        
        try{
                var output=Function("with(console.commands){return "+input+"}")();
                if (output!=null) console.log(output);
        }
        catch(err){
                console.back("Cannot parse your input:");
                console.error(err);
        }
}

rl.on("line",function(input){
        parseInput(input);
});

var commands = new Proxy({
        help:function(){
                return "But nobody came";
        },
        test:function(){
                return "Test";
        }
},{
        get:function(target,key){
                if (key in target){
                        // run command
                        if (key==="help"){
                                console.back("In the future, please use 'help()' instead of 'help', as it's a method. :)");
                                return target[key]();
                        }
                        return target[key];
                }
        }
});

console.commands=commands;
