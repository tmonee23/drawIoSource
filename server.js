const express = require("express")
const http = require("http")
const socketIO = require("socket.io")
const app = express()
const server = http.Server(app)
const io = socketIO.listen(server)

app.set("port", process.env.PORT || 5500)
app.use("/public", express.static(__dirname + "/public"))
app.set("views", "views")
app.set("view engine", "ejs")
app.use(express.urlencoded({ extended: true }))

const games = {}
const EnglishWordsNormal = ["angel", "angry", "baby", "beard", "bible", "bikini", "book", "bucket", "butterfly", "camera", "cat", "church", "dolphin", "eyeball", "fireworks", "flower", "giraffe", "glasses", "igloo", "lamp", "lion", "mailbox", "night", "nose", "olympics", "peanut", "pizza", "pumpkin", "rainbow", "recycle", "snowflake", "stairs", "starfish", "strawberry", "sun", "toast", "toothbrush", "toothpaste", "truck", "volleyball"]
const GermanWordsNormal = ["fernbedienung", "rasierschaum", "lampe", "geschenkpapier", "schaukelpferd", "hand", "buch", "fluss", "fahrrad", "lastwagen","auge", "basketball", "zirkus", "höhle", "bauernhof", "blut", "gedicht", "eidechse", "blumenvase", "stiefel", "waffe", "schloss", "telefon", "glas", "mayonnaise", "zitrone", "limette", "baum", "schule", "geruch", "krieg", "paket", "briefe", "waschmaschine", "rechnung", "strom", "soldat", "koch", "maus", "zucker", "weihnachten", "angst", "ast", "signal"]
const EnglishWordsSports = ["soccer", "basketball", "hockey", "dance", "throw", "running", "gym", "heart", "kobe", "messi", "olympics", "billiards", "swimming", "surfing", "skateboard", "snowboard", "racing", "timer", "archery", "arrow", "badminton", "baseball", "bike", "boxing", "bowling", "cricket", "tournament", "fans", "darts", "dodgeball", "diving", "deadlift", "fencing", "frisbee", "hoop", "halftime", "karate", "league", "mouthguard", "paintball", "rugby", "sailing", "target", "triathlon", "winner", "wrestling"]
const GermanWordsSports = ["fussball", "basketball", "hockey", "tanzen", "werfen", "rennen", "herz", "kobe", "schwimmen", "surfen", "skateboard", ""]

app.get("/", (req, res) => {
    res.render("index", { games: games })
})
app.post("/game", (req, res) => {
    if (games[req.body.game] != null) {
        return res.redirect("/")
    }
    games[req.body.game] = {
        gameState: {
            connectedPlayers: {},
            timer: 0,
            timerLength: 5,
            word: "",
            totalPlayers: 0,
            currentArtist: 0,
            gameHasStarted: false,
            turn: 0,
            turnsToPlay: 3,
            wordsToUse : EnglishWordsNormal,
            nameOfWordsToUse : "English Normal"
        }
    }
    res.redirect(req.body.game)
    // Event to display new game in index screen
    io.emit("game created", req.body.game)
})
app.get("/:game", (req, res) => {
    if (games[req.params.game] == null) return res.redirect("/")
    res.render("game", { gameName: req.params.game })
})

io.on("connection", (socket) => {
    var gameName = ""
    socket.on("new player", (game, username) => {
        socket.join(game)
        games[game].gameState.connectedPlayers[socket.id] = {
            name: username,
            isArtist: false,
            score: 0,
            hasGuessed: false
        }
        games[game].gameState.totalPlayers++
        io.sockets.in(game).emit("state", games[game].gameState)
        socket.broadcast.to(game).emit("state", games[game].gameState)
        gameName = game
    })

    socket.on("changed word theme", (theme) => {
        switch (theme) {
            case "english normal":
                games[game].gameState.wordsToUse = EnglishWordsNormal
                games[game].gameState.nameOfWordsToUse = "English Normal"
                break;
            case "german normal":
                // code block
                games[game].gameState.wordsToUse = GermanWordsNormal
                games[game].gameState.nameOfWordsToUse = "German Normal"
                break;
            case "english sports":
                // code block
                games[game].gameState.wordsToUse = EnglishWordsSports
                games[game].gameState.nameOfWordsToUse = "English Sports"
                break
            case "german sports":
                // code block
                games[game].gameState.wordsToUse = GermanWordsSports
                games[game].gameState.nameOfWordsToUse = "German Sports"
                break
            default:
                // code block
                games[game].gameState.wordsToUse = EnglishWordsNormal
                games[game].gameState.nameOfWordsToUse = "English Normal"
        }
    })

    socket.on("reset points", () => {
        for(players in games[gameName].gameState.connectedPlayers){
            games[gameName].gameState.connectedPlayers[players].score = 0
        }
    })

    socket.on("start game", (roundsAmount, timeAmount) => {
        games[gameName].gameState.gameHasStarted = true
        games[gameName].gameState.timer = 0
        determineArtistStart(gameName)
        games[gameName].gameState.timerLength = timeAmount
        games[gameName].gameState.turnsToPlay = roundsAmount

        io.sockets.in(gameName).emit("game begins")
        socket.broadcast.to(gameName).emit("game begins")
        io.sockets.in(gameName).emit("state", games[gameName].gameState)
        socket.broadcast.to(gameName).emit("state", games[gameName].gameState)
    })

    socket.on("updated drawing", (image) => {
        io.sockets.in(gameName).emit("updated image", image)
        socket.broadcast.to(gameName).emit("updated image", image)
    }) 

    socket.on("guess", (guessedWord) => {
        if(guessedWord.toLowerCase() == games[gameName].gameState.word){
            games[gameName].gameState.connectedPlayers[socket.id].hasGuessed = true
            games[gameName].gameState.connectedPlayers[socket.id].score += games[gameName].gameState.timerLength + games[gameName].gameState.timer * 2
            for (player in games[gameName].gameState.connectedPlayers) {
                if (games[gameName].gameState.connectedPlayers[player].isArtist) {
                    games[gameName].gameState.connectedPlayers[player].score += games[gameName].gameState.timer * 3
                }
    
            }
            socket.emit("guessed correctly")

            io.sockets.in(gameName).emit("state", games[gameName].gameState)
            socket.broadcast.to(gameName).emit("state", games[gameName].gameState)
    
        }else{
            socket.emit("guessed incorrectly")
            return
        }
    })

    socket.on("disconnect", () => {
        if (gameName != "") {
            games[gameName].gameState.totalPlayers--
            delete games[gameName].gameState.connectedPlayers[socket.id]
        }
    })

    setInterval(() => {
        if (gameName != "") {
            if (games[gameName].gameState.gameHasStarted) {
                if (games[gameName].gameState.timer <= 0) {
                    if (games[gameName].gameState.turn >= games[gameName].gameState.turnsToPlay) {
                        resetGame(gameName, socket)
                    } else {
                        changeWord(gameName)
                        determineArtist(gameName)
                        games[gameName].gameState.timer = games[gameName].gameState.timerLength
                        games[gameName].gameState.turn++
                        for (player in games[gameName].gameState.connectedPlayers) {
                            games[gameName].gameState.connectedPlayers[player].hasGuessed = false
                        }
                    }
                }else{
                    var allHaveGuessed = true
                    for(player in games[gameName].gameState.connectedPlayers){
                        if(!games[gameName].gameState.connectedPlayers[player].isArtist){
                            if(!games[gameName].gameState.connectedPlayers[player].hasGuessed){
                                allHaveGuessed = false
                            }
                        }
                    }
                    if(allHaveGuessed){
                        games[gameName].gameState.timer = 0
                    }
                }
            }
            io.sockets.in(gameName).emit("state", games[gameName].gameState)
            socket.broadcast.to(gameName).emit("state", games[gameName].gameState)
        }
    }, 1000)
})

function changeWord(gameName) {
    var random = Math.random() * (games[gameName].gameState.wordsToUse.length - 1)
    games[gameName].gameState.word = games[gameName].gameState.wordsToUse[Math.round(random)]
}

function determineArtistStart(gameName) {
    var playerIndex = []
    for (player in games[gameName].gameState.connectedPlayers) {
        playerIndex.push(player)
    }
    var random = Math.random() * playerIndex.length
    var playerToBeArtist = playerIndex[Math.floor(random)]
    for (player in games[gameName].gameState.connectedPlayers) {
        if (games[gameName].gameState.connectedPlayers[player] == games[gameName].gameState.connectedPlayers[playerToBeArtist]) {
            games[gameName].gameState.connectedPlayers[player].isArtist = true
        } else {
            games[gameName].gameState.connectedPlayers[player].isArtist = false
        }
    }
}

function determineArtist(gameName) {
    var playerIndex = []
    for (player in games[gameName].gameState.connectedPlayers) {
        playerIndex.push(player)
    }
    var count = 0
    var nextPainter
    for (var i = 0; i < playerIndex.length; i++) {
        if (games[gameName].gameState.connectedPlayers[playerIndex[i]].isArtist) {
            nextPainter = playerIndex[count + 1]
            if (nextPainter == null) {
                nextPainter = playerIndex[0]

            }
        } else {
            count++
        }
    }

    for (player in games[gameName].gameState.connectedPlayers) {
        if (games[gameName].gameState.connectedPlayers[player] == games[gameName].gameState.connectedPlayers[nextPainter]) {
            games[gameName].gameState.connectedPlayers[player].isArtist = true
        } else {
            games[gameName].gameState.connectedPlayers[player].isArtist = false
        }
    }

}

function resetGame(gameName, socket) {
    for (player in games[gameName].gameState.connectedPlayers) {
        games[gameName].gameState.connectedPlayers[player].isArtist = false
    }
    games[gameName].gameState.turn = 0
    games[gameName].gameState.gameHasStarted = false
    games[gameName].gameState.timer = games[gameName].gameState.timerLength
    io.sockets.in(gameName).emit("state", games[gameName].gameState)
    socket.broadcast.to(gameName).emit("state", games[gameName].gameState)
    io.sockets.in(gameName).emit("game ended", games[gameName].gameState)
    socket.broadcast.to(gameName).emit("game ended", games[gameName].gameState)
}

setInterval(() => {
    for (game in games) {
        if (games[game].gameState.gameHasStarted) {
            games[game].gameState.timer--
        }
    }
}, 1000);

server.listen(process.env.PORT || 5500, () => {
    console.log("Server is Live on Port 5000")
})