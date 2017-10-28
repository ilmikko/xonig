console.info("Database initializing...");
let mongo = require('mongodb').MongoClient;
let port=27017,host='localhost';
let url = 'mongodb://'+host+':'+port+'/';

module.exports={
        db:{},
	dbInUse:null,
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
	},
        use:function(dbpath){
                console.log('Mongo connecting to %s...',dbpath);
                var self=this;
		return new Promise(function(fulfill, reject){
			mongo.connect(url+dbpath,function(err,db){
				if (err) {
					reject(err);
				} else {
					console.log("Use DB: '%s'",dbpath);
					fulfill(self.db[self.dbInUse=dbpath]=db);
				}
			});
		});
        },
        get:function(col,db=this.dbInUse){
                if (!(db in this.db)) throw new Error("DB '"+db+"' not in use."); else db=this.db[db];
                if (col) return db.collection(col); else return db;
        }
};

// Test connection, warn if it fails
mongo.connect(url,function(err,db){
	if (err) {
		console.error(err);
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
