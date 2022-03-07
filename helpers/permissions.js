'use strict';

const Permissions = {
	ROOT: 0,
	VIEW_RAW_IP: 1,
	CREATE_BOARD: 2,
	CREATE_ACCOUNT: 3,
	BYPASS_BANS: 4,
	BYPASS_SPAMCHECK: 5,
	BYPASS_RATELIMITS: 6,
	BYPASS_FILTERS: 7,
	MANAGE_GLOBAL_GENERAL: 10,
	MANAGE_GLOBAL_BANS: 11,
	MANAGE_GLOBAL_LOGS: 12,
	MANAGE_GLOBAL_NEWS: 13,
	MANAGE_GLOBAL_BOARDS: 14,
	MANAGE_GLOBAL_SETTINGS: 15,
	MANAGE_GLOBAL_ACCOUNTS: 16,
	MANAGE_GLOBAL_ROLES: 17,
	MANAGE_BOARD_OWNER: 20,
	MANAGE_BOARD_GENERAL: 21,
	MANAGE_BOARD_BANS: 22,
	MANAGE_BOARD_LOGS: 23,
	MANAGE_BOARD_SETTINGS: 24,
	MANAGE_BOARD_CUSTOMISATION: 25,
	MANAGE_BOARD_STAFF: 26,
	_MANAGE_BOARD_BITS: [20,21,22,23,24,25,26],
	USE_MARKDOWN_PINKTEXT: 35,
	USE_MARKDOWN_GREENTEXT: 36,
	USE_MARKDOWN_BOLD: 37,
	USE_MARKDOWN_UNDERLINE: 38,
	USE_MARKDOWN_STRIKETHROUGH: 39,
	USE_MARKDOWN_TITLE: 40,
	USE_MARKDOWN_ITALIC: 41,
	USE_MARKDOWN_SPOILER: 42,
	USE_MARKDOWN_MONO: 43,
	USE_MARKDOWN_CODE: 44,
	USE_MARKDOWN_DETECTED: 45,
	USE_MARKDOWN_LINK: 46,
	USE_MARKDOWN_DICE: 47,
	USE_MARKDOWN_FORTUNE: 48,
};

module.exports = Object.seal(Object.freeze(Object.preventExtensions(Permissions)));
