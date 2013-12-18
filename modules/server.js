// server module

var http = require("http");
var url = require("url");
var fs = require("fs");

var io = require("socket.io");
require("socket.io-client");

var gpd = require("./getPost");
var ip = require("./getip");

var htmlStr;




fs.readFile("./files/pong.html", 'utf8', function (err, data) {
                 if (err) throw err;
                 htmlStr = data;
            })

function start(){
    var games = [];
    //console.log("games json initialized");
    function onRequest(request, response) {
        if (url.parse(request.url).pathname != "/favicon.ico"){ 
            response.writeHead(200, {"Content-Type": "text/html"}); //http 200 = ok
            response.write(htmlStr);
            response.end();

            
        }
    }

    

    var ipv4
    ip.getIPv4(function(ip){
        ipv4 = ip;
    })

    httpServer = http.createServer(onRequest, ipv4).listen(1234); // port it's listening on
    io = io.listen(httpServer, { log: false });

    io.set('origins', "*:*");

    console.log("The Sevrer Has Started");
    console.log("Running on " + ipv4  + ":1234")

    io.sockets.on('connection', function (socket) { // a sort of state machine needs to exist here
                    

        var myGame;
        var myPlayer;
        var myId;
        var gameFound = false;
        for(var i=0; i<games.length; i++ ){
            if (games[i].p1.ip == socket.handshake.address.address){
                console.log("user already in game as player " + 1);
                myGame = i;
                gameFound = true;
                myPlayer = 1;
                break
            }
            if (games[i].p2 != undefined && games[i].p2.ip == socket.handshake.address.address){
                console.log("user already in game as player " + 2);
                myGame = i;
                gameFound = true;
                myPlayer = 2;
                break
            }
            if (games[i].p2 == undefined){
                games[i].p2 = {"ip": socket.handshake.address.address,
                               "score": 0,
                               "name": "",
                               "id": null,
                               "paddle": 0
                              }      
                console.log("user added to game" + games[i]);
                // start a new game
                myGame = i;
                myPlayer = 2;
                gameFound = true;
                break;
            }
        }
        if (gameFound == false){
            games.push({"p1" : {"ip": socket.handshake.address.address,
                                "score": 0,
                                "name": "",
                                "id": null,
                                "paddle": 0}, 
                        "ball": {"x": 0, "y": 0, "i": 0, "j": 0}});
    
            console.log("newGameCreated");
            myGame = games.length - 1
            myPlayer = 1;
        }


        console.log(games);
        console.log(myGame);



        // should only be sent to ONE SOCKET
        socket.emit('init', {"id": myGame, "game": games[myGame], "player": myPlayer}); // initialze the game
        var updated = false;


        socket.on('startGame', function (gameId){
            games[gameId].ball.i = 0.01;
            games[gameId].ball.j = 0.01;
        })

        socket.on('paddlePacket', function (data){
            if (myPlayer == 1){
                games[myGame].p1.paddle = data;
            } else {
                games[myGame].p2.paddle = data;
            }
        })

        function score(p){
            games[myGame].ball.x = 0;
            games[myGame].ball.y = 0;
            games[myGame].ball.j = (Math.random() * 0.04) -0.02;
            games[myGame].ball.i = (Math.random() * 0.1) -0.05;
            p.score = p.score + 1; 
        }

        setInterval(function(){
            socket.emit('ballPacket', games[myGame]);
            if (games[myGame].p2 != undefined && !updated){
                // contact player 1 of the game
                socket.emit('player2Join', {"id": myGame, "game": games[myGame]})
                console.log("emitting player 2 join...")
                updated = true;
            }

            // move ball
            games[myGame].ball.x += games[myGame].ball.i;
            games[myGame].ball.y += games[myGame].ball.j;

            // handle collisions

            // check for collisions
            // the ball will potentially colide if it's X coord is
            // +-5 - paddle width - ball width (+-5 - 0.25 - 0.2)
            
             if (games[myGame].ball.x >= 6){
                score(games[myGame].p1);
             }

             if (games[myGame].ball.x <= -6){
                score(games[myGame].p2);
             }
            if (games[myGame].ball.x >= 4.55  && games[myGame].ball.x <= 4.65){
                // potential collision with right paddle
                // abs(ball.y - right.y) needs to be less than 1
                if (Math.abs(games[myGame].ball.y - games[myGame].p2.paddle) <= 1.2){
                    games[myGame].ball.i *= -1
                }
				
            } else if (games[myGame].ball.x <= -4.55 && games[myGame].ball.x >= -4.65){
                // potential collision with left paddle
                // abs(ball.y - left.y) needs to be less than 1
                if (Math.abs(games[myGame].ball.y - games[myGame].p1.paddle) <= 1.2){
                    games[myGame].ball.i *= -1
                }
				
            }
            // lower than floor : ballY >= (5 - half ball height - half the cieling/floor height)
            if (games[myGame].ball.y <= (5 - 0.2 - 1.75)){


                games[myGame].ball.j *= -1
            }if (games[myGame].ball.y >= -(5 - 0.2 - 1.75)){
                games[myGame].ball.j *= -1
            }

        }, 10); // framerate

        
    });
}

exports.start = start;
