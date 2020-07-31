import Piece from '../Piece.js'
import { ROOK } from '../const.js'
import { addMoveVectors, addPinVectors, getCardinalVectors } from '../helpers.js'
import MoveSet from '../MoveSet.js'

export default class Rook extends Piece
{
    type = ROOK

    getValue () {
        return 5
    }

    getPinningMoves (board) {
        let moves = new MoveSet
        addPinVectors(getCardinalVectors, this, moves, board)
        return moves
    }

    getPotentialMoves (board) {
        let moves = new MoveSet
        addMoveVectors(getCardinalVectors, this, moves, board)
        return moves
    }
}