import React, { createRef } from 'react';
import WebsocketConnection from './component/WebsocketConnection';
import io from 'socket.io-client';
import { getCamera } from './helpers/mediaHandler';
import 'webrtc-adapter';
import Peer from 'simple-peer';
export default class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			roomId: 'test',
			password: 'something',
			constraints: { audio: true, video: true },
			canCall: false,
			sentAnswer: false,
		};
		this.socket = createRef();
		this.videoRef = createRef();
		this.incomingVideoRef = createRef();
		this.peerRef = createRef();
		this.handleStartCall = handleStartCall.bind(this);
		this.startCall = startCall.bind(this);
		this.handleReceiveOffer = handleReceiveOffer.bind(this);
		this.handleCreateOffer = handleCreateOffer.bind(this);
		this.handleReceiveAnswer = handleReceiveAnswer.bind(this);
		this.createIncomingVideo = createIncomingVideo.bind(this);
		this.createPeer = createPeer.bind(this);
		function handleStartCall() {
			console.log('peer connected can start call');
			this.setState({ canCall: true });
		}
		function handleReceiveOffer(offer) {
			console.log('handling received offer');
			if (!this.state.sentAnswer) {
				this.setState({ sentAnswer: true });
				console.log('sending answer');
				// get media devices based on constraints
				getCamera(this.state.constraints, this.videoRef.current)
					.then(stream => {
						if (stream && typeof stream.error !== 'undefined') {
							// handle error
							console.log('uh oh');
						} else {
							this.videoRef.current.srcObject = stream;
							this.videoRef.current.play();
							// create peer
							const peer = this.createPeer(false, stream, offer);
							// create answer
							peer.on('signal', answer => {
								// send answer
								this.socket.current.emit('frontAnswer', {
									answer: answer,
									roomId: this.state.roomId,
								});
							});
							// set incoming signal as offer
							peer.signal(offer);
							this.peerRef.current = peer;
						}
					})
					.catch(this.handleError);
			}
		}
		function handleReceiveAnswer(answer) {
			console.log('handling received answer');
			if (!this.state.gotAnswer) {
				// peerRef exists, was created by handleReceiveOffer
				// no longer calling, isInCall
				this.setState({ gotAnswer: true });
				this.peerRef.current.signal(answer);
				console.log('set new answer');
			}
		}
		function handleCreateOffer(offer) {
			if (!this.state.gotAnswer) {
				this.socket.current.emit('frontOffer', { offer: offer, roomId: this.state.roomId });
			}
		}
		function startCall() {
			console.log('starting call');
			const { constraints, roomId, gotAnswer } = this.state;
			// get camera stream
			getCamera(constraints, this.videoRef.current)
				.then(stream => {
					// create initiator peer
					const peer = this.createPeer(true, stream);
					// initiator creates offer
					peer.on('signal', offer => {
						this.handleCreateOffer(offer, roomId);
					});
					this.peerRef.current = peer;
				})
				.catch(this.handleError);
		}
		function createPeer(isInitiator, stream) {
			// create new peer
			let peer = new Peer({
				initiator: isInitiator,
				stream: stream,
				trickle: false,
				config: { iceServer: { urls: 'stun:stun.l.google.com:19302' } },
			});
			// create video for incoming peer when stream available
			peer.on('stream', incomingStream => {
				this.incomingVideoRef.current.srcObject = stream;
				this.incomingVideoRef.current.play();
			});
			return peer;
		}

		function createIncomingVideo(stream) {
			console.log(stream);
		}
	}
	componentWillMount() {
		this.socket.current = io.connect('localhost:80/', { transports: ['websocket'] });
	}
	render() {
		return (
			<div className='App'>
				{this.state.password && this.state.roomId && (
					<WebsocketConnection
						socket={this.socket.current}
						password={this.state.password}
						roomId={this.state.roomId}
						handleIncorrectDetails={() => console.log('incorrect details')}
						handleMissingDetails={() => console.log('missing details')}
						handleStartCall={this.handleStartCall}
						handleReceiveOffer={this.handleReceiveOffer}
						handleReceiveAnswer={this.handleReceiveAnswer}
						setRoomJoined={value => this.setState({ roomJoined: value })}
					/>
				)}
				<video ref={this.videoRef}></video>
				{this.state.canCall && <button onClick={this.startCall}>Call other person</button>}
				<video ref={this.incomingVideoRef}></video>
			</div>
		);
	}
}
