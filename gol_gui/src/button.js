import {GameObject, TextRenderer, Font, SpriteRenderer, Sprite, Button, Color, Transform} from "https://eli-anderson.github.io/JSEngine2D/engine.js";
import Pallette from "./pallette.js";
import RoundRect from "./RoundRect.js";

export default class MButton extends GameObject {
	constructor({position, text, onclick}) {
		super({	'transform':new Transform({'x':position.x, 'y':position.y, 'z':15, 'width':88, 'height':48}),
				'isUI':true});


		this.addComponent(new SpriteRenderer({
			'sprite':new RoundRect({
				'color':Pallette.board.copy(), 
				'r':8,
				'borderWidth':2, 
				'borderColor':Pallette.border})}));
		this.addComponent(new TextRenderer({
			'text':text,
			'font':new Font({
				'name': "Aldrich",
				'size': 24,
				'vAlignment': Font.CENTERED,
				'hAlignment': Font.CENTERED
		})}));
		this.addComponent(new Button()).onHover = (pt)=>{
			this.getComponent(SpriteRenderer).sprite.color.a = 0.8;
		}
		this.getComponent(Button).onExit = (pt)=>{
			this.getComponent(SpriteRenderer).sprite.color.a = 1;
		}
		this.getComponent(Button).onClick = onclick;
	}
}