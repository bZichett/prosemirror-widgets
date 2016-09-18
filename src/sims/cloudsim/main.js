import {getStore} from "../utils"
import {Url} from "url"

createjs.MotionGuidePlugin.install()


let store = getStore(), CLOUDS = "clouds"
let init_clouds = [
	"altocumulus","altostratus","cirrocumulus","cirrostratus","cumulus",
	"stratocumulus","stratus","cirrus","nimbostratus","nimbostratus",
	"cumulonimbus","cumulonimbus","cumulonimbus","blank","blank"
]
let cloud_images = []
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
	store.set(CLOUDS,clouds)
}

function removeClouds() {
	store.remove(CLOUDS)
}

class Cloud {
	constructor(stage,name,x,y) {
		this.bitmap = new createjs.Bitmap("assets/"+name+".png")
		this.bitmap.x = x
		this.bitmap.y = y
		this.bitmap.scaleX = 0.5
		this.bitmap.scaleY = 0.5
		this.bitmap.image.alt = name
		this.bitmap.cursor = "pointer"
		this.bitmap.on("pressmove", e => {
		    e.target.x = e.stageX
		    e.target.y = e.stageY
		    e.target.cursor = "grabbing"
		    stage.setChildIndex( this.bitmap, stage.getNumChildren()-1)
		});
		this.bitmap.on("pressup", e => {
		    e.target.cursor = "pointer"
		})
	}
}

class Grid {
	constructor(stage,xorg,yorg) {
		for (let y = yorg; y <= yorg+306; y += 102) {
			let horz = new createjs.Shape()
			horz.graphics.beginStroke("#000").moveTo(xorg,y).lineTo(xorg+510,y).endStroke()
			stage.addChild(horz)
			for (let x = xorg; x <= xorg+510; x += 102) {
				let vert = new createjs.Shape()
				vert.graphics.beginStroke("#000").moveTo(x,yorg).lineTo(x,yorg+306).endStroke()
				stage.addChild(vert)
			}
		}
		// show labels
		// show clouds
		let x = xorg + 1
		let y = yorg + 1
		init_clouds.forEach(name => {
			let cloud = new Cloud(stage,name,x,y)
			stage.addChild(cloud.bitmap)
			x+= 102
			if (x > (xorg+510)) {
				x = xorg + 1
				y += 102
			}
		})
	}
}

class CloudSim {
	constructor() {
		this.mainstage = new createjs.Stage("maincanvas")
		createjs.Touch.enable(this.mainstage)
		this.mainstage.enableMouseOver()
		this.grid = new Grid(this.mainstage,50,50)
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

(new CloudSim()).run()