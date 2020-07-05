/* 
isViable - done
getDevices - done - returns audio and video devices or error
getCamera - done - resolves videoStream or rejects error
toggleAudioIncoming - done - returns boolean 'isMuted'
toggleAudioOutgoing - done - uses swapStream to add new Audio Track and make sure video track is correct - returns boolean hasSwapped false means error
swapStream - done - uses getCamera - if stream doesn't exist, add stream else swap existing streams - returns boolean hasSwapped false means error
*/

function isViable() {
	return (
		navigator.mediaDevices &&
		navigator.mediaDevices.enumerateDevices &&
		navigator.mediaDevices.getUserMedia
	);
}

async function getDevices() {
	let audioDevices = [],
		videoDevices = [];
	return new Promise((resolve, reject) => {
		// List cameras and microphones.
		navigator.mediaDevices
			.enumerateDevices()
			.then(devices => {
				devices.forEach(device => {
					switch (device.kind) {
						case 'audioinput':
							audioDevices.push(device);
							break;
						case 'videoinput':
							videoDevices.push(device);
							break;
						default:
							break;
					}
				});
				resolve({ audioDevices, videoDevices });
			})
			.catch(function(err) {
				reject({ error: 'An error occurred' });
			});
	});
}

function getCamera(constraints) {
	// get media devices based on constraints
	return new Promise((resolve, reject) => {
		navigator.getUserMedia(
			constraints,
			stream => {
				resolve(stream);
			},
			error => {
				//TODO handle error getting media, probably rejected by user or doesn't exist

				reject({ error: 'true' });
			}
		);
	});
}

function toggleAudioIncoming(videoRef) {
	// toggle video volume between 0 and 1.
	videoRef.current.volume === 0 ? (videoRef.current.volume = 1) : (videoRef.current.volume = 0);
	return videoRef.current.volume !== 1;
}

function toggleAudioOutgoing(peer, currentStream, constraints) {
	const audioTracks = currentStream.getAudioTracks();
	if (audioTracks && audioTracks[0]) {
		// remove audio streams
		peer.removeTrack(audioTracks[0], currentStream);
		return true;
	} else {
		swapStream(peer, currentStream, constraints);
	}
}

function swapStream(peer, currentStream, constraints) {
	// handles adding new video and audio streams
	// handles swapping video streams
	// video stream MUST be present at all times
	// DOES NOT HANDLE REMOVING AUDIO STREAMS
	getCamera(constraints)
		.then(newStream => {
			const oldAudioTracks = currentStream.getAudioTracks();
			const oldVideoTracks = currentStream.getVideoTracks();
			const newAudioTracks = newStream.getAudioTracks();
			const newVideoTracks = currentStream.getVideoTracks();

			if (exists('video') && newVideoTracks[0]) {
				//  old video is being swapped
				peer.replaceTrack(oldVideoTracks[0], newVideoTracks[0], currentStream);
			} else if (exists('video') && typeof newVideoTracks[0] === 'undefined') {
				// TODO handle no video stream requested
			} else if (!exists('video')) {
				// TODO how do I even get here?
				return false;
			}
			// No old audio so add new video
			if (!exists('audio') && newAudioTracks[0]) {
				peer.addTrack(newAudioTracks[0], currentStream);
			} else if (exists('audio') && newAudioTracks[0]) {
				// swap audio streams
				peer.replaceTrack(oldAudioTracks[0], newAudioTracks[0], currentStream);
			}
			return true;

			function exists(type) {
				if (type === 'audio') {
					return typeof oldAudioTracks !== 'undefined' && typeof oldAudioTracks[0] !== 'undefined';
				} else {
					return typeof oldVideoTracks !== 'undefined' && typeof oldVideoTracks[0] !== 'undefined';
				}
			}
		})
		.catch(handleCameraError);

	function handleCameraError(err) {
		console.log(err);
		return false;
	}
}

module.exports = {
	isViable,
	getDevices,
	getCamera,
	toggleAudioIncoming,
	toggleAudioOutgoing,
	swapStream,
};
