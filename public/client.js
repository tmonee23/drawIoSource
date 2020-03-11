const socket = io.connect("/")

const GameContainerElement = document.getElementById("gameContainer")
const TimerElement = document.getElementById("timer")

if (TimerElement != null) {
    TimerElement.style.display = "none"

    const canvas = document.getElementById("canvas")
    const context = canvas.getContext("2d")

    var WIDTH = canvas.width
    var HEIGHT = canvas.height

    const randomPlaceHolder = Math.random() * 100000
    const username = prompt("What is your name?", randomPlaceHolder.toFixed(0))
    const ConnectedPlayerStatusElements = document.getElementsByClassName("connectedPlayer-container")
    const WordContainerElement = document.getElementById("wordContainer")

    const StartGameButton = document.getElementById("startButton")
    const GuessWordButton = document.getElementById("guessButton")
    const GuessedWordInput = document.getElementById("guessedInput")
    const RoundsPerGameInput = document.getElementById("roundsInput")
    const TimePerGameInput = document.getElementById("timeInput")
    const GameSettingsContainerElement = document.getElementById("gameSettingContainer")
    const WinningTextElement = document.getElementById("winnerText")

    const ColorButtonElement = document.getElementById("colorButton")
    const ColorInputElement = document.getElementById("colorInput")
    const EraseColorButtonElement = document.getElementById("whiteColorButton")

    const ThinLineButtonElement = document.getElementById("thinThicknessButton")
    const NormalLineButtonElement = document.getElementById("normalThicknessButton")
    const FatLineButtonElement = document.getElementById("fatThicknessButton")
    const ClearAllButtonElement = document.getElementById("clearAllButton")

    const PaintSettingContainerElement = document.getElementById("colorWheel")

    GuessedWordInput.style.display = "none"
    GuessWordButton.style.display = "none"
    WinningTextElement.style.display = "none"

    const EnglishNormalWordsButton = document.getElementById("englishNormalWordsButton")
    const GermanNormalWordsButton = document.getElementById("germanNormalWordsButton")
    const CurrentlySelectedWordsTextElement = document.getElementById("currentlySelectedWords")
    const GameSettingContainer = document.getElementById("gameSettingContainer")

    var sentUserData = false
    var isAllowedToDraw = false
    var mouseButtonIsPressed = false
    var yourPoints = {}
    var drawPosition = {
        x: null,
        y: null,
        color: null
    }
    var pointCount = 0
    var strokeColor = "blue"
    var lineThickness = 5
    var roundsUserInput = 0
    var timerUserInput = 0
    var hasGuessed = false
    var wordsUserInput = "english normal"

    StartGameButton.addEventListener("click", () => {
        roundsUserInput = Math.round(RoundsPerGameInput.value)
        timerUserInput = Math.round(TimePerGameInput.value)
        if (roundsUserInput != null && roundsUserInput != 0 && timerUserInput != null && timerUserInput != 0) {
            socket.emit("start game", roundsUserInput, timerUserInput)
            TimerElement.style.display = "block"
            GameSettingsContainerElement.style.display = "none"
        }
    })

    GuessWordButton.addEventListener("click", () => {
        if (!hasGuessed) {
            socket.emit("guess", GuessedWordInput.value)
        }
    })
    GuessedWordInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            if (!hasGuessed) {
                socket.emit("guess", GuessedWordInput.value)
            }
        }
    });

    ColorButtonElement.addEventListener("click", () => {
        strokeColor = ColorInputElement.value
    })
    EraseColorButtonElement.addEventListener("click", () => {
        strokeColor = "white"
    })
    ThinLineButtonElement.addEventListener("click", () => {
        lineThickness = 2
    })
    NormalLineButtonElement.addEventListener("click", () => {
        lineThickness = 5
    })
    FatLineButtonElement.addEventListener("click", () => {
        lineThickness = 10
    })
    ClearAllButtonElement.addEventListener("click", () => {
        yourPoints = {}
        socket.emit("clear all", gameName)
    })
    EnglishNormalWordsButton.addEventListener("click", () => {
        wordsUserInput = "english normal"
        socket.emit("changed word theme", wordsUserInput)
    })
    GermanNormalWordsButton.addEventListener("click", () => {
        wordsUserInput = "german normal"
        socket.emit("changed word theme", wordsUserInput)
    })




    document.addEventListener("mousedown", (e) => {
        mouseButtonIsPressed = true
        if (isAllowedToDraw) {
            handleAddingPoints(e)
        }
        socket.emit("draw positions", gameName, yourPoints)
    })
    document.addEventListener("mouseup", () => {
        mouseButtonIsPressed = false
    })
    document.addEventListener("mousemove", (e) => {
        if (mouseButtonIsPressed && isAllowedToDraw) {
            handleAddingPoints(e)
        }
        socket.emit("draw positions", gameName, yourPoints)

    })

    socket.on("connect", () => {
        if (sentUserData) {
            return
        } else {
            socket.emit("new player", gameName, username)
            sentUserData = true
        }
    })

    socket.on("state", (state) => {
        if (state.gameHasStarted) {
            GameSettingContainer.style.display = "none"
            canvas.style.display = "block"
            PaintSettingContainerElement.style.display = "flex"
            StartGameButton.style.display = "none"
            TimerElement.style.display = "block"
            GameSettingsContainerElement.style.display = "none"
        } else {
            GameSettingContainer.style.display = "flex"
            canvas.style.display = "none"
            PaintSettingContainerElement.style.display = "none"
        }
        // Update Player information
        var nameIndex = []
        var artistIndex = []
        var scoreIndex = []
        var hasGuessedIndex = []
        for (player in state.connectedPlayers) {
            nameIndex.push(state.connectedPlayers[player].name)
            artistIndex.push(state.connectedPlayers[player].isArtist)
            scoreIndex.push(state.connectedPlayers[player].score)
            hasGuessedIndex.push(state.connectedPlayers[player].hasGuessed)
        }
        for (var i = 0; i < ConnectedPlayerStatusElements.length; i++) {
            if (nameIndex[i] != null) {
                ConnectedPlayerStatusElements[i].innerHTML = `${nameIndex[i]} : ${scoreIndex[i]}`
                ConnectedPlayerStatusElements[i].style.display = "block"
                if (artistIndex[i]) {
                    ConnectedPlayerStatusElements[i].style.backgroundColor = "#590E3C"
                } else {
                    if (hasGuessedIndex[i]) {
                        ConnectedPlayerStatusElements[i].style.backgroundColor = "#233D49"
                    } else {
                        ConnectedPlayerStatusElements[i].style.backgroundColor = "#003249"
                    }
                }
            } else {
                ConnectedPlayerStatusElements[i].innerHTML = ""
                ConnectedPlayerStatusElements[i].style.display = "none"
            }
        }

        // Update Canvas
        if (state.connectedPlayers[socket.id] != null) {
            if (state.connectedPlayers[socket.id].isArtist) {
                isAllowedToDraw = true
                WordContainerElement.style.display = "inline-block"
                GuessWordButton.style.display = "none"
                GuessedWordInput.style.display = "none"
            } else {
                isAllowedToDraw = false
                WordContainerElement.style.display = "none"
                yourPoints = state.activePoints
                GuessWordButton.style.display = "inline-block"
                GuessedWordInput.style.display = "inline-block"
            }
        }

        if (!state.gameHasStarted || state.connectedPlayers[socket.id].hasGuessed || state.connectedPlayers[socket.id].isArtist) {
            GuessWordButton.style.display = "none"
            GuessedWordInput.style.display = "none"
        } else {
            GuessWordButton.style.display = "inline-block"
            GuessedWordInput.style.display = "inline-block"

        }

        // update timer
        TimerElement.innerHTML = state.timer.toString()
        if(state.timer <= 10){
            TimerElement.style.color = "red"
            TimerElement.style.fontSize = "3rem"
        }else{
            TimerElement.style.color = "white"
            TimerElement.style.fontSize = "2rem"
        }

        if (state.timer == state.timerLength) {
            yourPoints = {}
            pointCount = 0
        }

        CurrentlySelectedWordsTextElement.innerHTML = state.nameOfWordsToUse.toString()
        // update word
        if (state.connectedPlayers[socket.id].isArtist) {
            WordContainerElement.innerHTML = state.word.toString()
        } else {
            WordContainerElement.innerHTML = ""
        }

        if(isAllowedToDraw){
            PaintSettingContainerElement.style.display = "flex"
            canvas.style.cursor = "url('./public/css/cursors/cursor.cur'), pointer"

        }else{
            PaintSettingContainerElement.style.display = "none"
            canvas.style.cursor = "default"
        }
    })

    socket.on("game begins", () => {
        GameSettingsContainerElement.style.display = "none"
        WinningTextElement.style.display = "none"
        GuessedWordInput.style.display = "inline-block"
        GuessWordButton.style.display = "inline-block"
        canvas.style.display = "block"
        PaintSettingContainerElement.style.display = "flex"

        GameSettingContainer.style.display = "none"


        // Hide Word Type Buttons
        EnglishNormalWordsButton.style.display = "none"
        GermanNormalWordsButton.style.display = "none"
        CurrentlySelectedWordsTextElement.style.display = "none"
    })

    socket.on("guessed correctly", () => {
        GuessedWordInput.style.display = "none"
        GuessWordButton.style.display = "none"
        GuessedWordInput.value = ""
    })

    socket.on("guessed incorrectly", () => {
        GuessedWordInput.value = ""

    })

    socket.on("game ended", (state) => {
        StartGameButton.style.display = "inline-block"
        TimerElement.style.display = "none"
        GuessedWordInput.style.display = "none"
        GuessWordButton.style.display = "none"
        GameSettingsContainerElement.style.display = "flex"
        WinningTextElement.style.display = "inline-block"
        canvas.style.display = "none"
        PaintSettingContainerElement.style.display = "none"
        GameSettingContainer.style.display = "flex"


        // Show Word Type Buttons
        EnglishNormalWordsButton.style.display = "block"
        GermanNormalWordsButton.style.display = "block"
        CurrentlySelectedWordsTextElement.style.display = "block"

        var scoreIndex = []
        var highestScore = 0
        var indexWithHighestScore = 0

        for (player in state.connectedPlayers) {
            const scoreToPush = state.connectedPlayers[player].score
            scoreIndex.push(scoreToPush)
        }

        for (var i = 0; i < scoreIndex.length; i++) {
            if (scoreIndex[i] > highestScore) {
                highestScore = scoreIndex[i]
                indexWithHighestScore = i
            }
        }

        for (player in state.connectedPlayers) {
            if (state.connectedPlayers[player].score == scoreIndex[indexWithHighestScore]) {
                WinningTextElement.innerHTML = state.connectedPlayers[player].name + " wins the game!"
            }
        }

    })

    socket.on("disconnecting", () => {
        socket.emit("player left")
    })

    // Animation
    var range = 30;
    setInterval(() => {
        context.clearRect(0, 0, WIDTH, HEIGHT)

        for (point in yourPoints) {
            if (yourPoints[point] != null) {
                var previousNumb = point - 1
                if (yourPoints[previousNumb] != null) {
                    var distanceX = yourPoints[point].x - yourPoints[previousNumb].x
                    var distanceY = yourPoints[point].y - yourPoints[previousNumb].y
                    if (distanceX >= range || distanceY >= range || distanceY <= -range || distanceY <= -range) {
                    } else {
                        context.beginPath()
                        context.moveTo(yourPoints[previousNumb].x, yourPoints[previousNumb].y)
                        context.lineTo(yourPoints[point].x, yourPoints[point].y)
                        context.lineWidth = yourPoints[point].thickness
                        context.strokeStyle = yourPoints[point].color
                        context.stroke()
                    }
                }
            }
        }

    }, 50);
    function handleAddingPoints(e) {
        var rect = canvas.getBoundingClientRect(),
            scaleX = canvas.width / rect.width,
            scaleY = canvas.height / rect.height;
        drawPosition.x = (e.clientX - rect.left) * scaleX
        drawPosition.y = (e.clientY - rect.top) * scaleY
        drawPosition.color = strokeColor
        drawPosition.thickness = lineThickness
        yourPoints[pointCount] = { x: drawPosition.x, y: drawPosition.y, color: drawPosition.color, thickness: drawPosition.thickness }
        pointCount++
    }
} else {
    socket.on("game created", game => {
        const GameElement = document.createElement("div")
        GameElement.classList.add("GameElement")
        GameElement.innerHTML = game
        const GameLink = document.createElement("a")
        GameLink.href = `/${game}`
        GameLink.classList.add("GameLink")
        GameLink.innerText = "join game"
        GameContainerElement.append(GameElement)
        GameContainerElement.append(GameLink)

    })
}




