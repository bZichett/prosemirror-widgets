import {getStore} from "../utils"
import {Url} from "url"

createjs.MotionGuidePlugin.install()


let store = getStore(), CLOUDS = "clouds"
let init_clouds = [
	"altocumulus","cumulonimbus","cirrocumulus","nimbostratus","cumulus",
	"cumulonimbus","stratus","nimbostratus","cirrus","cirrostratus",
	"stratocumulus","altostratus","cumulonimbus","blank","blank"
]
let clouds = []
let forms = ["streaks","sheets","heaps","rain","rain"]

function getClouds() {
	let clouds = store.get(CLOUDS)
	if (!clouds) {
		clouds = init_clouds
		store.set(CLOUDS,clouds)
	}
	return clouds
}

function updateClouds() {
	// sort clouds by y location (reversed) and x
	let map = []
	clouds.forEach(c => {
		map = map.concat({name:c.name,x:c.x,y:c.y})
	})
	map.sort(function compare(a,b) {
		// y is in reverse order
		if (a.y > b.y) return 1
		else if (a.y < b.y) return -1
		if (a.x > b.x) return 1
		else if (a.x < b.x) return -1
		return 0
	})
	let newclouds = []
	map.forEach(c => { newclouds = newclouds.concat(c.name) })
	store.set(CLOUDS,newclouds)
}

function removeClouds() {
	store.remove(CLOUDS)
}

class Cloud {
	constructor(stage,name,x,y) {
		let cloud = new createjs.Container()
		cloud.x = x
		cloud.y = y
		cloud.cursor = "grab"
		cloud.name = name
		let bmap = new createjs.Bitmap("assets/"+name+".png")
		bmap.scaleX = 0.5
		bmap.scaleY = 0.5
		let txt = new createjs.Text(name,"12px Arial","#FFF")
		txt.x = 15
		txt.y = 85
		cloud.addChild(bmap)
		cloud.addChild(txt)
		let ofx = 0, ofy = 0, orgx = 0, orgy = 0
		bmap.addEventListener("mousedown", e => {
		    ofx = cloud.x - e.stageX
		    ofy = cloud.y - e.stageY
		    orgx = cloud.x
		    orgy = cloud.y
		    cloud.cursor = "grabbing"
		    stage.setChildIndex( cloud, stage.getNumChildren()-1)
		});
		bmap.addEventListener("pressmove", e => {
		    cloud.x = e.stageX + ofx
		    cloud.y = e.stageY + ofy
		});
		bmap.addEventListener("pressup", e => {
		    cloud.cursor = "grab"
		    let dropped = null
		    clouds.forEach(c => {
		    	let r = new createjs.Rectangle(c.x,c.y,100,100)
		    	if (r.contains(e.stageX,e.stageY) && c.name != cloud.name) dropped = c
		    })
		    if (dropped) {
		    	// swap clouds
		    	let dx = dropped.x, dy = dropped.y
		    	dropped.x = orgx
		    	dropped.y = orgy
		    	cloud.x = dx
		    	cloud.y = dy
		    	updateClouds()
		    } else {
		    	cloud.x = orgx
		    	cloud.y = orgy
		    }
		})
		return cloud
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
		for (let i = 1 ; i <= 3; i++) {
			let level = new createjs.Text("Level "+(4-i),"12px Arial","#00F")
			level.x = 5
			level.y = yorg + 50 + 100*(i-1)
			stage.addChild(level)
		}
		let fx = xorg + 40
		forms.forEach(name => {
			let form = new createjs.Text(name,"12px Arial","#00F")
			form.x = fx
			form.y = yorg - 15
			fx += 100
			stage.addChild(form)
		})
		this.showClouds(stage,xorg,yorg)
	}
	
	showClouds(stage,xorg,yorg) {
		let x = xorg + 1
		let y = yorg + 1
		getClouds().forEach(name => {
			let c = new Cloud(stage,name,x,y)
			clouds = clouds.concat(c)
			stage.addChild(c)
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
		let inst = document.getElementById("instruct")
		inst.innerHTML = "Rearrange the clouds by dragging and dropping to the correct level and form.<br/>" +
			"Clouds with multiple copies should be placed in a rain column at the correct levels."
		let reset = document.getElementById("reset")
		reset.addEventListener("click", e => {
			removeClouds()
			clouds.forEach(c => this.mainstage.removeChild(c))
			this.grid.showClouds(this.mainstage,50,50)
		})
		let dl = document.getElementById("download")
		dl.addEventListener("click", e => {
			let dt = this.mainstage.canvas.toDataURL('image/png')
			/* Change MIME type to trick the browser to downlaod the file instead of displaying it */
			dt = dt.replace(/^data:image\/[^;]*/, 'data:application/octet-stream')
			/* In addition to <a>'s "download" attribute, you can define HTTP-style headers */
			dt = dt.replace(/^data:application\/octet-stream/, 'data:application/octet-stream;headers=Content-Disposition%3A%20attachment%3B%20filename=clouds.png');
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