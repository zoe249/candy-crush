import {
  _decorator,
  Component,
  Node,
  Prefab,
  instantiate,
  EventTouch,
  input,
  Input,
  Vec2,
  Vec3,
  UITransform,
  v2,
  v3,
  tween,
  AudioSource,
  Animation
} from 'cc'
import { Piece, PieceState } from './Piece'

const { ccclass, property } = _decorator

@ccclass('ContentControl')
export class ContentControl extends Component {
  @property({ type: [Prefab], tooltip: '棋子预设' })
  public chessPieces: Prefab[] = []

  @property({ type: Number, tooltip: '棋盘宽度' })
  public boardWidth: number = 6

  @property({ type: Number, tooltip: '棋盘高度' })
  public boardHeight: number = 6

  @property({ type: Number, tooltip: '棋子间距' })
  public spacing: number = 96

  @property({ type: Number, tooltip: '棋子初始X坐标' })
  public x: number = -240

  @property({ type: Number, tooltip: '棋子初始Y坐标' })
  public y: number = 240

  @property({ type: Prefab })
  public bom: Prefab // 爆炸资源
  @property({ type: Prefab })
  public clickLight: Prefab // 点击灯光资源

  @property({ tooltip: '棋盘节点' })
  public chessBoard: Node[][] = []

  swapBeforeIndex: number[] = null // 交换之前的位置
  swapAfterIndex: number[] = null // 交换之后的位置

  @property({ type: Vec2, tooltip: '开始触摸位置' })
  private startTouchPos: Vec2 = null

  isSwap: boolean = false // 是否正在交换

  @property({ tooltip: '交换音效' })
  audio: { [key: string]: AudioSource } = {}

  @property({ type: Prefab })
  public effect: Prefab // 匹配灯资源

  @property({ type: Prefab, tooltip: '爆炸行或列资源' })
  public bombLineOrCol: Prefab

  onLoad() {
    const audio = {}
    this.node.getComponents(AudioSource).forEach(item => {
      audio[item.clip.name] = item
    })
    this.audio = audio
  }

  start() {
    this.generateBoard()
    this.onMove()
  }

  update(deltaTime: number) {}

  generateBoard() {
    this.chessBoard = Array.from({ length: this.boardHeight }, () =>
      Array.from({ length: this.boardWidth }, () => null)
    )

    for (let i = 0; i < this.boardHeight; i++) {
      for (let j = 0; j < this.boardWidth; j++) {
        this.chessBoard[i][j] = this.generatePiece(i, j)
      }
    }
    this.setRandomPieceState()
  }

  /**
   * 随机设置棋子状态
   * 挑选随机棋子为消除整列或消除整行
   */
  setRandomPieceState() {
    const count = 4
    let i = 0
    while (i < count) {
      const randomRow = Math.floor(Math.random() * this.boardHeight)
      const randomCol = Math.floor(Math.random() * this.boardWidth)
      const randomPiece =
        this.chessBoard[randomRow][randomCol].getComponent(Piece)
      randomPiece.pieceState =
        Math.random() <= 0.5
          ? PieceState.LINE
          : Math.random() <= 0.5
          ? PieceState.COLUMN
          : PieceState.WRAP
      randomPiece.loadPiece()
      i++
    }
  }

  generatePiece(i: number, j: number) {
    const piece = this.getRandomChessPiece()
    const [x, y] = this.getPiecePosition(i, j)
    piece.setPosition(x, y)
    this.node.addChild(piece)
    return piece
  }

  getPiecePosition(i: number, j: number): number[] {
    return [this.x + j * this.spacing, this.y - i * this.spacing]
  }

  getRandomChessPiece() {
    const randomIndex = Math.floor(Math.random() * this.chessPieces.length)
    const randomChessPiece = this.chessPieces[randomIndex]
    const piece = instantiate(randomChessPiece)
    return piece
  }

  onMove() {
    input.on(Input.EventType.TOUCH_START, this.onBoardTouchStart, this)
    input.on(Input.EventType.TOUCH_MOVE, this.onBoardTouchMove, this)
  }

  /**
   * 触摸开始回调
   * @param event 触摸事件
   */
  onBoardTouchStart(event: EventTouch) {
    this.audio['drop']?.play()
    this.startTouchPos = event.getUILocation()
    this.swapBeforeIndex = this.getPieceAtPosition(this.startTouchPos)
    if (!this.swapBeforeIndex) return
    const [row, col] = this.swapBeforeIndex
    this.setClickLight(row, col)

    // 技能棋子
    const piece = this.chessBoard[row][col].getComponent(Piece)
    if (piece) {
      // this.playEffect(row, col)
    }
  }

  /**
   * 触摸回调
   */
  onBoardTouchMove(event: EventTouch) {
    if (this.isSwap || !this.swapBeforeIndex) return
    const target = this.getSwappingPieces(event)
    const [row, col] = this.swapBeforeIndex
    if (!target) return
    this.swapPiece([row, col], target, async (isSame: boolean) => {
      if (isSame) {
        this.swapPiece([row, col], target)
      } else {
        const isMatch = await this.checkAndRemoveMatchesAt([[row, col], target])
        if (!isMatch) this.swapPiece([row, col], target)
      }
    })
    this.swapBeforeIndex = null
  }

  /**
   * 交换棋子
   * @param param0 交换棋子1位置
   * @param param1 交换棋子2位置
   * @param cb 交换回调
   */
  swapPiece(
    [row1, col1]: number[],
    [row2, col2]: number[],
    cb?: (isSame: boolean) => void
  ) {
    this.isSwap = true
    const temp = this.chessBoard[row1][col1]
    this.chessBoard[row1][col1] = this.chessBoard[row2][col2]
    this.chessBoard[row2][col2] = temp
    this.swapAnimation(
      this.chessBoard[row1][col1],
      this.chessBoard[row2][col2],
      () => {
        this.isSwap = false
        if (
          this.chessBoard[row1][col1].name === this.chessBoard[row2][col2].name
        ) {
          cb?.(true)
        } else {
          cb?.(false)
        }
      }
    )
  }

  /**
   * 交换动画
   * @param a 交换棋子1
   * @param b 交换棋子2
   * @param cb 交换回调
   */
  swapAnimation(a: Node, b: Node, cb: () => void) {
    if (!a || !b) return
    const speed = 0.2
    const aPos = new Vec3(a.position.x, a.position.y)
    const bPos = new Vec3(b.position.x, b.position.y)

    const swapAPromise = new Promise(resolve => {
      tween(a)
        .to(speed, { position: bPos })
        .call(() => {
          resolve(true)
        })
        .start()
    })

    const swapBPromise = new Promise(resolve => {
      tween(b)
        .to(speed, { position: aPos })
        .call(() => {
          resolve(true)
        })
        .start()
    })

    // @ts-ignore
    Promise.allSettled([swapAPromise, swapBPromise]).then(() => {
      cb()
    })
  }

  /**
   * 检查棋子状态
   * @param matches 匹配位置
   * @returns 特殊消除位置
   */
  checkPieceState(matches: number[][]): false | number[][] {
    const specialMatches = []
    matches.forEach(([row, col]) => {
      const piece = this.chessBoard[row][col].getComponent(Piece)
      if (piece.pieceState !== PieceState.CLICK) {
        specialMatches.push([row, col])
      }
    })
    return specialMatches.length > 0 ? specialMatches : false
  }

  /**
   * 检测特殊消除
   * 1. 消除整行整列
   * 2. 消除相同棋子
   */
  checkSpecialMatches(matches: number[][], specialMatches: number[][]) {
    // 判断匹配到的棋子中，除去特殊棋子后的数量是否大于等于3
    // 如果是，返回这些除去特殊棋子后的位置
    const filteredMatches = matches.filter(([row, col]) => {
      return !specialMatches.some(([specialRow, specialCol]) => {
        const specialPiece =
          this.chessBoard[specialRow][specialCol].getComponent(Piece)
        const piece = this.chessBoard[row][col].getComponent(Piece)
        return specialPiece.name === piece.name
      })
    })
    return filteredMatches.length >= 3 ? filteredMatches : false
  }

  /**
   * 整行或者整列消除
   * @param specialMatches
   */
  removeSpecialMatches(specialMatches: number[][]) {
    const removeLine = row => {
      for (let col = 0; col < this.boardWidth; col++) {
        this.node.removeChild(this.chessBoard[row][col])
        this.chessBoard[row][col] = null
      }
    }
    const removeColumn = col => {
      for (let row = 0; row < this.boardHeight; row++) {
        this.node.removeChild(this.chessBoard[row][col])
        // this.playBom(row, col)
        this.chessBoard[row][col] = null
      }
    }
    // 消除特殊棋子，并使用技能消除整行或整列
    for (let [row, col] of specialMatches) {
      const piece = this.chessBoard[row][col]?.getComponent(Piece)
      if (piece?.pieceState !== PieceState.CLICK) {
        if (piece?.pieceState === PieceState.LINE) {
          // 消除整行
          this.audio['swap_lineline']?.play()
          removeLine(row)
          this.playBombLineOrCol(row, col, 'line')
        } else if (piece?.pieceState === PieceState.COLUMN) {
          // 消除整列
          this.audio['swap_wrapline']?.play()
          removeColumn(col)
          this.playBombLineOrCol(row, col, 'col')
        } else if (piece?.pieceState === PieceState.WRAP) {
          // 消除整行整列
          this.audio['swap_wrapwrap']?.play()
          removeLine(row)
          removeColumn(col)
          this.playBombLineOrCol(row, col, 'col')
          this.playBombLineOrCol(row, col, 'line')
        }
      }
    }
  }

  /**
   * 检测消除
   */
  async checkAndRemoveMatchesAt(pos: number[][]): Promise<boolean> {
    let matches = []
    for (let [row, col] of pos) {
      // 横向匹配
      let cols = this.checkMatch(row, col, true)
      // 纵向匹配
      let rows = this.checkMatch(row, col, false)
      matches = matches.concat(cols, rows)
    }
    if (matches.length === 0) return

    const audioNum = matches.length > 6 ? 6 : matches.length
    this.audio[`eliminate${audioNum}`]?.play()

    const specialMatches = this.checkPieceState(matches)
    // 消除
    if (!specialMatches) {
      for (let [row, col] of matches) {
        this.node.removeChild(this.chessBoard[row][col])
        this.playBom(row, col)
        this.chessBoard[row][col] = null
      }
    } else {
      const _matches = this.checkSpecialMatches(matches, specialMatches)
      if (_matches) {
        for (let [row, col] of _matches) {
          this.node.removeChild(this.chessBoard[row][col])
          this.playBom(row, col)
          this.chessBoard[row][col] = null
        }
      }
      // 使用技能消除整行或整列
      this.removeSpecialMatches(specialMatches)
    }

    const movedPos = []
    Promise.all([this.movePiecesDown(), this.refillAndCheck()]).then(result => {
      movedPos.push(...result[0], ...result[1])
      this.checkAndRemoveMatchesAt(movedPos)
    })
    return true
  }

  /**
   * 向下移动棋子
   */
  movePiecesDown() {
    const movedPos = []
    const animationPromises: Promise<void>[] = []
    for (let col = this.chessBoard[0].length - 1; col >= 0; col--) {
      let nullCount = 0
      for (let row = this.chessBoard.length - 1; row >= 0; row--) {
        const piece = this.chessBoard[row][col]
        if (piece === null) {
          nullCount++
        } else if (nullCount > 0) {
          const animationPromise = this.downAnimation(
            this.chessBoard[row][col],
            this.getPiecePosition(row + nullCount, col)
          )
          animationPromises.push(animationPromise)
          this.chessBoard[row + nullCount][col] = this.chessBoard[row][col]
          this.chessBoard[row][col] = null
          movedPos.push([row + nullCount, col])
        }
      }
    }
    return Promise.all(animationPromises).then(() => movedPos)
  }

  /**
   * 向下移动棋子动画
   * @param param0 移动棋子
   * @param param1 目标位置
   */
  downAnimation(node: Node, [x, y]: number[], cb?: () => void) {
    return new Promise<void>(resolve => {
      const speed = 0.5
      tween(node)
        .to(speed, { position: v3(x, y) })
        .call(() => {
          resolve()
        })
        .start()
    })
  }

  /**
   * 重新填充和检查棋子
   * @param nullCount 需要填充的空位数量
   * @returns Promise<number[][]> 返回移动过的棋子位置数组
   */
  refillAndCheck() {
    const movedPos = []
    const animationPromises: Promise<void>[] = []

    for (let row = this.chessBoard.length - 1; row >= 0; row--) {
      for (let col = 0; col < this.chessBoard[row].length; col++) {
        if (this.chessBoard[row][col] === null) {
          this.chessBoard[row][col] = this.generatePiece(-(row + 1), col)
          movedPos.push([row, col])

          // 收集动画 Promise
          const animationPromise = this.downAnimation(
            this.chessBoard[row][col],
            this.getPiecePosition(row, col)
          )
          animationPromises.push(animationPromise)
        }
      }
    }

    // 等待所有动画完成
    return Promise.all(animationPromises).then(() => movedPos)
  }

  /**
   * 随机获取棋子
   */
  getRandomPiece() {
    return Math.floor(Math.random() * 5) + 1
  }

  /**
   * 检查匹配
   * @param {number} row  // 行
   * @param {number} col  // 列
   * @param {boolean} horizontal  // 是否横向匹配
   * @returns {[number,number][]}  // 匹配坐标
   */
  checkMatch(row, col, horizontal) {
    const matches = [[row, col]]
    const current = this.chessBoard[row][col].name
    let i = 1
    if (horizontal) {
      // 往左遍历
      while (col - i >= 0 && this.chessBoard[row][col - i].name === current) {
        matches.push([row, col - i])
        i++
      }
      i = 1
      // 往右遍历
      while (
        col + i < this.chessBoard[row].length &&
        this.chessBoard[row][col + i].name === current
      ) {
        matches.push([row, col + i])
        i++
      }
    } else {
      // 往上遍历
      while (row - i >= 0 && this.chessBoard[row - i][col].name === current) {
        matches.push([row - i, col])
        i++
      }
      i = 1
      // 往下遍历
      while (
        row + i < this.chessBoard.length &&
        this.chessBoard[row + i][col].name === current
      ) {
        matches.push([row + i, col])
        i++
      }
    }
    return matches.length >= 3 ? matches : []
  }

  /**
   * 获取棋子下标
   * @param pos 触摸位置
   * @returns 棋子下标
   */
  getPieceAtPosition(pos: Vec2 | null): number[] | undefined {
    const uiTransform = this.node.getComponent(UITransform)
    const { x, y } = uiTransform.convertToNodeSpaceAR(v3(pos.x, pos.y))
    for (let row = 0; row < this.chessBoard.length; row++) {
      for (let col = 0; col < this.chessBoard[row].length; col++) {
        const piece = this.chessBoard[row][col]
        if (piece) {
          const rect = piece.getComponent(UITransform).getBoundingBox()
          if (rect.contains(v2(x, y))) {
            return [row, col]
          }
        }
      }
    }
    return
  }

  /**
   * 获取交换的棋子
   */
  getSwappingPieces(event: EventTouch) {
    if (!this.startTouchPos || !event || !this.swapBeforeIndex || this.isSwap) {
      return null
    }
    const { x: moveX, y: moveY } = event.getUILocation()
    const [beforeRow, beforeCol] = this.swapBeforeIndex
    let target: number[] = null
    if (
      Math.abs(moveX - this.startTouchPos.x) >
      Math.abs(moveY - this.startTouchPos.y)
    ) {
      if (Math.abs(moveX - this.startTouchPos.x) < 30) return null
      // 水平方向交换
      if (moveX - this.startTouchPos.x > 0) {
        target = [beforeRow, beforeCol + 1]
      } else {
        target = [beforeRow, beforeCol - 1]
      }
    } else {
      if (Math.abs(moveY - this.startTouchPos.y) < 30) return null
      // 垂直方向交换
      if (moveY - this.startTouchPos.y > 0) {
        target = [beforeRow - 1, beforeCol]
        // 向上交换
      } else {
        target = [beforeRow + 1, beforeCol]
        // 向下交换
      }
    }

    if (!this.isWithInBoard(target, this.boardWidth, this.boardHeight)) {
      return null
    }

    return target
  }

  /**
   * 检查是否在棋盘内
   * @param target 目标位置
   * @param boardWidth 棋盘宽度
   * @param boardHeight 棋盘高度
   * @returns 是否在棋盘内
   */
  isWithInBoard(target, boardWidth, boardHeight) {
    if (!target) return false
    const [row, col] = target
    return row >= 0 && row < boardHeight && col >= 0 && col < boardWidth
  }

  playEffect(row: number, col: number) {
    // 消除该棋子
    this.node.removeChild(this.chessBoard[row][col])
    this.chessBoard[row][col] = null

    // 播放动画
    const [x, y] = this.getPiecePosition(row, col)
    const effect = instantiate(this.effect)
    effect.setPosition(x, y)
    this.node.addChild(effect)
    effect.getComponent(Animation).play()
    setTimeout(() => {
      effect.destroy()
    }, 2000)
  }

  /**
   * 播放爆炸动画
   * @param row 行
   * @param col 列
   */
  playBom(row: number, col: number) {
    const [x, y] = this.getPiecePosition(row, col)
    const bom = instantiate(this.bom)
    bom.setPosition(x, y)
    this.node.addChild(bom)
    bom.getComponent(Animation).play()
    setTimeout(() => {
      bom.destroy()
    }, 100)
  }

  playBombLineOrCol(row: number, col: number, name: string) {
    const [x, y] = this.getPiecePosition(row, col)
    const bombLineOrCol = instantiate(this.bombLineOrCol)
    bombLineOrCol.setPosition(x, y)
    this.node.addChild(bombLineOrCol)
    bombLineOrCol.getComponent(Animation).play(name)
    setTimeout(() => {
      bombLineOrCol.destroy()
    }, 100)
  }

  setClickLight(row: number, col: number) {
    this.chessBoard[row][col].getComponent(Animation).play()
  }
}
