import SpecialMove from './SpecialMove.js'

export default class Advance extends SpecialMove
{
    enPassant = null

    constructor (piece, to, enPassant) {
        super(piece, to)
        this.enPassant = enPassant
    }

    execute (board) {
        board.executeMove(this)
        board.setEnPassantPosition(this.enPassant)
    }
}