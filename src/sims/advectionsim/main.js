import {Graph} from "../utils"
 
createjs.MotionGuidePlugin.install()
createjs.Sound.registerPlugins([createjs.WebAudioPlugin, createjs.HTMLAudioPlugin, createjs.FlashAudioPlugin])

const ncontour = 15
//    double factor[] = { 1.0,0.7,0.0,-0.7,-1.0,-0.7,0,.7};  // cosine of the angle
let contour = [
	{degree:"<35",color:"#00F"},
    {degree:"40",color:"#08F"},
    {degree:"45",color:"#8FF"},
    {degree:"50",color:"#64E986"},
    {degree:"55",color:"#FFDB58"},
    {degree:"60",color:"#C68E17"},
    {degree:"65",color:"#CCC"},
    {degree:"70",color:"#AAA"},
    {degree:"75",color:"#888"},
    {degree:"80",color:"#844"},
    {degree:"85",color:"#F84"},
    {degree:"90",color:"#F88"},
    {degree:"95",color:"#F08"},
    {degree:"100",color:"#F00"},
    {degree:">100",color:"#444"}
]

 
class Settings {
	constructor() {
		this.wind = document.getElementById("wind")
		this.windout = document.getElementById("windout")
		this.wdir = document.getElementById("wdir")
		this.duration = document.getElementById("duration")
		this.durationout = document.getElementById("durationout")
		this.contour = document.getElementById("contour")
		this.mute = document.getElementById("mute")
		this.listener = null
		function slidef(e,input, out, f) {
	    	e.stopPropagation()
	    	out.value = input.valueAsNumber
	    	if (f) f(input)
		}
		// IE doesn't have an input event but a change event
		let event = /msie|trident/g.test(window.navigator.userAgent.toLowerCase())?"change":"input"
		this.wind.addEventListener(event, e => slidef(e,this.wind,this.windout,this.listener))
		this.duration.addEventListener(event, e => slidef(e,this.duration,this.durationout,this.listener))
		this.setWind(0)
		this.setDuration(0)
	}
	
	getWind() { return this.wind.valueAsNumber }
	
	setWind(w) {
		this.wind.value = w
		this.windout.value = w
	}

	getDir() { this.dir.options[this.wdir.selectedIndex].text }

	getDuration() { return this.dur.valueAsNumber }
	
	setDuration(d) {
		this.duration.value = d
		this.durationout.value = d
	}

	getContour() { this.countour.options[this.contour.selectedIndex].text }

	getMute() { return this.mute.checked }

	addListener(listener) { this.listener = listener }
}

class Buttons {
	constructor() {
		this.run = document.getElementById("run")
		this.pause = document.getElementById("pause")
		this.restart = document.getElementById("restart")
	}
	
	addListener(listener) { 
		this.run.addEventListener("click", e => listener(e))
		this.pause.addEventListener("click", e => listener(e))
		this.restart.addEventListener("click", e => listener(e))
	}
}

class Contours {
	constructor(stage) {
		this.contours = new createjs.Container()
		let y = 600
		for (let i = ncontour-1; i >= 0; i--) {
			let c = new createjs.Shape()
			c.graphics.setStrokeStyle(1).beginStroke("#000").beginFill(contour[i].color).mt(-200,-400).lt(-400,y).quadraticCurveTo(350,y+75,700+y,-100).endStroke()
			this.contours.addChild(c)
			y -= 40
		}
		stage.addChild(this.contours)
	}
	
	getDegrees(x,y) {
		for (let i = ncontour-1; i >= 0; i--) {
			let c = this.contours.getChildAt(i)
			let pt = c.globalToLocal(x,y)
			console.log(pt)
			if (c.hitTest(pt.x,pt.y)) return contour[i].degree
		}
		return contour[0].degree
	}
}

class USMap {
	constructor(stage, settings, finish) {
		this.stage = stage
		this.settings = settings
		this.finish = finish
		this.level = 0
		this.time = 0
		createjs.Sound.registerSound({id: "wind", src:"assets/wind.mp3"})
		createjs.Sound.on("fileload", e => {
			this.wind = createjs.Sound.play("wind",{loop: -1})
			this.wind.paused = true
		})
		this.map = new createjs.Bitmap("assets/usmap.jpg")
		this.map.scaleY = 0.9
		this.map.alpha = .3
		this.contours = new Contours(stage)
		this.stage.addChild(this.map)
		let y = 20
		for (let i = 0; i < ncontour; i++) {
			let r = new createjs.Shape()
			r.graphics.setStrokeStyle(1).beginStroke("#000").beginFill(contour[i].color).rect(670,y,30,25).endStroke()
			let t = new createjs.Text(contour[i].degree,"bold 10px Arial","#FFF")
			t.x = 675
			t.y = y+7
			stage.addChild(r)
			stage.addChild(t)
			y += 25
		}
	}
	
	clear() {
		this.stop()
		this.stage.removeAllChildren()
		this.render()
	}
	
	run() {
		this.running = true
	}
	
	stop() {
		this.running = false;
		this.wind.paused = true
		if (this.finish) this.finish()
	}
		
	pause(pause) { 
		this.running = !pause
		if (pause === true) this.wind.paused = true
	}
	
	update() {
		if (!this.running) return
		if (this.time >= 24) { 
			this.stop()
			return
		}
		console.log(this.contours.getDegrees(100,300))
	}
}

class AdvectionSim {
	constructor() {
		this.mainstage = new createjs.Stage("maincanvas")
		this.buttons = new Buttons()
		this.settings = new Settings()
		this.usmap = new USMap(this.mainstage, this.settings, () => {
			this.buttons.restart.disabled = false
			this.buttons.pause.disabled = true
		})
		this.pause = false
		this.buttons.addListener(e => {
			switch(e.target.id) {
			case "run":
				this.enablePlay(false)
				this.buttons.pause.value = "Pause"
				this.pause = false
				this.usmap.run()
				break
			case "pause":
				this.pause = !this.pause
				this.usmap.pause(this.pause)
				e.target.value = this.pause? "Resume":"Pause"
				break
			case "restart":
				this.reset()
				this.usmap.clear()
				break
			}
		})
	}
		
	reset() {
		this.enablePlay(true)
	}
	
	enablePlay(play) {
		this.buttons.run.disabled = !play
		this.buttons.pause.disabled = play
	}
	
	run() {
		this.settings.mute.checked = false
		this.buttons.run.disabled = false
		this.buttons.pause.disabled = true
		this.buttons.restart.disabled = false
		createjs.Ticker.framerate = 1
		let tick = 0
		createjs.Ticker.addEventListener("tick", e => {
			this.usmap.update()
			this.mainstage.update()
			tick++
		})
	}
}

(new AdvectionSim()).run()
