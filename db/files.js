'use strict';

const Mongo = require(__dirname+'/db.js')
	, Boards = require(__dirname+'/boards.js')
	, formatSize = require(__dirname+'/../helpers/files/formatsize.js')
	, db = Mongo.client.db('jschan').collection('files')

module.exports = {

	db,

	increment: (file) => {
		return db.updateOne({
			'_id': file.filename
		}, {
			'$inc': {
				'count': 1
			},
			'$setOnInsert': {
				'size': file.size
			}
		}, {
			'upsert': true
		});
	},

	decrement: (fileNames) => {
		return db.updateMany({
			'_id': {
				'$in': fileNames
			}
		}, {
			'$inc': {
				'count': -1
			}
		}, {
			'upsert': true //probably not necessary
		});
	},

	activeContent: () => {
		return db.aggregate([
			{
				'$group': {
					'_id': null,
					'count': {
						'$sum': 1
					},
					'size': {
						'$sum': '$size'
					}
				}
			}
		]).toArray().then(res => {
			const stats = res[0];
			return {
				count: stats.count,
				totalSize: stats.size,
				totalSizeString: formatSize(stats.size)
			}
		});
	},

	deleteAll: () => {
		return db.deleteMany({});
	}

}
