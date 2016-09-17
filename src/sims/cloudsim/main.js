import {getStore} from "../utils"
import {Url} from "url"

createjs.MotionGuidePlugin.install()


let store = getStore(), CLOUDS = "clouds"
let init_clouds = [
	"altocumulus","altostratus","cirrocumulus","cirrostratus","cumulus",
	"stratocumulus","stratus","cirrus","nimbostratus","nimbostratus",
	"cumulonimbus","cumulonimbus","cumulonimbus",null,null
]
let forms = ["streaks","sheets","heaps","rain"]

function getClouds() {
	let clouds = store.get(CLOUDS)
	if (!clouds) {
		clouds = init_clouds
		store.set(CLOUDS,clouds)
	}
	return clouds
}

function replaceClouds(clouds) {
	let clouds = getSymbols()
	store.set(CLOUDS,clouds)
}

function removeClouds() {
	store.remove(CLOUDS)
}

class Cloud {
	constructor(prefix,x,y) {
		this.bitmap = new createjs.Bitmap("assets/"+name+".png")
		this.bitmap.image.alt = name
	}
}

class Grid {
	constructor(stage,xorg,yorg) {
		for (let y = yorg; y <= 800+yorg; y += 200) {
			let horz = new createjs.Shape()
			horz.graphics.beginStroke().moveTo(xorg,y).lineTo(xorg+1000,y).endStroke()
			for (let x = xorg; x <= xorg+1000; x += 200) {
				let vert = new createjs.Shape()
				vert.graphics.beginStroke().moveTo(x,yorg).lineTo(x,yorg+800).endStroke()
			}
		}
		// show labels
	}
}

class CloudSim {
	constructor() {
		this.mainstage = new createjs.Stage("maincanvas")
		createjs.Touch.enable(this.mainstage)
		this.grid = new Grid()
		// handle download
		let dl = document.getElementById("download")
		dl.addEventListener("click", e => {
			let dt = this.mainstage.canvas.toDataURL('image/png')
			/* Change MIME type to trick the browser to downlaod the file instead of displaying it */
			dt = dt.replace(/^data:image\/[^;]*/, 'data:application/octet-stream');
			/* In addition to <a>'s "download" attribute, you can define HTTP-style headers */
			dt = dt.replace(/^data:application\/octet-stream/, 'data:application/octet-stream;headers=Content-Disposition%3A%20attachment%3B%20filename=map.png');
			dl.href = dt;
		})
	}
	
	run() {
		let tick = 0
		createjs.Ticker.addEventListener("tick", e => {
			this.mainstage.update()
			tick++
		})
	}
}

let cloudsim = new CloudSim()
cloudsim.run()