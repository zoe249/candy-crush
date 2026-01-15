/**
 * 基础类
 */
class MatchGame {
  /**
   * 棋盘数据
   */
  private chessBoard = []

  constructor(chessBoard: number[][]) {
    this.chessBoard = chessBoard
  }

  /**
   * 交换两个下标内容
   * @param {[number,number]} a
   * @param {[number,number]} b
   */
  swapPiece([row1, col1], [row2, col2]) {
    console.log('交换前')
    console.table(this.chessBoard)
    const temp = this.chessBoard[row1][col1]
    this.chessBoard[row1][col1] = this.chessBoard[row2][col2]
    this.chessBoard[row2][col2] = temp
    console.log('交换后')
    console.table(this.chessBoard)
    this.checkAndRemoveMatchesAt([
      [row1, col1],
      [row2, col2]
    ])
  }

  /**
   * 检查消除
   * @param {[number,number][]} pos  // 检查坐标
   */
  checkAndRemoveMatchesAt(pos: number[][]) {
    let matches = []
    for (let [row, col] of pos) {
      // 横向匹配
      let rows = this.checkMatch(row, col, true)
      // 纵向匹配
      let cols = this.checkMatch(row, col, false)
      matches = matches.concat(cols, rows)
    }

    if (matches.length === 0) return

    // 消除
    for (let [row, col] of matches) {
      this.chessBoard[row][col] = null
    }

    const movedPos = [...this.movePiecesDown(), ...this.refillAndCheck()]
    console.log('消除后')
    console.table(this.chessBoard)
    if (movedPos.length > 0) {
      this.checkAndRemoveMatchesAt(movedPos)
    }

    // console.log('消除后')
    // console.table(this.chessBoard)
    // this.movePiecesDown()
    // console.log('移动后')
    // console.table(this.chessBoard)
    // this.refillAndCheck()
    // console.log('重新填充后')
    // console.table(this.chessBoard)
  }

  /**
   * 检查匹配
   * @param {number} row  // 行
   * @param {number} col  // 列
   * @param {boolean} horizontal  // 是否横向匹配
   * @returns {[number,number][]}  // 匹配坐标
   */
  checkMatch(row, col, horizontal) {
    const matchs = [[row, col]]
    const current = this.chessBoard[row][col]
    let i = 1
    if (horizontal) {
      while (col - 1 >= 0 && this.chessBoard[row][col - 1] === current) {
        matchs.push([row, col - 1])
        col++
      }
      i = 1
      while (
        col + i < this.chessBoard[row].length &&
        this.chessBoard[row][col + i] === current
      ) {
        matchs.push([row, col + i])
        i++
      }
    } else {
      while (row - i >= 0 && this.chessBoard[row - 1][col] === current) {
        matchs.push([row - 1, col])
        i++
      }
      i = 1
      while (
        row + i < this.chessBoard.length &&
        this.chessBoard[row + i][col] === current
      ) {
        matchs.push([row + i, col])
        i++
      }
    }
    return matchs.length >= 3 ? matchs : []
  }

  /**
   * 向下移动棋子
   */
  movePiecesDown() {
    const movedPos = []
    for (let col = this.chessBoard[0].length - 1; col >= 0; col--) {
      let nullCount = 0
      for (let row = this.chessBoard.length - 1; row >= 0; row--) {
        const piece = this.chessBoard[row][col]
        if (piece === null) {
          nullCount++
        } else if (nullCount > 0) {
          this.chessBoard[row + nullCount][col] = this.chessBoard[row][col]
          this.chessBoard[row][col] = null
          movedPos.push([row + nullCount, col])
        }
      }
    }
    console.log('移动后')
    console.table(this.chessBoard)
    return movedPos
  }

  /**
   * 重新填充和检查棋子
   */
  refillAndCheck() {
    const movedPos = []
    for (let row = this.chessBoard.length - 1; row >= 0; row--) {
      for (let col = 0; col < this.chessBoard[row].length; col++) {
        if (this.chessBoard[row][col] === null) {
          this.chessBoard[row][col] = this.getRandomPiece()
          movedPos.push([row, col])
        }
      }
    }
    console.log('重新填充后')
    console.table(this.chessBoard)
    return movedPos
  }

  /**
   * 随机获取棋子
   */
  getRandomPiece() {
    return Math.floor(Math.random() * 5) + 1
  }
}

/**
 * 实现消消乐消除算法
 * 初始化一个二维数组，每个数字代表一个类型，当进行位置交换后，以位置交换为中心，消除三个及以上相连且相同的数字类型。
 */

/**
 * 第一次外循序
 *  第一次内循序
 *  row = 3; nullCount = 0; col = 2
 *  第二次内循序
 *  row = 2; nullCount = 1; col = 2
 *  this.chessBoard[row + nullCount][col] === null;
 *  this.chessBoard[row][col] === null
 *  第三次内循序
 *  row = 1; nullCount = 2; col = 2
 *  this.chessBoard[row + nullCount][col] === null;
 *  this.chessBoard[row][col] === null
 *  第四次内循序
 *  row = 0; nullCount = 3; col = 2
 */
const matchGame = new MatchGame([
  [1, 2, 3, 4],
  [2, 4, 2, 4],
  [2, 4, 3, 2],
  [1, 2, 2, 3]
])

// // 交换 [行，列]
// matchGame.swapPiece([0, 1], [1, 1])
matchGame.swapPiece([2, 2], [2, 3])
