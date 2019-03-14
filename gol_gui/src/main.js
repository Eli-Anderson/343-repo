/*
 *	Author: Elijah Anderson
 *	For: GVSU - CIS 343 - Winter 2019
 *	Date: 03.13.2019
 *	
 *	This project was created to satisfy the requirements of a representation of Conway's
 *	Game of Life using Javascript. The main.js file sets up the game, whereas the board.js
 *	file does almost all of the leg-work and processing.
 *	
 *	The game is created using my prototyping engine for HTML5 Canvas games that I have been
 *	working on for nearly two years (on and off, of course). While some of the implementation
 *	may seem convoluted, due to the use of the engine, I have documented all of the functions
 *	and will list the ones in which are 'required' for the project. These are as follows:
 *	
 *	In the Board class:
 *		getCell - returns the cell at the given position, which bound checking
 *		neighbors - returns the count of living neighbors surrounding a given cell
 *		iterate - mutates the cells and modifies the board with the new generation
 *		read - reads the given File object from the triggered event using JSON.parse.
 *			The File should be a 2D Javascript array of 1s and 0s. 
 *			(i.e.  [[0,0,0],[0,1,0],[1,1,1]] )
 *		download - downloads the current Board's cells' states to a .json file
 *		
*/
import {Game, Color, Vector2, Rect, Scene, GameObject, Camera, Loader, ImageResource, Sprite, Transform, TextBox, Font} from "https://eli-anderson.github.io/JSEngine2D/engine.js";
import {Board} from "./board.js";
import Pallette from "./pallette.js";


let canvas = document.getElementById('canvas');
let game = new Game({'canvas':canvas, 'inputTarget':canvas, 'size':new Vector2({'x':720, 'y':480})});
game.targetFPS = 24; // limit our FPS so we don't use too much unnecessary CPU time

new Scene({'key':'main'}); // create our main scene
Scene.getScene('main').bgColor = Pallette.background; // set the background to a light-blue

// now we create our camera and add it to the scene
let cameraObj = new GameObject({'transform':new Transform({'width':720,'height':480})});
cameraObj.addComponent(new Camera({'viewport':new Rect({'width':720,'height':480})}));
Scene.current.add(cameraObj);

// set it as our main camera
Scene.current.mainCamera = cameraObj.getComponent(Camera);

function main() {
	// create our Board and add it to our Scene
	Scene.current.add(new Board({'size':10}));
	// then start the game's loop
	game.start();
}
main();

