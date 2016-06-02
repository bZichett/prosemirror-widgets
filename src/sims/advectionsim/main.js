import {Graph} from "../utils"
 
createjs.MotionGuidePlugin.install()
createjs.Sound.registerPlugins([createjs.WebAudioPlugin, createjs.HTMLAudioPlugin, createjs.FlashAudioPlugin])

/*    double factor[] = { 1.0,0.7,0.0,-0.7,-1.0,-0.7,0,.7};  // cosine of the angle
    Color colors[] = {  new Color(0,0,255),     // 35 degrees
                        new Color(0,128,255),   // 40
                        new Color(128,255,255), // 45
                        new Color(0,255,0),     // 50
                        new Color(255,255,0),   // 55
                        new Color(255,255,255), // 60
                        new Color(220,220,220), // 65
                        new Color(200,200,200), // 70
                        new Color(128,128,128), // 75
                        new Color(128,64,64),   // 80
                        new Color(255,128,64),  // 85
                        new Color(255,128,128), // 90
                        new Color(255,0,128),   // 95
                        new Color(255,0,0),     // 100
                        new Color(64,64,64)    // >100
               };
*/
 
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
		this.contours = []
		let c = new createjs.Shape()
		c.graphics.setStrokeStyle(1).beginStroke("#000").beginFill("#F00").mt(-100,50).bezierCurveTo(100,50,200,100,600,-100).endStroke()
		c.alpha = .2
		this.contours.push(c)
		stage.addChild(c)
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
		this.stage.addChild(this.map)
		this.contours = new Contours(stage)
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
	}
	
	tick() {
		if (!this.running) return
		if (this.time >= 24) { 
			this.stop()
			return
		}
		this.update()
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
		createjs.Ticker.framerate = 2
		createjs.Ticker.addEventListener("tick", e => {
			this.usmap.tick()
			this.mainstage.update()
		})
	}
}

(new AdvectionSim()).run()
