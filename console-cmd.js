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
        "help":"Show help about a command or all of the commands\nUsage: help [command]\nThe command line works in global scope, which means you can access some of the program defined functions internally.\n\nThe preferred way to run commands would be to use 'console.commands[<command>](<arguments>)', but for your convenience the interpreter tries its best to guess and translate simple unix-like command lines to their JavaScript equivalents.\nSo, for example, if you typed 'help help', you can see the interpretation below it - translated to 'console.commands['help'](\"help\")'.\nUse this with caution, however, and if it doesn't work, just use its JavaScript equivalent.\n\nUsing Object.keys() is recommended for finding out what properties of an object you can access.\nYou can inspect types of properties and much more.\n",
        "alias":"Show or edit aliases\nUsage: alias [name[=value]]\nNote that aliases are not kept across runs (we don't have the functionality (yet))",
        "echo":"Echo text on screen\nUsage: echo [text1] [...] [textN]",
        "exit":"Close the process, optionally with a status code\nUsage: exit [code]"
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
                                var newinput="console.commands['"+cmd+"']("+parseParams(params).join(",")+");";

                                console.massback(newinput); // Tell the user what we're ACTUALLY running
                                output=Function("return "+newinput)();
                                if (output) console.back(output);
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
                        console.back("Welcome to the JavaScript console. For more detailed information, please run 'help help'");

                        console.back("All available commands:");
                        for (var g in console.commands) {
                                let text=help[g];
                                text=text.slice(0,text.indexOf("\n")); // Show only first line
                                console.back("%s - %s",g,text);
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
