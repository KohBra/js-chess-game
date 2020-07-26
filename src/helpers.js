import { black, boardSize, KING, white } from './const.js'
import Position from './Position.js'
import Move from './Move.js'
import Vector from './Vector.js'

export const clamp = function (num, min, max) {
    return Math.min(Math.max(min, num), max)
}

export const implement = error => {
    throw new Error(error)
}

export const oppositeColor = color => color === white ? black : white

export const getCardinalVectors = (position, add) => {
    let vectors = {
        l: [],
        r: [],
        u: [],
        d: [],
    }
    // Left
    for (let file = position.file - 1; file > 0; file--) {
        vectors.l.push(new Position(position.rank, file))
    }
    // Right
    for (let file = position.file + 1; file <= boardSize; file++) {
        vectors.r.push(new Position(position.rank, file))
    }
    // Down
    for (let rank = position.rank + 1; rank <= boardSize; rank++) {
        vectors.d.push(new Position(rank, position.file))
    }
    // Up
    for (let rank = position.rank - 1; rank > 0; rank--) {
        vectors.u.push(new Position(rank, position.file))
    }

    Object.keys(vectors).forEach(vector => {
        add(vectors[vector], vector)
    })
}

export const getDiagonalVectors = (position, add) => {
    let vectors = {
        tl: {
            positions: [],
            length: Math.min(position.rank, position.file),
            type: false,
            result: i => new Position(position.rank - i, position.file - i)
        },
        tr: {
            positions: [],
            length: Math.min(position.rank, boardSize - position.file),
            type: !(Math.min(position.rank, boardSize - position.file) === position.rank),
            result: i => new Position(position.rank - i, position.file + i)
        },
        br: {
            positions: [],
            length: Math.min(boardSize - position.rank, boardSize - position.file),
            type: true,
            result: i => new Position(position.rank + i, position.file + i)
        },
        bl: {
            positions: [],
            length: Math.min(boardSize - position.rank, position.file),
            type: !(Math.min(boardSize - position.rank, position.file) === position.file),
            result: i => new Position(position.rank + i, position.file - i)
        },
    }

    Object.keys(vectors).forEach(vector => {
        if (vectors[vector].type) {
            for (let i = 1; i <= vectors[vector].length; i++) {
                vectors[vector].positions.push(vectors[vector].result(i))
            }
        } else {
            for (let i = 1; i < vectors[vector].length; i++) {
                vectors[vector].positions.push(vectors[vector].result(i))
            }
        }

        add(vectors[vector].positions, vector)
    })
}

export const addPinVectors = (directionMethod, piece, moveSet, board) => {
    directionMethod(piece.position, (positions, vector) => {
        let collisions = 0
        let validVectorPositions = []
        let isValid = false
        for (let position of positions) {
            let pieceAt = board.at(position)
            if (pieceAt) {
                collisions += 1
                if (piece.color !== pieceAt.color) {
                    validVectorPositions.push(position)
                    if (collisions > 1) {
                        // If the last piece to collide with is a king, then its a valid absolute pin
                        if (pieceAt.type === KING) {
                            isValid = true
                        }
                        break
                    }
                } else {
                    // If we are colliding with a teammate, then it is a valid protection
                    validVectorPositions.push(position)
                    isValid = true
                    break
                }
            } else {
                validVectorPositions.push(position)
            }
        }

        if (isValid) {
            // The vector is a valid pin, save it
            moveSet.addVector(new Vector(validVectorPositions.map(position => new Move(piece, position)), vector))
        }
    })
}

export const addMoveVectors = (directionMethod, piece, moveSet, board) => {
    directionMethod(piece.position, (positions, vector) => {
        let validVectorPositions = []
        for (let position of positions) {
            let pieceAt = board.at(position)
            if (pieceAt) {
                if (piece.color !== pieceAt.color) {
                    validVectorPositions.push(position)
                }
                break
            } else {
                validVectorPositions.push(position)
            }
        }

        if (validVectorPositions.length > 0) {
            // The vector is a valid pin, save it
            moveSet.addVector(new Vector(validVectorPositions.map(position => new Move(piece, position)), vector))
        }
    })
}