const margin = 30

export class Axis {
	constructor(spec) {
		this.stage = spec.stage
		this.w = spec.dim.w || 100
		this.h = spec.dim.h || 100
		this.min = spec.dim.min || 0
		this.max = spec.dim.max || 100
		this.font = spec.font || "12px Arial"
		this.color = spec.color || "#000"
		this.label = spec.label || "label"
		this.major = spec.major || 10
		this.minor = spec.minor || 5
		this.vertical = spec.orient && spec.orient == "vertical" || false
		this.linear = spec.scale && spec.scale == "linear" || false 
		this.scale = this.vertical ? (this.h-margin-10)/(this.max - this.min): (this.w-margin-10)/(this.max - this.min)
		this.originX = margin
		this.originY = this.h-margin
	}

	drawLine(x1,y1,x2,y2) {
		let line = new createjs.Shape()
		line.graphics.setStrokeStyle(1)
		line.graphics.beginStroke(this.color)
		line.graphics.moveTo(x1, y1)
		line.graphics.lineTo(x2, y2)
		line.graphics.endStroke();
		this.stage.addChild(line)
	}
	
	drawText(text,x,y) {
		text.x = x
		text.y = y
		if (this.vertical) text.rotation = 270
		this.stage.addChild(text)
		return text
	}

	getText(s) { return new createjs.Text(s,this.font,this.color) }

    render() {
    	let label = this.getText(this.label)
    	let label_bnds = label.getBounds()
        if (this.vertical) {
            this.drawLine(this.originX,this.originY,margin,0)            
            let y = this.originY - (this.originY - label_bnds.width)/2
            this.drawText(label, 4, y)
            for (let val = this.min; val <= this.max; val += this.major) {
                let v = this.getLoc(val)
                this.drawLine(this.originX-3,v,this.originX+3,v)                
                let text = this.getText(val)
                let bnds = text.getBounds()
                this.drawText(text,this.originX-3-bnds.height,v+bnds.height/2)
            }
        } else {
            this.drawLine(this.originX,this.originY, this.w,this.originY)            
            let x = (this.w - label_bnds.width)/2
            this.drawText(label, this.originX + x, this.originY + 15)
            for (let val = this.min; val <= this.max; val += this.major)  {
                let v = this.getLoc(val)
                this.drawLine(v,this.originY-3,v,this.originY+3)              
                let text = this.getText(val)
                let bnds = text.getBounds()
                this.drawText(text,v-bnds.width/2,this.originY+4)
            }
        }
    }

    getLoc(val) {
        let ival = this.linear? Math.round(this.scale*(val-this.min)): Math.round(Math.log(this.scale*(val-this.min)))
        return this.vertical?this.originY - ival:this.originX + ival
    }

    getValue(v) {
    	let factor = this.vertical? (this.h - (v - this.originY))/this.h:(v - this.originX)/this.w
        return this.min + (this.max - this.min) * factor
    }

    isInside(v) {
        if (this.vertical)
            return v >= this.originY && v <= (this.originY + this.h)
        else
            return v >= this.originX && v <= (this.originY + this.w)
    }
}
