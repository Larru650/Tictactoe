$(document).ready(function () {
    
    var socket = io();
    var $exes = [];
    var $username = prompt("Please enter your name");
    var $name = $('#name');
    var $users = $('#users');
    var player2 = null;
    var counter = 0;
    var yourTurn = true;
    var $waitingContainer = $('#waitingContainer');
    var waiting = "<strong>Player 2's turn...</strong> "
    var end = "<strong>Game Over</strong>";
    var $endContainer = $('#endContainer');
    $waitingContainer.append(waiting);
    $endContainer.append(end);
    $waitingContainer.hide();
    $endContainer.hide();
    var player1 = new Player($username, 1);
    
    function Player(nickname, role) {
        this.nickname = nickname,
            this.role = role
    }

    socket.emit('new user', $username);
    socket.on('socketid', function (data) {
        var socketId = data;
        var userDetails = $username + ' ' + socketId;
        $name.html(userDetails);
    })
    socket.on('get users', function (data) {
        console.log("data", data)
        var html = '';
        for (var i = 0; i < data.length; i++) {
            html += '<li class="list-group-item">' + '<b>Player Name:<b>&nbsp;' + data[i].name + '<br/><b>Lobby:<b> &nbsp; ' + data[i].lobby + '</li>';
        }
        $users.html(html);
    });

    socket.on('player2 connected', function (data) {
        console.log("player 2 has connected: ", data);
        player2 = new Player(data.nickname, data.role);
        player2.role = 2; //we are assigning O as this is the second player;
    });

    $('.cell').click(function () {
        var $selectedCell = $(this);
        console.log("this is the selcted cell: ", $selectedCell);
        if (counter < 3 && yourTurn && $exes.length < 3) {
            $exes.push({ class: $(this).attr('class'), id: $(this).attr('id') });
            var x = { class: $(this).attr('class'), id: $(this).attr('id') };
            //   alert("clicked cell number " + $(this).attr('id') + "!");
            $selectedCell.append('<strong class="exes">X</strong>'); //where strong, add socket.user.turn
            $selectedCell.unbind();
            socket.emit('player2 turn', x);
            counter++;
            yourTurn = false;
            $waitingContainer.show();
            if ($exes.length == 3) {
                $waitingContainer.hide();
                $endContainer.show();
                console.log("exes", $exes);
                getExesIds($exes);
            }
        }
        // 
    });

    function getExesIds(exes) {
        var result = [];
        for (var i = 0; i < exes.length; i++) {
            result.push(exes[i].id);
        };
        getScore(result);
    }

    function containsAll(ids, results) {
        var count = 0;
        for (var i = 0; i < ids.length; i++) {
            if ($.inArray(ids[i], results) > -1){
                count++;
            }
        }
        return count == 3;
    };

    function getScore(score) {
        console.log("score", score);
        if (containsAll(["1", "2", "3"], score)) {
            alert("you win!");
        }
        if (containsAll(["4", "5", "6"], score)) {
            alert("you win!");
        }
        if (containsAll(["7", "8", "9"], score)) {
            alert("you win!");
        }
        if (containsAll(["1", "5", "9"], score)) {
            alert("you win!");
        }
        if (containsAll(["1", "4", "7"], score)) {
            alert("you win!");
        }
        if (containsAll(["2", "5", "8"], score)) {
            alert("you win!");
        }
        if (containsAll(["3", "6", "9"], score)) {
            alert("you win!");
        }
    };

    socket.on('os', function (data) {
        $('.cell').each(function () {
            console.log("cell", $(this));
            if ($(this)[0].id == data.id) {
                var $player2Turn = $(this);
                console.log("this is the player2 turn: ", data);
                $waitingContainer.hide();
                $player2Turn.append('<strong class="exes">O</strong>'); //where strong, add socket.user.turn
                $player2Turn.unbind();
                yourTurn = true;
            }
        })
    });

    socket.on('user disconnected', function (user) {
        console.log("user has disconnected");
    })

    $(window).on('beforeunload', function () {
        socket.emit('leave', socket.id, $username.valueOf());
    });
});