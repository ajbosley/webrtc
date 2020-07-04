import React, { Component } from 'react';
import { getCamera } from './helpers/mediaHandler';
import Peer from 'simple-peer';
export default class PeerConnection extends Component {
	constructor(props) {
		super(props);
	}

	handleStartCall() {
		// returns peer to be set as peerRef
		const { constraints, roomId, gotAnswer, videoRef, createIncomingVideo } = this.props;

		if (constraints && roomId && gotAnswer && videoRef && createIncomingVideo) {
			const peer = this.startCall(constraints, roomId, gotAnswer, videoRef, createIncomingVideo); // start call returns a peer object
			return peer;
		} else {
			return false;
		}
	}

	handleReceiveOffer(offer, roomId, constraints, videoRef) {
		// receives call, no peerRef exists
		// returns peer to be set as peerRef

		const { constraints, roomId, videoRef, socketRef } = this.props;

		// get media devices based on constraints
		getCamera(constraints, videoRef)
			.then(stream => {
				console.log(videoRef);
				// set myVideo srcObject
				videoRef.srcObject = stream;
				videoRef.play();
				// create peer
				const peer = this.createPeer(false, stream, offer);
				// create answer
				peer.on('signal', answer => {
					// send answer
					socketRef.emit('frontAnswer', { answer: answer, roomId });
				});
				// set incoming signal as offer
				peer.signal(offer);

				return peer;
			})
			.catch(this.handleError);
	}

	handleReceiveAnswer(answer) {
		// peerRef exists, was created by handleReceiveOffer

		const { setGotAnswer, peerRef } = this.props;

		// no longer calling, isInCall
		setGotAnswer(true);
		peerRef.signal(answer);
	}
	startCall(constraints, roomId, videoRef, createIncomingVideo) {
		// get camera stream
		getCamera(constraints, videoRef)
			.then(stream => {
				// create initiator peer
				const peer = this.createPeer(true, stream, createIncomingVideo);
				// initiator creates offer
				peer.on('signal', offer => {
					this.handleCreateOffer(offer, roomId);
				});
				return peer;
			})
			.catch(this.handleError);
	}

	createPeer(isInitiator, stream, createIncomingVideo) {
		// create new peer
		let peer = new Peer({
			initiator: isInitiator,
			stream: stream,
			trickle: false,
			config: { iceServer: { urls: 'stun:stun.l.google.com:19302' } },
		});
		// create video for incoming peer when stream available
		peer.on('stream', incomingStream => {
			createIncomingVideo(incomingStream);
		});
		return peer;
	}

	handleCreateOffer(offer, roomId) {
		const { gotAnswer, socketRef } = this.props;

		if (!gotAnswer) {
			socketRef.emit('frontOffer', { offer: offer, roomId });
		}
	}
	handleError() {
		console.log('error handled');
	}
	render() {
		return <></>;
	}
}
