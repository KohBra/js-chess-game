import { boardSize } from './const.js'
import Position from './Position.js'

export default class MoveSet
{
    moves = []
    vectors = []

    add (move) {
        this.moves.push(move)
    }

    addMoves (moves) {
        moves.forEach(move => this.add(move))
    }

    hasMove (move) {
        return this.getMovesToPosition(move.to)
            .filter(m => m.piece === move.piece).length > 0
    }

    addVector (vector) {
        this.vectors.push(vector)
        this.addMoves(vector.moves)
    }

    getVectorForMove (move) {
        return this.vectors.find(vector => vector.moves.indexOf(move) >= 0)
    }

    hasMoveToPosition (position) {
        return this.getMovesToPosition(position).length > 0
    }

    getMovesToPosition (position) {
        return this.moves.filter(move => move.to.equals(position))
    }

    combine (moveSet) {
        this.moves = this.moves.concat(moveSet.moves)
        this.vectors = this.vectors.concat(moveSet.vectors)
    }

    filter (filterFunction) {
        this.moves = this.moves.filter(filterFunction)
        return this
    }

    map (mapFunction) {
        this.moves = this.moves.map(mapFunction)
        return this
    }

    get length () {
        return this.moves.length
    }

    show () {
        console.log('%c   A    B    C    D    E    F    G    H', 'font-size:12px')
        for (let rank = 1; rank <= boardSize; rank++) {
            let row = `${rank}  `
            let colors = []
            for (let file = 1; file <= 8; file++) {
                let moves = this.getMovesToPosition(new Position(rank, file))
                if (moves.length === 0) {
                    row += `%c-  `
                    colors.push('grey')
                    continue
                }

                // let hasAttack = moves.reduce((hasAttack, move) => hasAttack || (hasAttack = move.isAttack), false)
                let hasAttack = false
                row += `%c${hasAttack ? 'X' : 'M'}  `
                colors.push(hasAttack ? 'red' : 'white')
            }

            console.log(row, ...colors.map(color => `color:${color};font-size:20px`))
        }
    }
}