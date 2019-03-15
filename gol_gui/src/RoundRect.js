import {Color, Sprite} from "https://eli-anderson.github.io/JSEngine2D/engine.js";
export default class RoundRect extends Sprite {
	constructor({color=Color.BLACK, r=30, borderWidth=0, borderColor=Color.BLACK, fill=true}) {
		super({color});
		this.r = r;
		this.borderWidth = borderWidth;
		this.borderColor = borderColor;
		this.fill = fill;
		this.draw = function (ctx, t) {
			let radius = {'tl':this.r, 'tr':this.r, 'bl':this.r, 'br':this.r}
			ctx.beginPath();
			ctx.moveTo(t.x + radius.tl, t.y);
			ctx.lineTo(t.x + t.width - radius.tr, t.y);
			ctx.quadraticCurveTo(t.x + t.width, t.y, t.x + t.width, t.y + radius.tr);
			ctx.lineTo(t.x + t.width, t.y + t.height - radius.br);
			ctx.quadraticCurveTo(t.x + t.width, t.y + t.height, t.x + t.width - radius.br, t.y + t.height);
			ctx.lineTo(t.x + radius.bl, t.y + t.height);
			ctx.quadraticCurveTo(t.x, t.y + t.height, t.x, t.y + t.height - radius.bl);
			ctx.lineTo(t.x, t.y + radius.tl);
			ctx.quadraticCurveTo(t.x, t.y, t.x + radius.tl, t.y);
			ctx.closePath();
			if (this.fill) {
				ctx.fillStyle = color.toString();
				ctx.fill();
			}
			if (this.borderWidth > 0) {
				ctx.lineWidth = this.borderWidth;
				ctx.strokeStyle = (borderColor) ? this.borderColor.toString() : color.toString();
				ctx.stroke();
			}
		}
	}
} 