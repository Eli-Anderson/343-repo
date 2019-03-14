import {GameObject, Game, TextRenderer, SpriteRenderer, Sprite, Scene, Color, Vector2, Transform, Util} from "https://eli-anderson.github.io/JSEngine2D/engine.js";
import Pallette from "./pallette.js";
import RoundRect from "./RoundRect.js";
import MButton from "./button.js";

let deadSprite = new RoundRect({'color':new Color({'r':0,'g':0,'b':0,'a':0.3}), 'r':15, 'borderWidth':3, 'borderColor':Pallette.border});
let aliveSprite = new RoundRect({'color':new Color({'r':220,'g':220,'b':220}), 'r':15, 'borderWidth':3, 'borderColor':Pallette.border});

const DEAD = 0;
const ALIVE = 1;

/**
 * Class for the board's cells. Each Cell has a positition (col, row) and a state.
 * States are ordered as follows:
 * 0 - Dead
 * 1 - Alive
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
		this.state = state % 2; // 0 or 1
		
		this.board = board;
		this.row = position.y;
		this.col = position.x;

		this.sprites = [deadSprite, aliveSprite];

		this.addComponent(new SpriteRenderer({'sprite':this.sprites[this.state]}));
	}

	/**
	 * Set the state of the Cell. This will in turn change the sprite of the
	 * Cell as well as the internal state.
	 *
	 * @param      {number}  state   The state to change it to. 0-2 (EMPTY, WHITE, BLACK)
	 */
	setState(state) {
		this.state = state % 2;
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
		// add our listener to the DOM File Input object
		document.addEventListener('change', (e)=>{this.read(e)}, true);
		this.cols = size;
		this.rows = size;
		this.cells = [];

		this.originalStates = [];
		this.downloadIndex = 1;

		//
		// Formatting the Board's size (width and height) based on the number of cells
		//
		let cellPaddingX = 64 / this.cols;
		let cellPaddingY = 64 / this.rows;
		let margins = 32;
		let cellSize = 64 / (this.cols / 6);
		

		for (let s of [deadSprite, aliveSprite]) {
			// scale the border radius with the size
			s.r = 15 / (this.cols / 6);
			s.borderWidth = 3 / (this.cols / 6);
		}

		// set our board's width and height
		this.transform.width = 510;
		this.transform.height = 470;
		// move our board to the center of the screen
		this.moveCenterTo(Scene.current.mainCamera.viewport.center.copy());
		this.transform.x *= (2/3) // but let's move it to the left a bit
		//
		// End of formatting
		// 

		//
		// Adding the components necessary for rendering the board and buttons
		//
		
		// add our component for rendering the board background
		this.addComponent(new SpriteRenderer({
			'sprite':new RoundRect({
				'color':Pallette.board, 
				'borderWidth':4, 
				'borderColor':Pallette.border})}));


		let rect = this.transform.rect;

		// the class MButton is found in button.js and represents a menu button
		// that we can use for the different events we have

		let loadButton = new MButton({
			'position':new Vector2({'x':rect.right+12, 'y':rect.top+16}),
			'text':"LOAD",
			'onclick':()=>{document.getElementById('fileButton').click()}});
		this.add(loadButton);

		let saveButton = new MButton({
			'position':new Vector2({'x':rect.right+12, 'y':rect.top+80}),
			'text':"SAVE",
			'onclick':()=>{this.download()}});
		this.add(saveButton);

		let randomizeButton = new MButton({
			'position':new Vector2({'x':rect.right+12, 'y':rect.top+144}),
			'text':"RANDOM",
			'onclick':()=>{this.randomize()}});
		randomizeButton.getComponent(TextRenderer).font.size = 16;
		this.add(randomizeButton);

		let iterateButton = new MButton({
			'position':new Vector2({'x':rect.right+12, 'y':rect.bottom-128}),
			'text':"NEXT",
			'onclick':()=>{this.iterate()}});
		this.add(iterateButton);

		let resetButton = new MButton({
			'position':new Vector2({'x':rect.right+12, 'y':rect.bottom-64}),
			'text':"RESET",
			'onclick':()=>{this.reset()}});
		this.add(resetButton);
		//
		// End of component additions
		//

		// finally, create and initialize our board's cells
		this.init();
	}

	/**
	 * Gets the cell at the specified position. Keep in mind that this
	 * is handled in the typical (x, y) coordinates, where x is the COLUMN
	 * and y is the ROW.
	 *
	 * @param      {number}  col     The column
	 * @param      {number}  row     The row
	 * @return     {Cell}            The cell at this column, row
	 */
	getCell(col, row) {
		if (row >= 0 && row < this.cells.length && col >= 0 && col < this.cells[row].length) {
			return this.cells[row][col];
		} else {
			return null;
		}
	}

	neighbors(cell) {
		let col = cell.col;
		let row = cell.row;

		let sizeY = this.cells.length;
		let sizeX = this.cells[row].length;

		let count = 0;

		if (row > 0) 		count += this.cells[row-1][col].state; // handle top cell
		if (row < sizeX-1) 	count += this.cells[row+1][col].state; // handle bottom cell

		if (col > 0) 		count += this.cells[row][col-1].state; // handle left cell
		if (col < sizeY-1) 	count += this.cells[row][col+1].state; // handle right cell

		if (row > 0 && col > 0) 			count += this.cells[row-1][col-1].state; // handle top left cell
		if (row < sizeX-1 && col < sizeY-1) count += this.cells[row+1][col+1].state; // handle bottom right cell
		if (row > 0 && col < sizeY-1) 		count += this.cells[row-1][col+1].state; // handle top right cell
		if (row < sizeX-1 && col > 0) 		count += this.cells[row+1][col-1].state; // handle bottom left cell
		return count;
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
		this.randomize();
		console.log(this);
	}

	/**
	 * Iterate (mutate) the cells one time based on Conway's
	 * rules of life. We need to go through the entire board once
	 * before we modify it.
	 */
	iterate() {
		/*
			-A live cell with less than two live neighbors dies
			-A live cell with two or three live neighbors lives
			-A live cell with more than three neighbors dies
			-A dead cell with three live neighbors becomes live
		*/
		let states = []
		for (let cell of this.cells.flat()) {
			let neighbors = this.neighbors(cell);
			
			if (cell.state === ALIVE) {
				if (neighbors < 2) states.push(DEAD);
				else if (neighbors < 4) states.push(ALIVE);
				else states.push(DEAD);
			} else {
				if (neighbors == 3) states.push(ALIVE);
				else states.push(DEAD);
			}
		}
		let i=0;
		for (let cell of this.cells.flat()) {
			cell.setState(states[i++]);
		}
	}

	/**
	 * Reset the board to a random state.
	 *
	 */
	randomize() {
		for (let cell of this.cells.flat()) {
			cell.setState(DEAD);
		}
		let n = this.cells.length*this.cells.length;
		for (let cell of Util.arrSample(this.cells.flat(), Util.randRange(Math.floor(n/4), Math.floor(n/3)))) {
			// randomly pick 8-12 cells and set them to alive
			cell.setState(ALIVE);
		}
	}

	reset() {
		for (let row = 0; row < this.cells.length; row++) {
			for (let col = 0; col < this.cells[row].length; col++) {
				
			}
		}
	}

	download() {
		let boardData = [];
		for (let row = 0; row < this.cells.length; row++) {
			boardData.push([]);
			for (let col = 0; col < this.cells[row].length; col++) {
				boardData[row][col] = this.cells[row][col].state;
			}
		}

		let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(boardData));
		let dlElement = document.getElementById('downloadLink');
		dlElement.setAttribute("href",     dataStr     );
		dlElement.setAttribute("download", "file_"+this.downloadIndex++);
		dlElement.click();
	}

	read(e) {
		let file = e.target.files[0];
		let reader = new FileReader();
		reader.readAsText(file);
		reader.onload = ()=>{
			let json = reader.result;
			try {
				let data = JSON.parse(json);
				if (data.constructor !== Array) {
					console.warn("File is not an array");
					return;
				}
				if (	data.length !== this.cells.length
					|| 	data.length > 0 && data[0].length !== this.cells[0].length) {
					for (let cell of this.cells.flat()) {
						cell.destroy();
					}
					this.cells = [];

					this.rows = data.length;
					this.cols = data[0].length;
					this.init();
				}
				for (let row=0; row < data.length; row++) {
					for (let col=0; col < data[row].length; col++) {
						this.cells[row][col].setState(data[row][col]);
					}
				}
			} catch(e) {
				console.warn("File was not parsable from JSON or was of the incorrect format");
				console.warn(e);
				return;
			}
		}
	}

	update(dt) {
		if (Game.instance.ticks % 30 === 0) {
			this.iterate();
		}
	}
}

export {Board}