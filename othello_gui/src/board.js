import {GameObject, Input, TextRenderer, Font, SpriteRenderer, Sprite, Button, Scene, Color, Vector2, Transform, Util, PhysicsEngine} from "https://eli-anderson.github.io/JSEngine2D/engine.js";
import Pallette from "./pallette.js";
import RoundRect from "./RoundRect.js";

let emptySprite = new RoundRect({'color':new Color({'r':0,'g':0,'b':0,'a':0.3}), 'r':15, 'borderWidth':3, 'borderColor':Pallette.border});
let blackSprite = new RoundRect({'color':new Color({'r':20,'g':20,'b':20}), 'r':15, 'borderWidth':3, 'borderColor':Pallette.border});
let whiteSprite = new RoundRect({'color':new Color({'r':220,'g':220,'b':220}), 'r':15, 'borderWidth':3, 'borderColor':Pallette.border});
let highlightSprite = new RoundRect({'color':new Color({'r':255,'g':255,'b':255,'a':0.2}), 'r':15});

const EMPTY = 0;
const WHITE = 1;
const BLACK = 2;

/**
 * Class for the board's cells. Each Cell has a positition (col, row) and a state.
 * States are ordered as follows:
 * 0 - Empty
 * 1 - White
 * 2 - Black
 * 
 * Each Cell has a sprite, a button, and a highlight. The highlight is controlled
 * in the Board class, and shows up to give the player hints of possible plays
 * during his/her turn.
 *
 * @class      Cell (name)
 */
class Cell extends GameObject {
	constructor(transform, board, position, state = 0) {
		super({transform});
		this.state = state % 3; // 0, 1, or 2
		
		this.board = board;
		this.row = position.y;
		this.col = position.x;

		this.sprites = [emptySprite, whiteSprite, blackSprite];

		this.addComponent(new SpriteRenderer({'sprite':this.sprites[this.state]}));
		this.addComponent(new Button());
		this.getComponent(Button).onClick = ()=>{
			this.board.attemptPlace(this.col, this.row, this.state);
		}

		this.highlight = new GameObject({
			'transform':this.transform,
			'isUI':true
		});
		this.highlight.addComponent(new SpriteRenderer({
			'sprite':highlightSprite
		}))
		this.add(this.highlight);
		this.highlight.enabled = false;
	}

	/**
	 * Set the state of the Cell. This will in turn change the sprite of the
	 * Cell as well as the internal state.
	 *
	 * @param      {number}  state   The state to change it to. 0-2 (EMPTY, WHITE, BLACK)
	 */
	setState(state) {
		this.state = state % 3;
		this.getComponent(SpriteRenderer).sprite = this.sprites[this.state];
	}
}

const status = {
	'PLAYING': 0,
	'NOMOVES': 1,
	'GAMEOVER': 2
}
Object.freeze(status); // prevent editing our status object


/**
 * Class for the game board. 
 *
 * @class      Board (name)
 */
class Board extends GameObject {
	constructor({size}) {
		super({'transform':new Transform({})});
		size = size - (size % 2); // make sure size is even
		this.cols = size;
		this.rows = size;
		this.cells = [];

		//
		// Formatting the Board's size (width and height) based on the number of cells
		//
		let cellPaddingX = 64 / this.cols;
		let cellPaddingY = 64 / this.rows;
		let margins = 32;
		let cellSize = 64 / (this.cols / 6);
		

		for (let s of [emptySprite, blackSprite, whiteSprite]) {
			s.r = 15 / (this.cols / 6);
			s.borderWidth = 3 / (this.cols / 6);
		}
		highlightSprite.r = 15 / (this.cols / 6)


		this.transform.width = (this.cols * cellSize) + ((this.cols-1) * cellPaddingX) + (2*margins);
		this.transform.height = (this.rows * cellSize) + ((this.rows-1) * cellPaddingY) + (2*margins);
		if (this.transform.height > 470) this.transform.height = 470;

		this.moveCenterTo(Scene.current.mainCamera.viewport.center.copy());
		this.transform.x *= (2/3) // move to the left a bit
		//
		// End of formatting
		// 

		//
		// Adding the components necessary for rendering the board and text
		//
		this.addComponent(new SpriteRenderer({
			'sprite':new RoundRect({
				'color':Pallette.board, 
				'borderWidth':4, 
				'borderColor':Pallette.border})}));


		let rect = this.transform.rect;
		this.turnText = new GameObject({
			'transform':new Transform({'x':rect.right+4, 'y':rect.top+8, 'z':15, 'width':128, 'height':64}),
			'isUI':true});
		this.turnText.addComponent(new TextRenderer({
			'text':"White's turn", 
			'font':new Font({
				'name': "Aldrich",
				'size': 24,
				'vAlignment': Font.CENTERED,
				'hAlignment': Font.LEFT
		})}))
		this.add(this.turnText)

		this.resetButton = new GameObject({
			'transform':new Transform({'x':rect.right+12, 'y':rect.bottom-64, 'z':15, 'width':88, 'height':48}),
			'isUI':true});
		this.resetButton.addComponent(new SpriteRenderer({
			'sprite':new RoundRect({
				'color':Pallette.board.copy(), 
				'r':8,
				'borderWidth':2, 
				'borderColor':Pallette.border})}));
		this.resetButton.addComponent(new TextRenderer({
			'text':"RESET",
			'font':new Font({
				'name': "Aldrich",
				'size': 24,
				'vAlignment': Font.CENTERED,
				'hAlignment': Font.CENTERED
		})}));
		this.resetButton.addComponent(new Button()).onHover = (pt)=>{
			this.resetButton.getComponent(SpriteRenderer).sprite.color.a = 0.8;
		}
		this.resetButton.getComponent(Button).onExit = (pt)=>{
			this.resetButton.getComponent(SpriteRenderer).sprite.color.a = 1;
		}
		this.resetButton.getComponent(Button).onClick = (pt)=>{
			this.reset();
		}
		this.add(this.resetButton);
		this.time = 0;
		this.blinkTime = 0;
		//
		// End of component additions
		//

		this.init();
	}

	get turn() {
		return this._turn;
	}

	/**
	 * Setter for turn. Sets the turn to `t`. `t` should be one of
	 * {EMPTY | WHITE | BLACK}. Also changes the text to represent
	 * whose turn it is.
	 *
	 * @param      {Number}  t       Whose turn it is.
	 */
	set turn(t) {
		this._turn = t;
		if (this._turn === WHITE) {
			this.turnText.getComponent(TextRenderer).text = "WHITE'S\nTURN";
		} else {
			this.turnText.getComponent(TextRenderer).text = "BLACK'S\nTURN";
		}
	}

	/**
	 * Gets the cell at the specified position. Keep in mind that this
	 * is handled in the typical (x, y) coordinates, where x is the COLUMN
	 * and y is the ROW.
	 *
	 * @param      {number}  col     The column
	 * @param      {number}  row     The row
	 * @return     {Cell}  The cell at this column, row
	 */
	getCell(col, row) {
		if (row >= 0 && row < this.cells.length && col >= 0 && col < this.cells[row].length) {
			return this.cells[row][col];
		} else {
			return null;
		}
	}

	/**
	 * Determines if a piece can be placed at the given cell coordinates with
	 * the given state.
	 *
	 * @param      {number}  col     The column
	 * @param      {number}  row     The row
	 * @param      {number}  state   The state (WHITE or BLACK)
	 * @return     {boolean}         True if valid move, False otherwise.
	 */
	isValidMove(col, row, state) {
		if (this.cells[row][col].state !== EMPTY) {
			return false;
		}
		let directions = [[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]];
		let otherState = state === WHITE ? BLACK : WHITE;

		for (let d = 0; d < 8; d++) {
			// we have 8 possible directions we can flip tiles in
			let dx = directions[d][0];
			let dy = directions[d][1];
			let x = col;
			let y = row;
			let flip = 0;
			// we set flip to 1 if the disc we are currently checking is possible to flip
			// but we cannot flip it right then and there because there may be others
			// in the line that need to be flipped as well
			// 
			// essentially, we start at the placement, move outward in the 8 directions,
			// if we find our own disc we stop, if we find an opponent's disc we keep going
			// until we find our own disc, then go back and flip them

			while (true) {
				x += dx;
				y += dy;
				if (x >= this.cells[0].length || x < 0 || y >= this.cells.length || y < 0) break;
				if (this.cells[y][x].state === EMPTY ||
					(this.cells[y][x].state === state && flip === 0)) {
					// we break out if we reach an empty tile, or if the first disc is one of ours
					break;
				} else if (this.cells[y][x].state === otherState) {
					// we might have a string of tiles to flip, continue moving
					flip = 1;
				} else if (this.cells[y][x].state === state && flip === 1) {
					// we have reached the end of the line, this is a valid move
					return true;
				}
			}
		}
		return false;
	}

	/**
	 * Places the piece at the given location with the given state.
	 *
	 * @param      {number}  col     The column number
	 * @param      {number}  row     The row number
	 * @param      {number}  state   The state
	 */
	place(col, row, state) {
		let directions = [[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]];
		let otherState = state === WHITE ? BLACK : WHITE;

		for (let d = 0; d < 8; d++) {
			// we have 8 possible directions we can flip tiles in
			let dx = directions[d][0];
			let dy = directions[d][1];
			let x = col;
			let y = row;
			let flip = 0;
			// we set flip to 1 if the disc we are currently checking is possible to flip
			// but we cannot flip it right then and there because there may be others
			// in the line that need to be flipped as well
			// 
			// essentially, we start at the placement, move outward in the 8 directions,
			// if we find our own disc we stop, if we find an opponent's disc we keep going
			// until we find our own disc, then go back and flip them

			while (true) {
				x += dx;
				y += dy;
				if (x >= this.cells[0].length || x < 0 || y >= this.cells.length || y < 0) break;
				if (this.cells[y][x].state === EMPTY ||
					(this.cells[y][x].state === state && flip === 0)) {
					// we break out if we reach an empty tile, or if the first disc is one of ours
					break;
				} else if (this.cells[y][x].state === otherState) {
					// we might have a string of tiles to flip, continue moving
					flip = 1;
				} else if (this.cells[y][x].state === state && flip === 1) {
					// we have reached the end of the line, this is a valid move
					while(!(x === col && y === row)) {
						// go back along the line
						x -= dx;
						y -= dy;
						// flip the disc
						this.cells[y][x].setState(state);
					}
					break;
				}
			}
		}
	}

	/**
	 * Checks to see if the current player can place a piece
	 * at the given position, and places it if it is valid. This
	 * also calls the method to handle the game state after the
	 * piece is placed.
	 *
	 * @param      {number}  col     The column
	 * @param      {number}  row     The row
	 */
	attemptPlace(col, row) {
		if (this.isValidMove(col, row, this.turn)) {
			this.place(col, row, this.turn);
			this.turn = this.turn === WHITE ? BLACK : WHITE;
			this.disableHighlights();

			this.handleGameState();
		}
	}

	/**
	 * Handles the state of the game. This is called after every piece
	 * is placed, and will determine if the game is over, if the player's
	 * turn should be skipped, or if the game's state is normal.
	 */
	handleGameState() {
		switch (this.status) { // this.status calculates the status and returns it
			case status.GAMEOVER:
				{
					// The board is full or no moves are available for either player...
					// the game is over
					this.handleWin();
				} break;
			case status.NOMOVES:
				{
					// The current player has no possible moves...
					// keep in mind this is the player AFTER the pervious placement
					// was made. So really this means the NEXT player needs to have their
					// turn skipped.
					this.turn = this.turn === WHITE ? BLACK : WHITE;
					// so skip their turn
				} break;
			case status.PLAYING:
				{
					// Game is playing as normal
				} break;
		}
	}

	/**
	 * Creates and initializes the board's cells. This sets them all to state 0 (empty).
	 * This method should only be called through the constructor.
	 */
	init() {
		let cellPaddingX = 64 / this.cols;
		let cellPaddingY = 64 / this.rows;
		let margins = 32;
		let cellSize = 64 / (this.cols / 6);
		for (let row = 0; row < this.rows; row++) {
			this.cells.push([])
			for (let col = 0; col < this.cols; col++) {
				let x = this.transform.x + margins + ((cellSize + cellPaddingX)*col);
				let y = this.transform.y + (margins - 16) + ((cellSize + cellPaddingY)*row);

				let cell = new Cell(
					new Transform({
						'x':x, 
						'y':y, 'z':1, 
						'width':cellSize, 
						'height':cellSize
					}), this, new Vector2({'x':col,'y':row}), 0);
				this.add(cell);
				this.cells[row].push(cell);
			}
		}
		this.reset();
	}

	/**
	 * Reset the board to its initial state.
	 *
	 */
	reset() {
		this.disableHighlights();

		this.turn = WHITE;
		let middleX = Math.floor(this.cells[0].length / 2) - 1;
		let middleY = Math.floor(this.cells.length / 2) - 1;
		for (let row = 0; row < this.cells.length; row++) {
			for (let col = 0; col < this.cells[row].length; col++) {
				let state = 0;
				if (col === middleX) {
					if (row === middleY) {
						state = 1;
					} else if (row === middleY+1){
						state = 2;
					}
				} else if (col === middleX+1) {
					if (row === middleY) {
						state = 2;
					} else if (row === middleY+1){
						state = 1;
					}
				}
				this.cells[row][col].setState(state);
			}
		}
	}

	/**
	 * Gets the current status of the board based on its state.
	 *
	 * @return     {number}  { Returns a value from the status "enum" }
	 */
	get status() {
		if (this.cells.flat().filter((cell)=>cell.state===0).length === 0) {
			// board is completely full
			return status.GAMEOVER;
		}
		let wHasMoves = false;
		let bHasMoves = false;
		for (let cell of this.cells.flat()) {
			if (this.isValidMove(cell.col, cell.row, WHITE)) {
				wHasMoves = true;
			}
			if (this.isValidMove(cell.col, cell.row, BLACK)) {
				bHasMoves = true;
			}
		}
		if (!wHasMoves && !bHasMoves) {
			// if neither player can move, game is over
			return status.GAMEOVER;
		}
		if (this.turn === WHITE) {
			// if it is white's turn and they can move, status is good...
			// if they cannot move, status is NOMOVES (they need to be skipped)
			return wHasMoves ? status.PLAYING : status.NOMOVES;
		}
		if (this.turn === BLACK) {
			// if it is black's turn and they can move, status is good...
			// if they cannot move, status is NOMOVES (they need to be skipped)
			return bHasMoves ? status.PLAYING : status.NOMOVES;
		}
		return status.PLAYING;
	}

	/**
	 * Handle the win state of the board when it is full.
	 */
	handleWin() {
		let white = 0;
		let black = 0;
		for (let cell of this.cells.flat()) {
			if (cell.state === WHITE) white++;
			if (cell.state === BLACK) black++;
		}
		if (white > black) {
			this.turnText.getComponent(TextRenderer).text = `WHITE\nWINS\n${white}-${black}`;
		} else if (black > white) {
			this.turnText.getComponent(TextRenderer).text = `BLACK\nWINS\n${black}-${white}`;
		} else {
			this.turnText.getComponent(TextRenderer).text = `DRAW\n${white}-${black}`;
		}
	}

	/**
	 * Enables the highlights of the possible moves for the current player.
	 */
	highlightMoves() {
		for (let cell of this.cells.flat()) {
			if (this.isValidMove(cell.col, cell.row, this.turn)) {
				cell.highlight.enabled = !cell.highlight.enabled;
			}
		}
	}

	/**
	 * Disables the highlights of the possible moves for the current player.
	 */
	disableHighlights() {
		this.time = 0;
		this.blinkTime = 0;
		for (let cell of this.cells.flat()) {
			cell.highlight.enabled = false;
		}
	}

	/**
	 * This is called every frame by the engine. We just need to update a 
	 * timer so all of the blinking highlights are synced together, and so
	 * we can set a delay for them to turn on.
	 *
	 * @param      {number}  dt      The amount of seconds passed since the last frame
	 */
	update(dt) {
		this.time += dt;
		if (this.time >= 3) {
			this.blinkTime += dt;
			if (this.blinkTime > 0.5) {
				this.blinkTime = 0;
				this.highlightMoves();
			}
		}
	}
}

export {Board}