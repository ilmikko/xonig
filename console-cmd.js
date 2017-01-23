const readline=require("readline"),rl=readline.createInterface({input:process.stdin,output:process.stdout});

console.info("Initializing command module...");

function parseInput(input){
        try{
                var output=Function("with(console.commands){return "+input+"}")();
                if (output!=null) console.back(output);
        }
        catch(err){
                console.back("Cannot parse your input:");
                console.error(err);
        }
}

rl.on("line",function(input){
        parseInput(input);
});

var commands = console.commands = new Proxy({
        help:function(){
                return "But nobody came";
        },
        test:function(){
                return "Test";
        }
},{
        get:function(target,key){
                if (key in target){
                        return target[key];
                }
        }
});
