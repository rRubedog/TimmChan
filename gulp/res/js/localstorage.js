const isCatalog = window.location.pathname.endsWith('catalog.html');
const isThread = /\/\w+\/thread\/\d+.html/.test(window.location.pathname);
const isModView = /\/\w+\/manage\/(thread\/)?(index|\d+).html/.test(window.location.pathname);

function setLocalStorage(key, value) {
	try {
		localStorage.setItem(key, value);
	} catch (e) {
		deleteStartsWith();
	} finally {
		localStorage.setItem(key, value);
	}
}

function deleteStartsWith(startString = 'hovercache') {
	//clears hover cache when localstorage gets full
	const hoverCaches = Object.keys(localStorage).filter(k => k.startsWith(startString));
	for(let i = 0; i < hoverCaches.length; i++) {
		localStorage.removeItem(hoverCaches[i]);
	}
}

function setDefaultLocalStorage(key, value) {
	if (!localStorage.getItem(key)) {
		setLocalStorage(key, value);
	}
}
