import {getStore} from "../utils"
import {Url} from "url"

let LINE_RADIUS = 10 // the short radius of the "line box"
let ARROWHEAD_RADIUS = 25 // the arrowhead radius
let ARROWHEAD_DEPTH = 30

let store = getStore(), args = Url.parse(window.location), searchParams = new URLSearchParams(window.location.search.substring(1))

let image = searchParams.get('image') || ""
let edit = searchParams.get('edit') == "true"
let pallet = searchParams.get('pallet') || ""

createjs.MotionGuidePlugin.install()
createjs.Sound.registerPlugins([createjs.WebAudioPlugin, createjs.HTMLAudioPlugin, createjs.FlashAudioPlugin])
createjs.Ticker.frameRate = 10

class Arrow {
	constructor(stage,x,y,length,rotation,color) {
		this.stage = stage
		this.x = x
		this.y = y
		this.length = length
		this.rotation = rotation
		this.color = color
        this.arrow = new createjs.Shape()
        stage.addChild(this.arrow)
	}
	
	render() {
        arrow.graphics.s(this.color)
            .f(this.color)
            .mt(0, 0)
            .lt(0, LINE_RADIUS)
            .lt(this.length - ARROWHEAD_DEPTH, LINE_RADIUS)
            .lt(this.length - ARROWHEAD_DEPTH, ARROWHEAD_RADIUS)
            .lt(this.length, 0)
            .lt(this.length - ARROWHEAD_DEPTH, -ARROWHEAD_RADIUS)
            .lt(this.length - ARROWHEAD_DEPTH, -LINE_RADIUS)
            .lt(0, -LINE_RADIUS)
            .lt(0, 0)
            .es()
        arrow.x = this.x
        arrow.y = this.y
        arrow.alpha = 1
        arrow.rotation = this.rotation
	}
}

class ArrowPallet {
	constructor(x,y) {
		this.arrows = []
		for (let i = 0; i < 8; i++) this.arrows = this.arrows.concat(new Arrow(x,y,45*i,"#000"))
	}
	
	render() {
		// draw circle
		this.arrows.forEach(a => a.render())
	}
}

class Pallet() {
	switch (pallet) {
	case "arrow": return new ArrowPallet(0,0)
	case "temp" return new TempPallet()
	}
}

class Dragit {
	constructor() {
		this.mainstage = new createjs.Stage("maincanvas")
		this.pallet = new Pallet()
	}
}

(new Dragit()).run()