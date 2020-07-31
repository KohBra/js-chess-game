import {
    BISHOP,
    black,
    boardSize,
    CHECKED,
    CHECKMATED, DRAW,
    KING,
    KNIGHT,
    PAWN,
    QUEEN,
    ROOK,
    STALEMATED
} from './src/const.js'
import Position from './src/Position.js'
import Game from './src/Game.js'

export default class ConsoleGui
{
    static start (game) {
        let self = new ConsoleGui(game)
        self.displayState()
        return self
    }

    constructor () {
        this.newGame()
    }

    newGame () {
        this.game = Game.start()
    }

    notationMove (from, to) {
        let [fromRank, fromFile] = [...from]
        let [toRank, toFile] = [...to]
        this.move(fromRank, this.characterToFile(fromFile), toRank, this.characterToFile(toFile))
    }

    move (fromRank, fromFile, toRank, toFile) {
        let piece = this.game.board.at(fromRank, fromFile)
        if (piece.color !== this.game.turn) {
            throw new Error('Cannot move other teams piece')
        }

        let moves = piece.getAvailableMoves().getMovesToPosition(new Position(toRank, toFile))
        if (moves.length === 0) {
            throw new Error('Specified move does not exist in this position')
        }

        if (moves.length > 0) {
            console.warn('Multiple moves available to the same location? How?')
        }

        try {
            this.game.executeMove(moves[0])
        } catch (e) {
            console.error(e)
        }

        this.displayState()
    }

    getMovesFrom (rank, file) {
        let piece = this.game.board.at(rank, file)
        if (piece.color !== this.game.turn) {
            throw new Error('Cannot move other teams piece')
        }

        this.displayMoveSet(piece.getAvailableMoves())
    }

    getMoves () {
        this.displayMoveSet(this.game.board.currentMoves[this.game.turn])
    }

    getMoveHistory () {
        return this.game.moveHistory
    }

    displayState () {
        this.displayBoard()
        let message = `${this.game.turn}'s turn`
        switch (this.game.currentPlayer().status) {
            case CHECKED:
                message += ', in check!'
                break
            case CHECKMATED:
                message = `${this.game.turn} checkmated! GG`
                break
            case STALEMATED:
                message = `${this.game.turn} stalemated! GG`
                break
            case DRAW:
                message = `${this.game.turn} drew the game! GG`
                break
            case null:
        }
        console.log(message)
    }

    displayBoard (board = this.game.board) {
        console.log('%c   A    B    C    D    E    F    G    H', 'font-size:12px')
        for (let rank = 1; rank < board.board.length; rank++) {
            let row = `${rank}  `
            let colors = []
            for (let file = 1; file < board.board[rank].length; file++) {
                let piece = board.at(rank, file)
                row += `%c${piece ? this.getCharacter(piece) : '- '} `
                colors.push(piece ? this.getDisplayColor(piece.color) : 'grey')
            }

            console.log(row, ...colors.map(color => `color:${color};font-size:20px`))
        }
    }

    displayMoveSet (moveSet) {
        console.log('%c   A    B    C    D    E    F    G    H', 'font-size:12px')
        for (let rank = 1; rank <= boardSize; rank++) {
            let row = `${rank}  `
            let colors = []
            for (let file = 1; file <= 8; file++) {
                let moves = moveSet.getMovesToPosition(new Position(rank, file))
                if (moves.length === 0) {
                    row += `%c-  `
                    colors.push('grey')
                    continue
                }

                row += `%cX  `
                colors.push('white')
            }

            console.log(row, ...colors.map(color => `color:${color};font-size:20px`))
        }
        console.log(`${moveSet.moves.length} available moves`)
    }

    characterToFile (character) {
        return character.charCodeAt(0) - 96
    }

    getCharacter (piece) {
        switch (piece.type) {
            case KING:
                return '\u2654'
            case QUEEN:
                return '\u2655'
            case ROOK:
                return '\u2656'
            case BISHOP:
                return '\u2657'
            case KNIGHT:
                return '\u2658'
            case PAWN:
                return '\u2659'
        }
    }

    getDisplayColor (color) {
        return color === black ? 'red' : 'white'
    }
}