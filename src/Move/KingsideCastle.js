import SpecialMove from './SpecialMove.js'
import Move from '../Move.js'
import Position from '../Position.js'

export default class KingsideCastle extends SpecialMove
{
    execute (board) {
        board.executeMove(this)
        board.executeMove(new Move(board.at(this.to.rank, 8), new Position(this.to.rank, 6)))
    }
}