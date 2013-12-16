// server module

var http = require("http");
var url = require("url");
var fs = require("fs");

var io = require("socket.io");

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
            if (request.method != "POST"){



                








                //console.log(games);
                // no need to route favicon requests in this hot rockstar app
                var myGame;
                var myPlayer;
                var gameFound = false;
                console.log(games);
                for(var i=0; i<games.length; i++ ){
                    if (games[i].p1.ip == request.connection.remoteAddress){
                        console.log("user already in game as player " + 1);
                        myGame = i;
                        gameFound = true;
                        myPlayer = 1;
                        break
                    }
                    if (games[i].p2 != undefined && games[i].p2.ip == request.connection.remoteAddress){
                        console.log("user already in game as player " + 2);
                        myGame = i;
                        gameFound = true;
                        myPlayer = 2;
                        break
                    }
                    if (games[i].p2 == undefined){
                        games[i].p2 = {"ip": request.connection.remoteAddress,
                                       "score": 0,
                                       "name": "",
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
                    games.push({"p1" : {"ip": request.connection.remoteAddress,
                                        "score": 0,
                                        "name": "",
                                        "paddle": 0}, 
                                "ball": {"x": 0, "y": 0, "i": 0, "j": 0}});
    
                    console.log("newGameCreated");
                    myGame = games.length - 1
                    myPlayer = 1;
                }



                socket.sockets.on('connection', function (socket) {
                    socket.emit('init', {"id": myGame, "game": games[myGame], "player": myPlayer}); // initialze the game
                    if (myPlayer == 2){
                        // contact player 1 of the game
                        socket.emit('player2Join', {"id": myGame, "game": games[myGame]})
                    }
                    setInterval(function(){
                        socket.emit('ballPacket', games[myGame].ball);
                    }, 50);
                });
                //console.log(request.connection.remoteAddress);
                
                /*if (request.method == "POST"){
                    gpd.getPost(request, function(returnVal) {
                        //console.log(returnVal);
                        if (myPlayer == 1){
                            games[myGame].p1Y = returnVal.yCoord;
                        }
                        if (myPlayer == 2){
                            games[myGame].p2Y = returnVal.yCoord;
                        }
                    });
                    if (myPlayer == 1){
                        if (games[myGame].p2Y != undefined){
                            response.write(games[myGame].p2Y);
                        }
                        else{
                            response.write("");
                        }
                    }
                    if (myPlayer == 2){
                        if (games[myGame].p2Y != undefined){
                            response.write(games[myGame].p1Y);
                        }
                        else{
                            response.write("");
                        }
                    }
                    response.end();
                }
                */
                response.writeHead(200, {"Content-Type": "text/html"});
                response.write(htmlStr);
                response.end();

                


            }

            //console.log("gamesJSONs: " + games);
            
        }

        

        
    }

    

    var ipv4
    ip.getIPv4(function(ip){
        ipv4 = ip;
    })

    httpServer = http.createServer(onRequest, ipv4).listen(1234); // port it's listening on
    socket = io.listen(httpServer, { log: false });

    console.log("The Sevrer Has Started");
    console.log("Running on " + ipv4  + ":1234")
}

exports.start = start;
