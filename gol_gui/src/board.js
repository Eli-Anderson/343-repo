import {GameObject, Game, TextRenderer, SpriteRenderer, Sprite, Scene, Color, Vector2, Transform, Random} from "https://eli-anderson.github.io/JSEngine2D/engine.js";
import Pallette from "./pallette.js";
import RoundRect from "./RoundRect.js";
import MButton from "./button.js";

let deadSprite = new RoundRect({'color':new Color({'r':0,'g':0,'b':0,'a':0.3}), 'r':15, 'borderWidth':3, 'borderColor':Pallette.border});
let aliveSprite = new RoundRect({'color':new Color({'r':220,'g':220,'b':220}), 'r':15, 'borderWidth':3, 'borderColor':Pallette.border});

const sprites = [deadSprite, aliveSprite];
const DEAD = 0;
const ALIVE = 1;

/**
 * Class for the board's cells. Each Cell has only a sprite (for rendering) 
 * and a state. States are ordered as follows:
 * 0 - Dead
 * 1 - Alive
 * 
 * @class      Cell (name)
 */
class Cell extends GameObject {
	constructor(transform, state = 0) {
		super({transform});
		this.state = state % 2; // 0 or 1
		this.attach(new SpriteRenderer({'sprite':sprites[this.state]}));
	}

	/**
	 * Set the state of the Cell. This will in turn change the sprite of the
	 * Cell as well as its internal state.
	 *
	 * @param      {number}  state   The state to change it to. 0 or 1 (DEAD or ALIVE)
	 */
	setState(state) {
		this.state = state % 2;
		this.getComponent(SpriteRenderer).sprite = sprites[this.state];
	}
}


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

		this.updateRate = 30; // we mutate every 30 frames

		//
		// Formatting the Board's size (width and height) based on the number of cells
		//
		let cellPaddingX = 64 / this.cols;
		let cellPaddingY = 64 / this.rows;
		let margins = 32;
		let cellSize = 64 / (this.cols / 6);
		

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
		this.attach(new SpriteRenderer({
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

		let fastButton = new MButton({
			'position':new Vector2({'x':rect.right+80, 'y':rect.bottom-128}),
			'text':">>",
			'onclick':()=>{if (this.updateRate > 10) this.updateRate-=5}});
		fastButton.transform.width = 48;
		this.add(fastButton);

		let slowButton = new MButton({
			'position':new Vector2({'x':rect.right+16, 'y':rect.bottom-128}),
			'text':"<<",
			'onclick':()=>{if (this.updateRate < 60) this.updateRate+=5}});
		slowButton.transform.width = 48;
		this.add(slowButton);

		let resetButton = new MButton({
			'position':new Vector2({'x':rect.right+12, 'y':rect.bottom-64}),
			'text':"RESET",
			'onclick':()=>{this.reset()}});
		this.add(resetButton);

		let incSizeButton = new MButton({
			'position':new Vector2({'x':rect.left-56, 'y':rect.top+16}),
			'text':"+",
			'onclick':()=>{this.resize(this.cells.length+1)}});
		incSizeButton.transform.width = 48;
		this.add(incSizeButton);

		let decSizeButton = new MButton({
			'position':new Vector2({'x':rect.left-56, 'y':rect.top+80}),
			'text':"-",
			'onclick':()=>{this.resize(this.cells.length-1)}});
		decSizeButton.transform.width = 48;
		this.add(decSizeButton);
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

	/**
	 * Get the number of alive neighbors (in 8 adjacent cells)
	 *
	 * @param      {Cell}  cell    The cell whose neighbors to check for
	 * @return     {number}  The number of alive neighbors
	 */
	neighbors(cell) {
		let c,r;
		for (let row=0; row < this.cells.length; row++) {
			for (let col=0; col < this.cells[row].length; col++) {
				if (this.cells[row][col] === cell) {
					r = row;
					c = col;
				}
			}
		}

		let sizeY = this.cells.length;
		let sizeX = this.cells[r].length;

		let count = 0;

		if (r > 0) 		count += this.cells[r-1][c].state; // handle top cell
		if (r < sizeX-1) 	count += this.cells[r+1][c].state; // handle bottom cell

		if (c > 0) 		count += this.cells[r][c-1].state; // handle left cell
		if (c < sizeY-1) 	count += this.cells[r][c+1].state; // handle right cell

		if (r > 0 && c > 0) 			count += this.cells[r-1][c-1].state; // handle top left cell
		if (r < sizeX-1 && c < sizeY-1) count += this.cells[r+1][c+1].state; // handle bottom right cell
		if (r > 0 && c < sizeY-1) 		count += this.cells[r-1][c+1].state; // handle top right cell
		if (r < sizeX-1 && c > 0) 		count += this.cells[r+1][c-1].state; // handle bottom left cell
		return count;
	}

	/**
	 * Creates and initializes the board's cells. This sets them all to state 0 (empty).
	 */
	init() {
		let cellPaddingX = 64 / this.cols;
		let cellPaddingY = 64 / this.rows;
		let margins = 32;
		let cellSize = 64 / (this.cols / 6);

		for (let s of [deadSprite, aliveSprite]) {
			// scale the border radius with the size
			s.r = 15 / (this.cols / 6);
			s.borderWidth = 3 / (this.cols / 6);
		}

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
					}), 0);
				this.add(cell);
				this.cells[row].push(cell);
			}
		}
		this.randomize();
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
	 */
	randomize() {
		for (let cell of this.cells.flat()) {
			cell.setState(DEAD);
		}
		let l = this.cells.length*this.cells.length; // number of total cells
		let n = Random.range(Math.floor(l/4), Math.floor(l/3));

		// we choose between 1/4 & 1/3 of the total cells to set to alive
		for (let cell of Random.sample(this.cells.flat(), n)) {
			// randomly pick n cells and set them to alive
			cell.setState(ALIVE);
		}
		this.set(); // save our board, so we can reset it later
	}

	/**
	 * Resets the board's cells' states to the last "saved" point.
	 * Save the board by calling set(). Set() is called every time
	 * the board is randomized or loaded from file.
	 */
	reset() {
		if (this.originalStates.length > 0) {
			for (let row = 0; row < this.cells.length; row++) {
				for (let col = 0; col < this.cells[row].length; col++) {
					this.cells[row][col].setState(this.originalStates[row][col]);
				}
			}
		}
	}

	/**
	 * Download the current board's state to file. It prompts the user
	 * to save the file to disk with the name "file_n.json" where n
	 * is a number > 0. n is increased every time the user downloads
	 * the board's state, that way the file is not overwritten.
	 */
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
		dlElement.setAttribute("href", dataStr);
		dlElement.setAttribute("download", "file_"+this.downloadIndex++);
		dlElement.click();
	}

	/**
	 * Reads a JSON file storing board data and, if possible, 
	 * loads it into the board. The format of the file
	 *
	 * @param      {<type>}  e       { parameter_description }
	 */
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
					this.resize(data.length);
				}
				for (let row=0; row < this.rows; row++) {
					for (let col=0; col < this.cols; col++) {
						this.cells[row][col].setState(data[row][col]);
					}
				}
				this.set();
			} catch(e) {
				console.warn("File was not parsable from JSON or was of the incorrect format");
				console.warn(e);
				return;
			}
		}
	}

	/**
	 * Saves the state of the board so reset() can be used to come back
	 * to the saved state.
	 */
	set() {
		this.originalStates = [];
		for (let row = 0; row < this.cells.length; row++) {
			this.originalStates.push([]);
			for (let col = 0; col < this.cells[row].length; col++) {
				this.originalStates[row].push(this.cells[row][col].state);
			}
		}
	}

	/**
	 * Resize the board to a size x size grid.
	 *
	 * @param      {number}  size    The size
	 */
	resize(size) {
		if (size >= 5) {
			for (let cell of this.cells.flat()) {
				cell.destroy();
			}
			this.cells = [];
			this._children = [];

			this.rows = size;
			this.cols = size;
			this.init();
		}
	}

	/**
	 * Updates the board. This is called by the engine every
	 * frame, so we only want to call iterate() after every
	 * 30 frames or so.
	 *
	 * @param      {number}  dt  The amount of time that passed since the last frame
	 */
	update(dt) {
		if (Game.instance.ticks % this.updateRate === 0) {
			this.iterate();
		}
	}
}

export {Board}