import { black, boardSize, white } from './const.js'
import Player from './Player.js'
import Position from './Position.js'
import * as Pieces from './Piece/index.js'
import { Board } from './Board.js'
import { oppositeColor } from './helpers.js'
import Move from './Move.js'
import SpecialMove from './Move/SpecialMove.js'
import { Check, CheckMate, Draw, Stalemate } from './exception.js'

export default class Game
{
    gameOver = false
    turn = null
    board = null
    moveHistory = []

    static start () {
        /** todo
         *  detect draw
         */

        let game = new Game
        game.nextTurn()
        return game
    }

    constructor () {
        this.players = {
            [black]: this.newPlayer(black),
            [white]: this.newPlayer(white),
        }
        this.resetBoard()
    }

    black () {
        return this.players[black]
    }

    white () {
        return this.players[white]
    }

    currentPlayer () {
        return this.players[this.turn]
    }

    otherPlayer () {
        return this.players[oppositeColor(this.turn)]
    }

    newPlayer (color) {
        let player = new Player(color)
        player.setPieces(this.startingPieces(color))
        return player
    }

    startingPieces (color) {
        const [homeRank, pawnRank] = color === white ? [1, 2] : [8, 7]

        let pieces
        pieces = [
            new Pieces.Rook(new Position(homeRank, 1), color),
            new Pieces.Knight(new Position(homeRank, 2), color),
            new Pieces.Bishop(new Position(homeRank, 3), color),
            new Pieces.Queen(new Position(homeRank, 4), color),
            new Pieces.King(new Position(homeRank, 5), color),
            new Pieces.Bishop(new Position(homeRank, 6), color),
            new Pieces.Knight(new Position(homeRank, 7), color),
            new Pieces.Rook(new Position(homeRank, 8), color),
        ]

        for (let i = 1; i <= boardSize; i++) {
            pieces.push(new Pieces.Pawn(new Position(pawnRank, i), color))
        }

        return pieces
    }

    resetBoard () {
        let board = new Board()
        board.addPieces(this.white().getPieces())
        board.addPieces(this.black().getPieces())
        this.board = board
    }

    nextTurn () {
        this.turn = !this.turn || this.turn === white ? black : white
        this.board.clearEnPassant()
        this.calculateMoves()
    }

    capturePiece (piece) {
        this.currentPlayer().addCapturedPiece(piece)
        this.otherPlayer().removePiece(piece)
        this.board.removePiece(piece)
    }

    addPiece (piece) {
        this.players[piece.color].addPiece(piece)
        this.board.addPieces([piece])
    }

    removePiece (piece) {
        this.players[piece.color].removePiece(piece)
        this.board.removePiece(piece)
    }

    calculateMoves () {
        try {
            this.otherPlayer().clearStatus()
            this.currentPlayer().clearStatus()
            this.board.calculateMoves(this.currentPlayer())
        } catch (e) {
            if (e instanceof Check) {
                this.currentPlayer().setChecked()
            } else if (e instanceof CheckMate) {
                this.currentPlayer().setCheckMated()
                this.gameOver = true
            } else if (e instanceof Stalemate) {
                this.currentPlayer().setStalemated()
                this.gameOver = true
            } else if (e instanceof Draw) {
                this.currentPlayer().setDrawn()
                this.gameOver = true
            }
        }
    }

    executeMove (move) {
        if (this.gameOver) {
            throw new Error(`Game is over. Cannot execute more moves`)
        }

        if (move.piece.color !== this.currentPlayer().color) {
            throw new Error(`Cannot move other team's piece!`)
        }

        if (this.board.hasPieceAt(move.to)) {
            this.capturePiece(this.board.at(move.to))
        }

        if (move instanceof SpecialMove) {
            move.execute(this.board, {
                capturePiece: this.capturePiece.bind(this),
                addPiece: this.addPiece.bind(this),
                removePiece: this.removePiece.bind(this),
            })
        } else {
            this.board.executeMove(move)
        }

        this.moveHistory.push(move.toHistory())
        this.nextTurn()
    }

    forceMove (fromRank, fromFile, toRank, toFile) {
        if (this.gameOver) {
            throw new Error(`Game is over. Cannot execute more moves`)
        }

        let piece = this.board.at(fromRank, fromFile)

        if (!piece) {
            return
        }

        let toPiece = this.board.at(toRank, toFile)

        if (toPiece) {
            this.board.removePiece(toPiece)
        }

        this.board.executeMove(new Move(piece, new Position(toRank, toFile)))
        this.calculateMoves()
    }

    // debug stuff
    forceMoves (moves) {
        moves.forEach(move => this.forceMove(...move))
    }

    removePieces (positions) {
        positions.forEach(position => this.board.removePiece(this.board.at(...position)))
    }
}