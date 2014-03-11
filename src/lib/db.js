function DB(db_type){	
	if(db_type=='MongoDB'){
		var MongoDB=require('./mongo/db.js').MongoDB;
		var db=new MongoDB();
		return db;
	}
}

exports.DB=DB;
