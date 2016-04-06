import {Graph} from "../utils"
  
createjs.MotionGuidePlugin.install()
createjs.Sound.registerPlugins([createjs.WebAudioPlugin, createjs.HTMLAudioPlugin, createjs.FlashAudioPlugin])
createjs.Ticker.frameRate = 60

function saturation(temp) { return 10.0 * 0.611 * Math.exp(17.27*temp/(temp+237.3)) }
function humidity(temp, vapor) { return 100.0 * vapor/saturation(temp)}
function dewpoint(temp,vapor) { return temp - ((100.0-humidity(temp,vapor))/5.0) }

 
class Trial {
	constructor() {
		this.start = null
	    this.cloudbase = 0
	    this.temp = 0
	    this.altitude = 0
	    this.vapor = 0
	    this.humidity = 0
	    this.dewpoint = 0
	}
	
	init(start) {
		this.start = start
	    this.cloudbase = 0
	    this.temp = start.temp
	    this.altitude = 0
	    this.vapor = start.vapor
	    this.humidity = start.humidity
	    this.dewpoint = start.dewpoint
	}
	
	getCol(val) {
		let v = val.toFixed(1)
		let td = document.createElement("td")
		td.appendChild(document.createTextNode(v))
		return td
	}
	
	getRow() {
		let tr = document.createElement("tr")
		tr.appendChild(this.getCol(this.start.temp))
		tr.appendChild(this.getCol(this.start.vapor))
		tr.appendChild(this.getCol(this.start.dewpoint))
		tr.appendChild(this.getCol(this.temp))
		tr.appendChild(this.getCol(this.vapor))
		tr.appendChild(this.getCol(this.dewpoint))
		if (this.cloudbase > 0)
			tr.appendChild(this.getCol(this.cloudbase))
		else
			tr.appendChild(document.createElement("td").appendChild(document.createTextNode("Clear")))
		return tr
	}
}

class Settings {
	constructor() {
		this.temp = document.getElementById("temp")
		this.vapor = document.getElementById("vapor")
		this.tempout = document.getElementById("tempout")
		this.vaporout = document.getElementById("vaporout")
		this.mute = document.getElementById("mute")
		this.listener = null
		function slidef(e,input, out, f) {
	    	e.stopPropagation()
	    	out.value = input.valueAsNumber
	    	if (f) f(input)
		}
		// IE doesn't have an input event but a change event
		let event = /msie|trident/g.test(window.navigator.userAgent.toLowerCase())?"change":"input"
		this.temp.addEventListener(event, e => slidef(e,temp,tempout,this.listener))
		this.vapor.addEventListener(event, e => slidef(e,vapor,vaporout,this.listener))
	}
	
	getTemp() { return this.temp.valueAsNumber }

	getVapor() { return this.vapor.valueAsNumber }

	setTemp(value) {
		this.temp.value = value
		this.tempout.value = value.toFixed(1)
	}
	
	setVapor(value) {
		this.vapor.value = value
		this.vaporout.value = value.toFixed(1)
	}
	
	addListener(listener) { this.listener = listener }
}

class Buttons {
	constructor() {
		this.run = document.getElementById("run")
		this.pause = document.getElementById("pause")
		this.restart = document.getElementById("restart")
		this.mute = document.getElementById("mute")
	}
	
	addListener(listener) { 
		this.run.addEventListener("click", e => listener(e))
		this.pause.addEventListener("click", e => listener(e))
		this.restart.addEventListener("click", e => listener(e))
	}
	
	mute() { return this.mute.checked }
}

class ETGraph extends Graph {
	constructor(stage,settings) {
		super({
			stage: stage,
			w: 200,
			h: 200,
			xlabel: "Temperature(C)",
			ylabel: "Vapor Pressure(mb)",
			xscale: "linear",
			yscale: "linear",
			minX: -20,
			maxX: 30,
			minY: 0,
			maxY: 50,
			majorX: 10,
			minorX: 5,
			majorY: 10,
			minorY: 5
		})
		this.settings = settings
		this.lasth = 0
		this.leaf = new createjs.Bitmap("assets/leaf.gif")
		this.marker = new createjs.Shape()
		this.marker.graphics.beginFill("#000").drawRect(this.xaxis.getLoc(this.temp)-2,this.yaxis.getLoc(this.vapor)-2,4,4)
		stage.addChild(this.leaf)
		stage.addChild(this.marker)
		this.settings.addListener(slider => {
            if (slider.id == "temp")
                this.temp = slider.valueAsNumber
            else if (slider.id == "vapor")
                this.vapor = slider.valueAsNumber
            this.moveMarker(true)
		})
	}
	
	render() {
		this.temp = this.settings.getTemp()
		this.vapor = this.settings.getVapor()
		super.render()
		this.plotSaturation()
		this.moveMarker(true)
	}
	
	plotSaturation() {
        for (let t = this.xaxis.min; t <= this.xaxis.max; t++) this.plot(t,Math.round(saturation(t)))
        this.endPlot()
	}
	
	clear() {
		super.clear()
		this.stage.addChild(this.leaf)
	}
	
	moveLeaf(x,y) {
		this.leaf.x = x-10
		this.leaf.y = y-10
	}
	
	showLeaf(on) {
		if (on === true) {
	       let x = this.xaxis.getLoc(this.temp)
	       let y = this.yaxis.getLoc(this.vapor)
	       this.moveLeaf(x,y)
		} else
		   this.leaf.x = -1000
	}
		
    moveMarker(updateSettings) {
        let sat = saturation(this.temp)
        if (this.vapor > sat) {
        	this.vapor = sat
        	if (updateSettings === true) {
        		this.settings.setTemp(this.temp)
        		this.settings.setVapor(sat)
        	}
        }
        let x = this.xaxis.getLoc(this.temp)
        let y = this.yaxis.getLoc(this.vapor)
        this.marker.x = x - 2
        this.marker.y = y - 2
        if (updateSettings === true) this.moveLeaf(x,y)
    }
    
	update(trial) {
		this.temp = trial.temp
		this.vapor = trial.vapor
		this.plot(trial.temp,trial.vapor)
		this.moveMarker(false)
	}
}

class ATGraph extends Graph {
	constructor(stage) {
		super({
			stage: stage,
			w: 200,
			h: 200,
			xlabel: "Temperature(C)",
			ylabel: "Altitude(km)",
			xscale: "linear",
			yscale: "linear",
			minX: -20,
			maxX: 30,
			minY: 0,
			maxY: 5,
			majorX: 10,
			minorX: 5,
			majorY: 1,
			minorY: 0.5
		})
		this.temp = 20
		this.altitude = 0
		this.cloudbase = 0
	}
	
	update(trial) {
		this.plot(trial.temp,trial.altitude)
	}
}

class Mtn {
	constructor(stage, settings, finish) {
		this.stage = stage
		this.settings = settings
		this.finish = finish
		createjs.Sound.registerSound({id: "thunder", src:"assets/thunder.mp3"})
		createjs.Sound.registerSound({id: "wind", src:"assets/wind.mp3"})
		this.wind = null
		this.thunder = null
		this.mtn = new createjs.Bitmap("assets/mountain.png")
		this.leaf = new createjs.Bitmap("assets/leaf.gif")
		this.cloud = new createjs.Bitmap("assets/thundercloud.png")
		this.bolt = new createjs.Bitmap("assets/lightning.png")
		this.leaftween = null
		this.mtn.x = 0
		this.mtn.y = 0
		this.mtn.scaleX = 0.5
		this.mtn.scaleY = 0.5
		this.bolt.x = -100
		this.bolt.scaleX = 0.015
		this.bolt.scaleY = 0.015
		this.running = false
		this.lightning = false
		this.lighttick = 0
		this.path = [50,164, 74,152, 90,131, 112,122, 137,92, 151,64, 173,56, 204,70, 221,92, 224,105, 246,121, 268,141, 290,164]
		this.results = document.getElementById("results_table")
		this.trial = new Trial()
	}
	
	render() {
		this.stage.addChild(this.mtn)
		this.stage.addChild(this.leaf)
		this.stage.addChild(this.cloud)
		this.stage.addChild(this.bolt)
		this.leaf.x = 50
		this.leaf.y = 165
		this.cloud.x = -1000
		this.cloud.y = 0
		this.lastalt = 0
		this.cloud.scaleX = 0.1
		this.cloud.scaleY = 0.05
	}
	
	clear() {
		this.stage.removeAllChildren()
		this.render()
	}
	
	play() {
		this.temp = this.settings.getTemp()
		this.vapor = this.settings.getVapor()
		this.trial.init({
			temp: this.temp,
			vapor: this.vapor,
			humidity: humidity(this.temp,this.vapor),
			dewpoint: dewpoint(this.temp,this.vapor)		
		})
		this.factor = 10.0
		this.lastalt = 0
		this.leaftween = createjs.Tween.get(this.leaf).to({guide:{path:this.path}},8000)
		this.leaftween.call(() => {
			if (this.wind) this.wind.stop()
			this.running = false
			this.results.appendChild(this.trial.getRow())
			if (this.finish) this.finish()
		})
		this.running = true
		this.leaftween.play()
		this.playSound("wind")
	}
	
	pause(pause) { 
		this.leaftween.setPaused(pause) 
		if (this.wind) this.wind.paused = pause
		if (this.thunder) this.thunder.paused = pause
		this.running = !pause
	}
	
	playSound(sound) {
		if (!this.settings.mute.checked) {
			switch(sound) {
			case "wind":
				this.wind = createjs.Sound.play(sound,{loop: 2})
				break
			case "thunder":
				this.thunder = createjs.Sound.play(sound)
				break
			}
		}
	}
 	
	update(trial) {
		let oldA = trial.altitude, oldT = trial.temp
		trial.altitude = (165 - this.leaf.y)/165 * 5
		if (trial.altitude < 0) trial.altitude = 0
		trial.temp = Number(oldT - this.factor * (trial.altitude - oldA))
		trial.humidity = humidity(trial.temp,trial.vapor)
		trial.dewpoint = dewpoint(trial.temp,trial.vapor)
		let sat = saturation(trial.temp)
		if (trial.vapor > sat) {
			this.animateClouds()
			trial.vapor = sat
			trial.humidity = 100
			this.factor = 6.0
		}
		if (trial.temp > oldT) this.factor = 10.0;
	}
	
	animateClouds() {
		if (this.trial.cloudbase == 0) {
			this.trial.cloudbase = this.trial.altitude
			if (this.trial.temp <= 0 || this.trial.altitude < 1) {
				this.playSound("thunder")
				this.lighttick = 0
				this.lightning = true
			}
			this.cloud.x = this.leaf.x - 2
			this.cloud.y = this.leaf.y
			this.lasty = this.leaf.y
		}
		if ((this.trial.altitude - this.lastalt) > .1) {
			this.lastalt = this.trial.altitude
			this.cloud.scaleX += .021
			this.cloud.scaleY += .02
			this.cloud.y = this.leaf.y
		}
	}
	
	newTrial() {
		this.trial = new Trial()
	}
	
	tick(etgraph, atgraph) {
		if (this.running === true) {
			this.update(this.trial)
			etgraph.update(this.trial)
			atgraph.update(this.trial)
			if (this.lightning === true) {
				if (this.lighttick == 20) {
					this.bolt.x = this.leaf.x-30
					this.bolt.y = this.leaf.y+40
				} else if (this.lighttick == 25) {
					this.bolt.x = this.bolt.x + 20
				} else if (this.lighttick == 35) {
					this.bolt.x = -100
					this.lightning = false
				}
				this.lighttick++
			}
		}
	}
}

class MtnSim {
	constructor() {
		this.mainstage = new createjs.Stage("maincanvas")
		this.etstage = new createjs.Stage("etgraph")
		this.atstage = new createjs.Stage("atgraph")
		this.buttons = new Buttons()
		this.settings = new Settings()
		this.etgraph = new ETGraph(this.etstage,this.settings)
		this.atgraph = new ATGraph(this.atstage)
		this.mtn = new Mtn(this.mainstage, this.settings, () => {
			this.buttons.restart.disabled = false
			this.buttons.pause.disabled = true
		})
		this.pause = false
		this.buttons.addListener(e => {
			switch(e.target.id) {
			case "run":
				this.etgraph.showLeaf(false)
				this.enablePlay(false)
				this.buttons.pause.value = "Pause"
				this.pause = false
				this.mtn.play()
				break
			case "pause":
				this.pause = !this.pause
				this.mtn.pause(this.pause)
				e.target.value = this.pause? "Resume":"Pause"
				break
			case "restart":
				this.reset()
				this.mtn.clear()
				this.etgraph.clear()
				this.atgraph.clear()
				this.etgraph.render()
				this.atgraph.render()
				this.mtn.newTrial()
				break;
			}
		})
	}
		
	reset() {
		this.enablePlay(true)
		this.settings.setTemp(20.0)
		this.settings.setVapor(7.0)
		this.etgraph.showLeaf(true)
	}
	
	enablePlay(play) {
		this.buttons.run.disabled = !play
		this.buttons.pause.disabled = play
		this.buttons.restart.disabled = !play
	}
	
	render() {
		this.buttons.run.disabled = false
		this.buttons.mute.checked = false
		this.buttons.pause.disabled = true
		this.buttons.restart.disabled = true
		this.etgraph.render()
		this.atgraph.render()
		this.mtn.render()
		createjs.Ticker.addEventListener("tick", e => {
			this.mtn.tick(this.etgraph, this.atgraph)
			this.etstage.update()
			this.atstage.update()
			this.mainstage.update()
		})
	}
}

(new MtnSim()).render()
