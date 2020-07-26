import { KING } from './const.js'

export default class Player
{
    color = null
    pieces = []
    capturedPieces = []
    king = null

    constructor (color) {
        this.color = color
    }

    setPieces (pieces) {
        this.pieces = pieces
        this.setKing()
    }

    setKing (king = this.getKing()) {
        this.king = king
    }

    getKing () {
        return this.king ?? this.pieces.find(piece => piece.type === KING)
    }

    getPieces () {
        return this.pieces
    }

    addCapturedPiece (piece) {
        this.capturedPieces.push(piece)
    }

    addPiece (piece) {
        this.pieces.push(piece)
    }

    removePiece (piece) {
        let index = this.pieces.indexOf(piece)
        if (index < 0) {
            console.warn(`Attempted to remove piece from player that the player didn't own.`, this, piece)
            return
        }

        this.pieces.splice(index, 1)
    }
}