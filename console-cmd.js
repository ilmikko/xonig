const readline=require("readline"),rl=readline.createInterface({input:process.stdin,output:process.stdout});

console.info("Initializing console command module...");

// SUGGESTION: Can we put a translation from unix-like console commands to javascript console commands?

function parseParams(params){
        for (var g=0,glen=params.length;g<glen;g++) if (!isNaN(params[g])) params[g]=parseFloat(params[g]); else params[g]="\""+params[g].replace(/"/g,"")+"\"";
        return params;
}

var alias={
        "quit":"exit",
        "bye":"exit",
        ":q":"exit"
};

var help={
        "help":"But nobody came."
};

function parseInput(input){
        if (input in alias) return parseInput(alias[input]);

        var output;

        try{
                output=Function("return "+input);
                console.back(output);
        }
        catch(err){
                // Try interpreting commands (in unix-like mode)
                try{
                        input=input.split(" "); // split by spaces
                        var cmd=input[0],params=input.slice(1);

                        if (cmd in console.commands){
                                // help asd -> help("asd");
                                // exit 1 -> exit(1);
                                // help asd basd -> help("asd","basd");

                                var newinput="console.commands['"+cmd+"']("+parseParams(params).join(",")+");";

                                console.massback(newinput); // Tell the user what we're ACTUALLY running

                                output=Function("return "+newinput);
                                console.back(output);
                        }else{
                                console.back("Cannot parse your input:");
                                console.error(err);
                        }
                }
                catch(err){
                        console.back("Cannot parse your input:");
                        console.error(err);
                }
        }
}

rl.on("line",function(input){
        parseInput(input);
});

var commands = console.commands = new Proxy({
        alias:function aliasc(setget){
                if (!setget){
                        console.back("Showing all aliases");
                        for (var g in alias) aliasc(g);
                }else{
                        setget=setget.split("=");
                        if (setget.length==1){
                                //get
                                console.back(setget[0]+"="+alias[setget[0]]);
                        }else if (setget.length==2){
                                //set
                                alias[setget[0]]=setget[1];
                                console.back(setget[0]+"="+alias[setget[0]]);
                        }else throw new Error("Malformed syntax");
                }
        },
        help:function helpc(get){
                if (!get){
                        console.back("Welcome to the JavaScript console.");

                        console.back("All available commands:");
                        for (var g in console.commands) {
                                console.back("%s - %s",g,helpc(g));
                        }
                }else{
                        return help[get]||"No help found for "+get;
                }
        },
        echo:function(){
                return Array.prototype.join.call(arguments," ");
        },
        exit:function(code){
                return process.exit(code);
        }
},{
        get:function(target,key){
                if (key in target){
                        return target[key];
                }else if (key in global){
                        return global[key];
                }
        }
});
