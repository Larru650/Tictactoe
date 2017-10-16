var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static('public'));

app.get('/', function (req, res) {
    res.send(__dirname + '/index.html');
});

var connections = [];
var lobbies = [];
var users = [];


function Player(id, nickname, role) {
    this.id = id,
        this.nickname = nickname,
        this.role = role
}

function Lobby() {
    this.players = [],
        this.playerCount = 0;
}

var lobby = new Lobby(); //we create a new lobby so at least we have one to loop through
lobbies.push(lobby);

io.sockets.on('connection', function (socket) {

    connections.push(socket);

    socket.on('end of turn', function (exes) {
        console.log('end of turn');
        io.emit('player turn', exes);
    });

    socket.on('new user', function (data) {
        console.log(data + " has connected, his socket id is " + socket.id);
        var player = new Player(socket.id, data, 1);
        var joined = false
        socket.emit('socketid', socket.id);
        for (var i = 0; i < lobbies.length; i++) {
            if (lobbies[i].playerCount < 2) {
                console.log(socket.id + " joined lobby " + i)
                socket.lobbyId = i;
                lobbies[i].players[socket.id] = player.id;
                lobbies[i].playerCount++;
                if (lobbies[i].playerCount == 2) { //that means that it was 1 when the user joined
                    var player2;
                    var player1 = socket.id //player1 will always be the current socket
                    for (key in lobbies[i].players) {
                        if (key != socket.id) {//if we find another player in the lobby, that one will be player2 for the current socket
                            player2 = key;
                        }
                    }
                    for (key in lobbies[i].players) {
                        if (player == socket.id) //we need to send to player1 the player2 object
                            io.to(player1).emit('player2 connected', lobbies[i].players[player2]);
                        if (player != socket.id) { //and to player2 the player1 object and start the game as that means that there are 2 players
                            console.log("2 players in the current lobby")
                            io.to(player2).emit('player2 connected', lobbies[i].players[player1]);
                            socket.broadcast.to(key).emit('start game');
                        }
                    }
                }
                joined = true;
                break;
            }
        }
        if (!joined) { //that means that lobby has more than 2 players, so we need to create a new lobby
            var lobby = new Lobby();
            socket.lobbyId = i;
            lobby.players[socket.id] = player.id;
            lobby.playerCount++;
            lobbies.push(lobby);
        }

        var data = {
            playerId: player.id,
        }
        socket.emit("details", data);
        // users.push(socket);
        // updateUsernames();


    });

    socket.on('player2 turn', function (data) {
        var os = data;
        console.log(data);
        console.log(lobbies);
        for (var i = 0; i < lobbies.length; i++) {
            for (key in lobbies[i].players) {
                if (key == socket.id) {
                    var sharedLobby = lobbies[i].players;
                    console.log("sharedLobby....", sharedLobby)
                    for (key in sharedLobby) {
                        if (key != socket.id) {
                            var player1 = key;
                            console.log("sending os to: ", player1)
                            console.log("os", os)
                            io.to(player1).emit('os', os);
                        }
                    }
                }
            }
        }       
});
// io.sockets.on('connection', function(socket) {
//     socket.on('create', function(room) {
//         socket.join(room);
//     });

socket.on('leave', function (user, username) {
    console.log(username + " has left");
    console.log("user " + user + " disconnected");
    connections.splice(user, 1);
    users.splice(username, 1);
    updateUsernames(); //we need to update the UI list
});
});

function updateUsernames() {
    console.log("users list", users);
    console.log("");
    for (var i = 0; i < users.length; i++) {
        console.log("----------------CONNECTIONS------------------------");

        console.log("Connection no " + i + ": ", users[i]);

    }
    console.log("");
    io.sockets.emit('get users', users);
};


http.listen(8080, function () {
    console.log('listening on *:8080');
});