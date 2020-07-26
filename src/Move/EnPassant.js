import SpecialMove from './SpecialMove.js'

export default class EnPassant extends SpecialMove
{
    enemyPosition = null

    constructor (piece, to, enemyPosition) {
        super(piece, to)
        this.enemyPosition = enemyPosition
    }

    execute (board, { capturePiece }) {
        board.executeMove(this)
        capturePiece(board.at(this.enemyPosition))
    }
}