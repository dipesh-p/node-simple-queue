function DB(db_type,db_config){	
	if(db_type=='MongoDB'){
		var MongoDB=require('./mongo/db.js').MongoDB;
		var db=new MongoDB(db_config);
		return db;
	}
}

exports.DB=DB;
