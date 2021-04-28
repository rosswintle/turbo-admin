document.addEventListener('DOMContentLoaded', e => {
	// Create ready event
	var event = new CustomEvent("turbo-admin-ready");

	// Dispatch/Trigger/Fire the event
	document.dispatchEvent(event);
});
