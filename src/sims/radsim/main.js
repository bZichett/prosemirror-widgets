import {Graph} from "../utils"
 
createjs.MotionGuidePlugin.install()
createjs.Sound.registerPlugins([createjs.WebAudioPlugin, createjs.HTMLAudioPlugin, createjs.FlashAudioPlugin])
createjs.Ticker.frameRate = 30

const points = 17

const surface_times = ["sand-day","plowed-day","grass-day","snow-day","sand-night","plowed-night","grass-night","snow-night"]
                      
function getData() {
	return {
		"pressure": [1000,990,980,970,960,950,940,930,920,910,900,890,880,870,860,850,840],
		"altitude": [0,80.9705308,162.852307,245.694059,329.485335,414.246019,499.996631,586.758344,674.4897,763.115875,852.640464,942.952656,1034.00407,1125.84507,1218.44313,1311.81595,1405.99922 ],
		"sand-day": [285,284.2,283.4,282.5,281.7,280.9,280,279.2,278.3,277.4,276.5,275.5,274.8,274,273,272.2,271.3],
		"plowed-day": [283,282.2,281.4,280.5,279.7,278.9,278,277.2,277,276.8,276.5,275.5,274.8,274,273,272.2,271.3],
		"grass-day": [281,280.2,279.4,278.6,277.7,276.9,276.8,277.2,277,276.8,276.5,275.5,274.8,274,273,272.2,271.3],
		"snow-day": [273,273.2,273.4,273.7,274.6,275.9,276.8,277.2,277,276.8,276.5,275.5,274.8,274,273,272.2,271.3],
		"sand-night": [278.4,278.5,278.7,278.8,279.5,280.1,280,279.2,278.3,277.4,276.5,275.2,274.8,274,273,272.2,271.3],
		"plowed-night": [276.4,276.5,276.7,276.8,277.5,278.1,278,277.5,278.1,278,276.8,276.5,275.2,274.8,274,273,271.2,271.3],
		"grass-night": [274.4,274.5,274.7,274.9,275.5,276.1,276.8,277.2,277,276.8,276.5,275.2,274.8,274,273,272.2,271.3],
		"snow-night": [268,270,271.8,273.2,274.6,275.9,276.8,277.2,277,276.8,276.5,275.5,274.8,274,273,272.2,271.3]
	}
}

function toFahrenheit(kelvin) {
	return (kelvin - 273.15) * 9 / 5 + 32
}

function toCentigrade(kelvin) {
	return (kelvin - 273.15)
}

class Image {
	constructor(prefix) {
		this.day = new createjs.Bitmap(prefix+".jpg")
		this.day.x = -1000
		this.day.y = 0
		this.night = new createjs.Bitmap(prefix+"-night.jpg")
		this.night.x = -1000
		this.night.y = 0
	}
	
	show(time) {
		if (time == "day")
			this.day.x = 0 
		else
			this.night.x = 0
	}
	
	hide() { 
		this.day.x = this.night.x = -1000
	}
}

class Settings {
	constructor() {
		this.setValue(document.querySelector('input[name="choice"]:checked').value)
		this.listener = null
		let radios = document.querySelectorAll('input[name="choice"]')
		for (let i = 0; i < radios.length; i++) {
			radios[i].addEventListener("change", e => {
				this.setValue(e.target.value)
				if (this.listener) this.listener(this.surface,this.time)
			})
		}
	}
	
	setValue(value) {
		this.value = value
		let v = value.split("-")
		this.surface = v[0]
		this.time = v[1]
		let radios = document.querySelectorAll('input[name="choice"]')
  		for (let i = 0; i < radios.length; i++) {
			let radio = radios[i]
			if (radio.value == value) radio.checked = true
		}
	}
 	
	getValue() { return this.value }
	
	getSurface() { return this.surface }

	getTime() { return this.time }

	addListener(listener) { this.listener = listener }
}

class Buttons {
	constructor() {
		this.plot = document.getElementById("plot")
		this.clearLast = document.getElementById("clearLast")
		this.clearAll = document.getElementById("clearAll")
		this.plot.disabled = false
		this.clearLast.disabled = false
		this.clearAll.disabled = false
	}
	
	addListener(listener) { 
		this.plot.addEventListener("click", e => listener(e))
		this.clearLast.addEventListener("click", e => listener(e))
		this.clearAll.addEventListener("click", e => listener(e))
	}
}

class ATGraph extends Graph {
	constructor(stage) {
		super({
			stage: stage,
			w: 200,
			h: 200,
			xlabel: "Temperature(C)",
			ylabel: "Z(km)",
			xscale: "linear",
			yscale: "linear",
			minX: -8,
			maxX: 12,
			minY: 0,
			maxY: 1.5,
			majorX: 2,
			minorX: 1,
			majorY: 0.1,
			minorY: 0.05,
			precisionY : 1
		})
	}
	
	render() {
		super.render()
		this.color = "#EEE"
		this.dotted = false
		for (let t = -8; t < 14; t += 2) {
            let x = this.xaxis.getLoc(t)
            let y = this.yaxis.getLoc(0)
			this.drawLine(x,y,x,this.yaxis.getLoc(1.5))
		}
	}
}

class Rad {
	constructor(stage, settings, atgraph) {
		this.stage = stage
		this.settings = settings
		this.atgraph = atgraph
		this.images = [
		    new Image("assets/desert"),
		    new Image("assets/plowed"),
		    new Image("assets/grass"),
		    new Image("assets/snow")
		]
		this.lastImage = this.images[0]
		this.surfaces = ["sand","plowed","grass","snow"]
		this.colors = {sand:"#8A4117",plowed: "#A52A2A", grass: "#667C26", snow: "#0000FF"}
		this.plotted = {
			"sand-day":[],"sand-night":[],"plowed-day": [], "plowed-night":[],
			"grass-day":[],"grass-night":[],"snow-day": [], "snow-night":[]
		}
		this.clearProfiles()
		this.profiles = []
		              
		this.balloon = new createjs.Bitmap("assets/balloon.png")
		this.balloon.x = 150
		this.balloon.y = 150
		this.balloon.scaleX = 0.15
		this.balloon.scaleY = 0.15
		this.data = getData()
		this.sun = new createjs.Shape().set({x:320,y:20})
		this.sun.graphics.beginFill("#FFFF00").drawCircle(0,0,10)
		this.moon = new createjs.Shape().set({x:320,y:20})
		this.moon.graphics.beginFill("#FFFFFF").drawCircle(0,0,10)
		this.settings.addListener((s,t) => this.changeSetting(s,t))
		createjs.Touch.enable(this.stage)
		this.balloon.addEventListener("pressmove", e => {
		    e.target.x = 150
		    e.target.y = e.stageY
		})
		this.changeSetting(this.settings.getSurface(),this.settings.getTime())
	}
	
	render() {
		this.addChildren()
		this.balloon.y = 150
	}
	
	addChildren() {
		this.images.forEach(img => {
			this.stage.addChild(img.day)
			this.stage.addChild(img.night)
		})
		this.stage.addChild(this.balloon)
		this.stage.addChild(this.sun)
		this.stage.addChild(this.moon)
	}
	
	clearProfiles() {
		surface_times.forEach(st => this.clearProfile(st))
		this.profiles = []
	}
	
	clearProfile(st) {
		this.plotted[st] = []
		for (let i = 0; i < points; i++) this.plotted[st].push(false)
	}
	
	hasPlots(st) {
		for (let i = 0; i < points; i++) if(this.plotted[st][i]) return true
		return false
	}
	
	changeSetting(surface,time) {
		this.lastImage.hide()
		this.lastImage = this.images[this.surfaces.indexOf(surface)]		                             
		this.lastImage.show(time)
		this.showTime()
		this.atgraph.setColor(this.colors[surface])
		this.atgraph.setDotted(time == "night")
		this.balloon.y = 150
		this.profiles.push(surface+"-"+time)
	}
	
	showTime() {
		let path = [320,20, 300,20, 280,20]
		if (this.settings.getTime() == "day") {
			this.moon.x = 320
			createjs.Tween.get(this.sun).to({guide:{path:path}},500).play()
		} else {
			this.sun.x = 320
			createjs.Tween.get(this.moon).to({guide:{path:path}},500).play()
		}
	}

	plot() {
		let alt = 1500.0 * (150-(this.balloon.y+10))/150
		let i = 0
		while(alt > this.data.altitude[i]) i++
		this.plotted[this.settings.getValue()][i] = true
		this.plotProfiles()
	}
	
	plotProfiles() {
		this.atgraph.clear()
		this.atgraph.render()
		surface_times.forEach(st => {
			let v = st.split("-")
			this.atgraph.setColor(this.colors[v[0]])
			this.atgraph.setDotted(v[1] == "night")
			let alts = this.data.altitude
			let temps = this.data[st]
			for(let i = 0; i < points; i++) {
				if (this.plotted[st][i] === true) {
					this.atgraph.plot(toCentigrade(temps[i]),alts[i]/1000.0)
				}
			}
		})
	}
	
	clear() {
		this.stage.removeAllChildren()
		this.clearProfiles()
		this.render()
	}
	
	clearLast() {
		this.balloon.y = 150
		if (!this.profiles.length) return
		let st = this.profiles[this.profiles.length-1]
		if (!this.hasPlots(st)) {
			this.profiles.pop()
			st = this.profiles[this.profiles.length-1]
			this.settings.setValue(st)
			this.atgraph.setColor(this.settings.getSurface())
			this.atgraph.setDotted(this.settings.getTime() == "night")
		}
		this.clearProfile(st)
		this.plotProfiles()
	}
	
	clearAll() {
		this.clearProfiles()
		this.plotProfiles()
		this.balloon.y = 150
	}
}

class RadSim {
	constructor() {
		this.mainstage = new createjs.Stage("maincanvas")
		this.atstage = new createjs.Stage("atgraph")
		this.buttons = new Buttons()
		this.settings = new Settings()
		this.atgraph = new ATGraph(this.atstage)
		this.rad = new Rad(this.mainstage, this.settings, this.atgraph)
		this.rad.render()
		this.buttons.addListener(e => {
			switch(e.target.id) {
			case "plot":
				this.rad.plot()
				break
			case "clearLast":
				this.rad.clearLast()
				break;
			case "clearAll":
				this.rad.clearAll()
				break;
			}
		})
	}
		
	render() {
		this.atgraph.render()
		this.rad.render()
		createjs.Ticker.addEventListener("tick", e => {
			this.atstage.update()
			this.mainstage.update()
		})
	}
}

(new RadSim()).render()
