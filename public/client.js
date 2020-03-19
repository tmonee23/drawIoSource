const socket = io.connect("/")

const GameContainerElement = document.getElementById("gameContainer")
const TimerElement = document.getElementById("timer")

if (TimerElement != null) {
    TimerElement.style.display = "none"
    const canvas = document.getElementById("canvas")
    const context = canvas.getContext("2d")
    var WIDTH = canvas.width
    var HEIGHT = canvas.height

    const username = prompt("What is your name?")
    const ConnectedPlayerStatusElements = document.getElementsByClassName("connectedPlayer-container")
    const WordContainerElement = document.getElementById("wordContainer")

    const GameSettingContainer = document.getElementById("gameSettingContainer")
    const StartGameButton = document.getElementById("startButton")
    const GuessWordButton = document.getElementById("guessButton")
    const GuessedWordInput = document.getElementById("guessedInput")
    const ResetPointsButton = document.getElementById("resetPointsButton")
    const RoundsPerGameInput = document.getElementById("roundsInput")
    const TimePerGameInput = document.getElementById("timeInput")
    const WinningTextElement = document.getElementById("winnerText")
    GuessedWordInput.style.display = "none"
    GuessWordButton.style.display = "none"
    WinningTextElement.style.display = "none"

    const PaintSettingContainerElement = document.getElementById("colorWheel")
    const ColorInputElement = document.getElementById("colorInput")
    const EraseColorButtonElement = document.getElementById("whiteColorButton")
    const ClearAllButtonElement = document.getElementById("clearAllButton")
    const LineThicknessSliderElement = document.getElementById("myRange")
    const LineThicknessTextElement = document.getElementById("myRangeText")
    LineThicknessTextElement.innerHTML = "Thickness: 7"

    const EnglishNormalWordsButton = document.getElementById("englishNormalWordsButton")
    const GermanNormalWordsButton = document.getElementById("germanNormalWordsButton")
    const EnglishSportsWordsButton = document.getElementById("englishSportsWordsButton")
    const GermanSportsWordsButton = document.getElementById("germanSportsWordsButton")
    const ThemeArray = [GermanNormalWordsButton, EnglishNormalWordsButton, EnglishSportsWordsButton, GermanSportsWordsButton]

    var sentUserData = false
    var isAllowedToDraw = false
    var mouseButtonIsPressed = false

    var strokeColor = "blue"
    var lineThickness = 5
    var roundsUserInput = 0
    var timerUserInput = 0
    var hasGuessed = false
    var wordsUserInput = "english normal"

    // New Draw System Variables
    var lastX, lastY
    const containerToPut = document.getElementById("containerToPut")
    containerToPut.style.display = "none"

    StartGameButton.addEventListener("click", () => {
        roundsUserInput = Math.round(RoundsPerGameInput.value)
        timerUserInput = Math.round(TimePerGameInput.value)
        if (roundsUserInput != null && roundsUserInput != 0 && timerUserInput != null && timerUserInput != 0) {
            socket.emit("start game", roundsUserInput, timerUserInput)
            TimerElement.style.display = "block"
            GameSettingContainer.style.display = "none"
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
    ResetPointsButton.addEventListener("click", () => {
        socket.emit("reset points")
    })
    ColorInputElement.addEventListener("input", (evt) => {
        strokeColor = ColorInputElement.value
    })
    LineThicknessSliderElement.addEventListener("input", (evt) => {
        lineThickness = LineThicknessSliderElement.value
        LineThicknessTextElement.innerHTML = "Thickness: " + LineThicknessSliderElement.value.toString()
    })
    EraseColorButtonElement.addEventListener("click", () => {
        strokeColor = "white"
    })
    ClearAllButtonElement.addEventListener("click", () => {
        if(!isAllowedToDraw) return
        
        context.clearRect(0, 0, canvas.width, canvas.height)
    })
    EnglishNormalWordsButton.addEventListener("click", () => {
        wordsUserInput = "english normal"
        socket.emit("changed word theme", wordsUserInput)
    })
    GermanNormalWordsButton.addEventListener("click", () => {
        wordsUserInput = "german normal"
        socket.emit("changed word theme", wordsUserInput)
    })
    EnglishSportsWordsButton.addEventListener("click", () => {
        wordsUserInput = "english sports"
        socket.emit("changed word theme", wordsUserInput)
    })
    GermanSportsWordsButton.addEventListener("click", () => {
        wordsUserInput = "german sports"
        socket.emit("changed word theme", wordsUserInput)
    })

    // New Draw System Attempt

    canvas.onmousedown = function (e) {
        if(!isAllowedToDraw) return
        var rect = canvas.getBoundingClientRect(),
            scaleX = canvas.width / rect.width,
            scaleY = canvas.height / rect.height;
        mouseButtonIsPressed = true;
        Draw((e.pageX - rect.left) * scaleX, (e.pageY - rect.top) * scaleY);
    };

    canvas.onmousemove = function (e) {
        if(!isAllowedToDraw) return

        var rect = canvas.getBoundingClientRect(),
            scaleX = canvas.width / rect.width,
            scaleY = canvas.height / rect.height;
        Draw((e.pageX - rect.left) * scaleX, (e.pageY - rect.top) * scaleY);
    };

    function Draw(x, y) {
        if (mouseButtonIsPressed) {
            context.beginPath()
            context.strokeStyle = strokeColor
            context.lineWidth = lineThickness
            context.lineCap = "round"
            context.moveTo(lastX, lastY)
            context.lineTo(x, y)

            context.stroke()
        }
        lastX = x; lastY = y
    }

    canvas.onmouseup = function (e) {
        if(!isAllowedToDraw) return

        mouseButtonIsPressed = false;
    };
    canvas.onmouseleave = function (e) {
        if(!isAllowedToDraw) return
        mouseButtonIsPressed = false;
    };

    socket.on("connect", () => {
        if (sentUserData) {
            return
        } else {
            socket.emit("new player", gameName, username)
            sentUserData = true
        }
    })

    setInterval(() => {
        if(!isAllowedToDraw) return
        socket.emit("updated drawing", canvas.toDataURL('image/png'))
    }, 1000)

    socket.on("updated image", (image) => {
        if(isAllowedToDraw) return
        var img = new Image()
        img.src = image
        img.onload = start
        function start(){
            while(containerToPut.hasChildNodes()){
                containerToPut.removeChild(containerToPut.lastChild)
            }
            if(containerToPut.childNodes[0] == null){
                containerToPut.appendChild(img)
            }
        }
    })

    socket.on("state", (state) => {
        if (state.gameHasStarted) {
            GameSettingContainer.style.display = "none"
            PaintSettingContainerElement.style.display = "flex"
            StartGameButton.style.display = "none"
            ResetPointsButton.style.display = "none"
            TimerElement.style.display = "block"
            if(isAllowedToDraw){
                canvas.style.display = "block"
                containerToPut.style.display = "none"
            }else{
                canvas.style.display = "none"
                containerToPut.style.display = "flex"
            }
        } else {
            GameSettingContainer.style.display = "flex"
            canvas.style.display = "none"
            PaintSettingContainerElement.style.display = "none"
            ResetPointsButton.style.display = "block"
            containerToPut.style.display = "none"

            for(var i = 0; i<ThemeArray.length;i++){
                if(ThemeArray[i].innerHTML == state.nameOfWordsToUse.toString()){
                    ThemeArray[i].style.backgroundColor = "rgba(0,0,0,0.2)"
                    ThemeArray[i].style.border = "2px solid #003249"
                    ThemeArray[i].style.color = "#003249"
                }else{
                    ThemeArray[i].style.backgroundColor = "rgba(0,0,0,0)"
                    ThemeArray[i].style.border = "1px solid white"
                    ThemeArray[i].style.color = "white"
                }
            }
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
        // Filling Out connected player elements
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
        if (state.connectedPlayers[socket.id] != null) {
            if (state.connectedPlayers[socket.id].isArtist) {
                isAllowedToDraw = true
                WordContainerElement.style.display = "inline-block"
                GuessWordButton.style.display = "none"
                GuessedWordInput.style.display = "none"
            } else {
                isAllowedToDraw = false
                WordContainerElement.style.display = "none"
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
            context.clearRect(0,0,canvas.width,canvas.height)

        }
        // update word
        if (state.connectedPlayers[socket.id].isArtist) {
            WordContainerElement.innerHTML = state.word.toString()
        } else {
            WordContainerElement.innerHTML = ""
        }
        //update cursor and canvas display
        if(isAllowedToDraw){
            PaintSettingContainerElement.style.display = "flex"
            canvas.style.cursor = "url('./public/css/cursors/cursor.cur'), pointer"
        }else{
            PaintSettingContainerElement.style.display = "none"
            canvas.style.cursor = "default"
        }
    })

    socket.on("game begins", () => {
        GameSettingContainer.style.display = "none"
        WinningTextElement.style.display = "none"
        GuessedWordInput.style.display = "inline-block"
        GuessWordButton.style.display = "inline-block"
        canvas.style.display = "block"
        PaintSettingContainerElement.style.display = "flex"
        ResetPointsButton.style.display = "none"
        // Hide Word Type Buttons
        EnglishNormalWordsButton.style.display = "none"
        GermanNormalWordsButton.style.display = "none"

        if(isAllowedToDraw){
            canvas.style.display = "block"
            containerToPut.style.display = "none"
        }else{
            canvas.style.display = "none"
            containerToPut.style.display = "flex"
        }
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
        canvas.style.display = "none"
        PaintSettingContainerElement.style.display = "none"
        WinningTextElement.style.display = "inline-block"
        GameSettingContainer.style.display = "flex"
        EnglishNormalWordsButton.style.display = "block"
        GermanNormalWordsButton.style.display = "block"
        ResetPointsButton.style.display = "block"
        containerToPut.style.display = "none"
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
} else {
    socket.on("game created", game => {
        const GameElement = document.createElement("div")
        GameElement.classList.add("singleGameContainer")
        const GameLink = document.createElement("a")
        GameLink.href = `/${game}`
        GameLink.classList.add("GameLink")
        GameLink.innerText = game
        GameLink.style.width = "100%"
        GameContainerElement.append(GameElement)
        GameContainerElement.append(GameLink)
    })
}