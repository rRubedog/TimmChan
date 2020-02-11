'use strict';

const gulp = require('gulp')
	, fs = require('fs-extra')
	, uploadDirectory = require(__dirname+'/helpers/files/uploadDirectory.js')
	, configs = require(__dirname+'/configs/main.js')
	, { themes, codeThemes } = require(__dirname+'/helpers/themes.js')
	, less = require('gulp-less')
	, concat = require('gulp-concat')
	, cleanCSS = require('gulp-clean-css')
	, uglify = require('gulp-uglify-es').default
	, del = require('del')
	, pug = require('pug')
	, gulppug = require('gulp-pug')
	, packageVersion = require(__dirname+'/package.json').dbVersion
	, paths = {
		styles: {
			src: 'gulp/res/css/**/*.css',
			dest: 'static/css/'
		},
		images: {
			src: 'gulp/res/img/*',
			dest: 'static/img/'
		},
		scripts: {
			src: 'gulp/res/js',
			dest: 'static/js/'
		},
		pug: {
			src: 'views/',
			dest: 'static/html/'
		}
	};

async function wipe() {

	const Mongo = require(__dirname+'/db/db.js')
	const Redis = require(__dirname+'/redis.js')
	await Mongo.connect();
	const db = Mongo.client.db('jschan');

	//make these because mongo is dumb and doesnt make them automatically
	await db.createCollection('accounts');
	await db.createCollection('bans');
	await db.createCollection('boards');
	await db.createCollection('captcha');
	await db.createCollection('files');
	await db.createCollection('modlog');
	await db.createCollection('news');
	await db.createCollection('posts');
	await db.createCollection('poststats');
	await db.createCollection('ratelimit');
	await db.createCollection('webring');
	await db.createCollection('bypass');

	const { Webring, Boards, Posts, Captchas, Ratelimits, Accounts, Files, Stats, Modlogs, Bans, Bypass } = require(__dirname+'/db/');

	//wipe db shit
	await Promise.all([
		Redis.deletePattern('*'),
		Captchas.deleteAll(),
		Ratelimits.deleteAll(),
		Accounts.deleteAll(),
		Posts.deleteAll(),
		Boards.deleteAll(),
		Webring.deleteAll(),
		Bans.deleteAll(),
		Files.deleteAll(),
		Stats.deleteAll(),
		Modlogs.deleteAll(),
		Bypass.deleteAll(),
	]);

	//add indexes - should profiled and changed at some point if necessary
	await Stats.db.createIndex({board:1, hour:1})
	await Boards.db.createIndex({ips: 1, pph:1, sequence_value:1})
	await Boards.db.createIndex({'settings.tags':1})
	await Boards.db.createIndex({lastPostTimestamp:1})
	await Webring.db.createIndex({uniqueUsers:1, postsPerHour:1, totalPosts:1})
	await Webring.db.createIndex({tags:1})
	await Webring.db.createIndex({lastPostTimestamp:1})
	await Bans.db.dropIndexes()
	await Captchas.db.dropIndexes()
	await Ratelimits.db.dropIndexes()
	await Posts.db.dropIndexes()
	await Modlogs.db.dropIndexes()
	await Modlogs.db.createIndex({ 'board': 1 })
	await Files.db.createIndex({ 'count': 1 })
	await Bans.db.createIndex({ 'ip': 1 , 'board': 1 })
	await Bans.db.createIndex({ 'expireAt': 1 }, { expireAfterSeconds: 0 }) //custom expiry, i.e. it will expire when current date > than this date
	await Bypass.db.createIndex({ 'expireAt': 1 }, { expireAfterSeconds: 0 })
	await Captchas.db.createIndex({ 'expireAt': 1 }, { expireAfterSeconds: 300 }) //captchas valid for 5 minutes
	await Ratelimits.db.createIndex({ 'expireAt': 1 }, { expireAfterSeconds: 60 }) //per minute captcha ratelimit
	await Posts.db.createIndex({ 'postId': 1,'board': 1,})
	await Posts.db.createIndex({ 'board': 1,	'thread': 1, 'bumped': -1 })
	await Posts.db.createIndex({ 'board': 1, 'reports.0': 1 }, { 'partialFilterExpression': { 'reports.0': { '$exists': true } } })
	await Posts.db.createIndex({ 'globalreports.0': 1 }, { 'partialFilterExpression': {	'globalreports.0': { '$exists': true } } })
	await Accounts.insertOne('admin', 'admin', 'changeme', 0);

	await db.collection('version').replaceOne({
		'_id': 'version'
	}, {
		'_id': 'version',
		'version': packageVersion
	}, {
		upsert: true
	});

	await Mongo.client.close();
	Redis.redisClient.quit();

	//delete all the static files
	return Promise.all([
		del([ 'static/html/*' ]),
		del([ 'static/json/*' ]),
		del([ 'static/banner/*' ]),
		del([ 'static/captcha/*' ]),
		del([ 'static/img/*' ]),
		del([ 'static/css/*' ]),
		fs.ensureDir(`${uploadDirectory}/captcha`),
	]);

}

//update the css file
function css() {
	try {
		fs.symlinkSync(__dirname+'/node_modules/highlight.js/styles', __dirname+'/gulp/res/css/codethemes', 'dir');
	} catch (e) {
		if (e.code !== 'EEXIST') {
			//already exists, ignore error
			console.log(e);
		}
	}
	return gulp.src(paths.styles.src)
		.pipe(less())
		.pipe(cleanCSS())
		.pipe(gulp.dest(paths.styles.dest));
}

//favicon, spoiler/deleted image, default banner, spoiler/sticky/sage/cycle icons
function images() {
	return gulp.src(paths.images.src)
		.pipe(gulp.dest(paths.images.dest));
}

async function cache() {
	const Redis = require(__dirname+'/redis.js')
	await Promise.all([
		Redis.deletePattern('board:*'),
		Redis.deletePattern('banners:*'),
		Redis.deletePattern('blacklisted:*'),
	]);
	Redis.redisClient.quit();
}

function deletehtml() {
	return del([ 'static/html/*' ]);
}

function custompages() {
	return gulp.src([`${paths.pug.src}/custompages/*.pug`, `${paths.pug.src}/pages/404.pug`, `${paths.pug.src}/pages/502.pug`])
		.pipe(gulppug({
			locals: {
				codeLanguages: configs.highlightOptions.languageSubset,
				defaultTheme: configs.boardDefaults.theme,
				defaultCodeTheme: configs.boardDefaults.codeTheme
			}
		}))
		.pipe(gulp.dest(paths.pug.dest));
}

function scripts() {
	try {
		const themelist = `const themes = ['${themes.join("', '")}'];const codeThemes = ['${codeThemes.join("', '")}'];`;
		fs.writeFileSync('gulp/res/js/themelist.js', themelist);
		const serverTimeZone = `const SERVER_TIMEZONE = '${Intl.DateTimeFormat().resolvedOptions().timeZone}'`;
		fs.writeFileSync('gulp/res/js/timezone.js', serverTimeZone);
		fs.writeFileSync('gulp/res/js/post.js', pug.compileFileClient(`${paths.pug.src}/includes/post.pug`, { compileDebug: false, debug: false, name: 'post' }));
		fs.writeFileSync('gulp/res/js/modal.js', pug.compileFileClient(`${paths.pug.src}/includes/modal.pug`, { compileDebug: false, debug: false, name: 'modal' }));
		fs.symlinkSync(__dirname+'/node_modules/socket.io-client/dist/socket.io.js', __dirname+'/gulp/res/js/socket.io.js', 'file');
	} catch (e) {
		if (e.code !== 'EEXIST') {
			console.log(e);
		}
	}
	gulp.src([
			//put scripts in order for dependencies
			`${paths.scripts.src}/themelist.js`,
			`${paths.scripts.src}/timezone.js`,
			`${paths.scripts.src}/localstorage.js`,
			`${paths.scripts.src}/modal.js`,
			`${paths.scripts.src}/post.js`,
			`${paths.scripts.src}/settings.js`,
			`${paths.scripts.src}/live.js`,
			`${paths.scripts.src}/*.js`,
			`!${paths.scripts.src}/dragable.js`,
			`!${paths.scripts.src}/hide.js`,
			`!${paths.scripts.src}/time.js`,
		])
		.pipe(concat('all.js'))
		.pipe(uglify())
		.pipe(gulp.dest(paths.scripts.dest));
	return gulp.src([
			`${paths.scripts.src}/dragable.js`,
			`${paths.scripts.src}/hide.js`,
			`${paths.scripts.src}/time.js`,
		])
		.pipe(concat('render.js'))
		.pipe(uglify())
		.pipe(gulp.dest(paths.scripts.dest));
}

async function migrate() {

	const Mongo = require(__dirname+'/db/db.js')
	const Redis = require(__dirname+'/redis.js')
	await Mongo.connect();
	const db = Mongo.client.db('jschan');

	//get current version from db if present (set in 'reset' task in recent versions)
	let currentVersion = await db.collection('version').findOne({
		'_id': 'version'
	}).then(res => res ? res.version : '0.0.0'); // 0.0.0 for old versions

	if (currentVersion < packageVersion) {
		console.log(`Current version: ${currentVersion}`);
		const migrations = require(__dirname+'/migrations/');
		const migrationVersions = Object.keys(migrations).sort().filter(v => v > currentVersion);
		console.log(`Migrations needed: ${currentVersion} -> ${migrationVersions.join(' -> ')}`);
		for (let ver of migrationVersions) {
			console.log(`=====\nStarting migration to version ${ver}`);
			try {
				await migrations[ver](db, Redis);
				await db.collection('version').replaceOne({
					'_id': 'version'
				}, {
					'_id': 'version',
					'version': ver
				}, {
					upsert: true
				});
			} catch (e) {
				console.error(e);
				console.warn(`Migration to ${ver} encountered an error`);
			}
			console.log(`Finished migrating to version ${ver}`);
		}
	} else {
		console.log(`Migration not required, you are already on the current version (${packageVersion})`)
	}

	await Mongo.client.close();
	Redis.redisClient.quit();

}

const build = gulp.parallel(css, scripts, images, gulp.series(deletehtml, custompages));
const reset = gulp.parallel(wipe, build);
const html = gulp.series(deletehtml, custompages);

module.exports = {
	html,
	css,
	images,
	reset,
	custompages,
	scripts,
	wipe,
	cache,
	migrate,
	default: build,
};
