import Piece from '../Piece.js'
import { ROOK } from '../const.js'
import { addMoveVectors, addPinVectors, getCardinalVectors } from '../helpers.js'
import MoveSet from '../MoveSet.js'

export default class Rook extends Piece
{
    type = ROOK

    getCharacter () {
        return '\u2656'
    }

    getPinningMoves (board) {
        let moves = new Moveset
        addPinVectors(getCardinalVectors, this, moves, board)
        return moves
    }

    getPotentialMoves (board) {
        let moves = new Moveset
        addMoveVectors(getCardinalVectors, this, moves, board)
        return moves
    }
}