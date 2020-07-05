const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 80;

app.use(express.static(__dirname + '/public'));

io.on('connection', function(socket) {
	socket.on('join', data => {
		if (data.roomId && data.password) {
			// validate room exists and password is correct
			// if valid join room
			// add await
			const isValid = validDetails(data.roomId, data.password);
			if (isValid) {
				// get number of people in the room
				const num = numClientsInRoom(data.roomId);
				switch (num) {
					case 0:
						socket.join(data.roomId);
						socket.emit('roomJoined');
						console.log('roomJoined ', data.roomId);
						break;
					case 1:
						socket.join(data.roomId);
						socket.emit('roomJoined');
						console.log('roomJoined ', data.roomId);
						io.in(data.roomId).emit('peerConnected');
						console.log('peersConnected ', data.roomId);
						break;
					case 2:
						socket.emit('roomFull');
						break;
					default:
						break;
				}
			} else {
				// invalid password or roomId
				socket.emit('incorrectDetails');
			}
		} else {
			// no room details, bye bye
			socket.emit('missingDetails');
		}
	});

	socket.on('frontOffer', data => {
		if (data.offer && data.roomId) {
			socket.to(data.roomId).emit('backOffer', data.offer);
			// tell initiator their offer has been sent
			socket.emit('offerReceived');
			console.log('offerReceived and sent to peer ', data.roomId);
		}
	});
	socket.on('frontAnswer', data => {
		if (data.answer && data.roomId) {
			socket.to(data.roomId).emit('backAnswer', data.answer);
			// tell receiver answer sent
			socket.emit('answerReceived');
			console.log('answerReceived and sent to peer ', data.roomId);
		}
	});
	socket.on('disconnect', roomId => {
		io.to(roomId).emit('disconnect');
	});
});

function numClientsInRoom(room) {
	try {
		const clients = io.nsps['/'].adapter.rooms[room].sockets;
		return Object.keys(clients).length;
	} catch (error) {
		return 0;
	}
}
// async
function validDetails(roomId, password) {
	// go off to the database and check if the roomId exists and if the password matches
	//await  some mongoose promise
	return true;
}

http.listen(port, () => console.log(`Active on ${port} port`));
