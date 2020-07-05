import React, { Component } from 'react';

class WebsocketConnection extends Component {
	setupConnection = () => {
		const {
			socket,
			password,
			roomId,
			setRoomJoined,
			handleIncorrectDetails,
			handleMissingDetails,
			handleStartCall,
			handleReceiveOffer,
		} = this.props;

		socket.on('connect', () => {
			if (password && roomId) {
				joinRoom(password, roomId);
			}
		});

		socket.on('roomJoined', () => {
			// fire room joined callback
			setRoomJoined(true);
		});
		socket.on('incorrectDetails', handleIncorrectDetails);
		socket.on('missingDetails', handleMissingDetails);
		socket.on('peerConnected', handleStartCall);
		socket.on('backOffer', handleReceiveOffer);
		socket.on('offerReceived', () => console.log('server received offer'));
		socket.on('answerReceived', () => console.log('server received answer'));
		function joinRoom(password, roomId) {
			socket.emit('join', { roomId, password });
		}
	};

	componentDidMount() {
		this.setupConnection();
	}
	componentWillUnmount() {
		this.props.socket.disconnect();
	}

	render() {
		return <></>;
	}
}
export default WebsocketConnection;
