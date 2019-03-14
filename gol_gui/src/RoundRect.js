import {Color, Sprite} from "https://eli-anderson.github.io/JSEngine2D/engine.js";
export default class RoundRect extends Sprite {
	constructor({color=Color.BLACK, r=30, borderWidth=0, borderColor}) {
		super({color});
		this.r = r;
		this.borderWidth = borderWidth;
		this.borderColor = borderColor;
		this.draw = function (ctx, transform) {
			ctx.fillStyle = color.toString();
			ctx.lineWidth = this.borderWidth;
			ctx.strokeStyle = (borderColor) ? this.borderColor.toString() : color.toString();
			let x = transform.x;
			let y = transform.y;
			let width = transform.width;
			let height = transform.height;
			let fill = true;
			let radius = {'tl':this.r, 'tr':this.r, 'bl':this.r, 'br':this.r}
			ctx.beginPath();
			ctx.moveTo(x + radius.tl, y);
			ctx.lineTo(x + width - radius.tr, y);
			ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
			ctx.lineTo(x + width, y + height - radius.br);
			ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
			ctx.lineTo(x + radius.bl, y + height);
			ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
			ctx.lineTo(x, y + radius.tl);
			ctx.quadraticCurveTo(x, y, x + radius.tl, y);
			ctx.closePath();
			if (fill) {
				ctx.fill();
			}
			if (borderWidth > 0) {
				ctx.stroke();
			}
		}
	}
} 