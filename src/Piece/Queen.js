import Piece from '../Piece.js'
import { QUEEN } from '../const.js'
import MoveSet from '../MoveSet.js'
import { addMoveVectors, addPinVectors, getCardinalVectors, getDiagonalVectors } from '../helpers.js'

export default class Queen extends Piece
{
    type = QUEEN

    getValue () {
        return 9
    }

    getPinningMoves (board) {
        let moves = new MoveSet
        addPinVectors(getCardinalVectors, this, moves, board)
        addPinVectors(getDiagonalVectors, this, moves, board)
        return moves
    }

    getPotentialMoves (board) {
        let moves = new MoveSet
        addMoveVectors(getCardinalVectors, this, moves, board)
        addMoveVectors(getDiagonalVectors, this, moves, board)
        return moves
    }
}