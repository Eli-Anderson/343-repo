import {Game, Color, Vector2, Rect, Scene, GameObject, Camera, Loader, ImageResource, Sprite, Transform, TextBox, Font} from "https://eli-anderson.github.io/JSEngine2D/engine.js";
import {Board} from "./board.js";
import Pallette from "./pallette.js";
let canvas = document.getElementById('canvas');
let game = new Game({'canvas':canvas, 'inputTarget':canvas, 'size':new Vector2({'x':720, 'y':480})});

new Scene({'key':'main'});
Scene.getScene('main').bgColor = Pallette.background;
let cameraObj = new GameObject({'transform':new Transform({'width':720,'height':480})});
cameraObj.addComponent(new Camera({'viewport':new Rect({'width':720,'height':480})}));


Scene.current.add(cameraObj);
Scene.current.mainCamera = cameraObj.getComponent(Camera);


function main() {
	let board = new Board({'size':8});
	Scene.current.add(board);
	game.start();
}


main();

