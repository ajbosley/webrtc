/* 

-- Connection and room Joining
connect
join
roomJoined
peerConnected

-- Peer Connection offer and answer handling
frontOffer - emit
offerReceived - server to initiator
backOffer - received
frontAnswer - emit
answerReceived - server to receiver
backAnswer - received
disconnect 

-- Invalid details
incorrectDetails - incorrect password or roomId
missingDetails - not all details present

*/

io.connect('/', { transports: ['websocket'] });

socket.on('connect', () => {
	if (hasPassword && hasRoomId) {
		joinRoom(password, roomId);
	}
});

socket.on('roomJoined', () => setRoomJoined(true));
socket.on('incorrectDetails', handleIncorrectDetails);
socket.on('missingDetails', handleMissingDetails);
socket.on('peerConnected', () => startCall(constraints, roomId, gotAnswer, videoRef));
socket.on('backOffer', offer => handleReceiveOffer(offer, myVideoStream, roomId));
socket.on('backAnswer', handleReceiveAnswer);
socket.on('offerReceived', () => setOfferReceived(true));
socket.on('answerReceived', () => setAnswerReceived(true));

function startCall(constraints, roomId, gotAnswer, videoRef) {
	// get camera stream
	getCamera(constraints, videoRef)
		.then(stream => {
			// create initiator peer
			const peer = createPeer(true, stream);
			// initiator creates offer
			peer.on('signal', offer => {
				handleCreateOffer(offer, roomId, gotAnswer);
			});
		})
		.catch(handleError);
}

function joinRoom(password, roomId) {
	socket.emit('join', { roomId, password });
}

function createPeer(isInitiator, stream) {
	// create new peer
	let peer = new Peer({
		initiator: isInitiator,
		stream: stream,
		trickle: false,
	});
	// create video for incoming peer when stream available
	peer.on('stream', incomingStream => {
		createIncomingVideo(incomingStream);
	});
	return peer;
}

function handleCreateOffer(offer, roomId, gotAnswer) {
	if (!gotAnswer) {
		socket.emit('frontOffer', { roomId, offer });
	}
}

function handleReceiveOffer(offer, roomId) {
	// get media devices based on constraints
	navigator.getUserMedia(constraints).then(myVideoStream => {
		// set myVideo srcObject
		myVideo.current.srcObject = myVideoStream;
		myVideo.current.play();
		// create peer
		const peer = createPeer(false, myVideoStream, offer);
		// create answer
		peer.on('signal', answer => {
			// send answer
			socket.emit('frontAnswer', { roomId, answer });
		});
		// set incoming signal as offer
		peer.signal(offer);
	});
}

function handleReceiveAnswer(answer, peer) {
	setGotAnswer(true);
	// no longer calling, isInCall
	peer.signal(answer);
}
function createIncomingVideo(incomingStream) {
	// update incoming video ref src object and press play
}
