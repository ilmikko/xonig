if (!config.database.enabled){
	return;
}
console.info("Database initializing...");

// We currently only support one database type, which is mongodb.
if (config.database.type&&config.database.type!="mongodb"){
	throw new Error('Unsupported database type: '+config.database.type);
}

let mongo = require('mongodb').MongoClient;
let port = config.database.port||27017, host=config.database.host||'localhost';
let url = 'mongodb://'+host+':'+port+'/';

module.exports={
	connect:function(dbpath){
		return new Promise(function(fulfill, reject){
			mongo.connect(url+dbpath,function(err,db){
				if (err) {
					reject(err);
				} else {
					console.log("Connected to DB: '%s'",dbpath);
					fulfill(db);
				}
			});
		});
	}
};

// Test connection, warn if it fails
mongo.connect(url,function(err,db){
	if (err) {
		throw new Error(err);
	}else{
		console.info("Successfully connected to MongoDB database at: "+url);
	}
});

// XXX DEBUG: Remove this afterwards
/*module.exports.use('debug',function(db){
        db.collection('names').insertOne({name:"Henry Johnson",firstName:"Henry",lastName:"Johnson"}).catch(function(err){
                console.error(err);
        }).then(function(res){
                console.info(res);
        });
});*/
