let Random = require("prosemirror/node_modules/random-js")
createjs.MotionGuidePlugin.install()

const maxAtoms = 100, initialSpeed = 2, framerate = 60

createjs.Ticker.framerate = framerate


let waterMolecules = 2

let random = new Random(Random.engines.mt19937().autoSeed())

let water_level = 120

function toRadians(degree) { return degree * (Math.PI / 180)}

function randomBetween(min,max) { return random.integer(min,max)}

function dotProduct(ax, ay, bx, by) {
    return ax * bx + ay * by
}

class Particle {
	constructor(burner,r,color) {
		this.burner = burner
	    this.r = r
	    this.mass = this.r * this.r
		this.dot = 	new createjs.Shape()
		this.dot.graphics.beginStroke("#000").beginFill(color).setStrokeStyle(1).drawCircle(0,0,r).endStroke()
	}

	place(vapor) {
		let ty = vapor?120:randomBetween(0,water_level)
		this.x = randomBetween(182-ty/2,218+ty/2)
		this.y = ty + 120
		this.dx = initialSpeed * (random.real(0,1) - 0.5) / this.r
		if (vapor) {
			this.dy = -.5
		} else 
			this.dy = initialSpeed * (random.real(0,1) - 0.5) / this.r
		this.bounce()
	}

	move() {
	    this.x += this.dx
	    this.y += this.dy
	    this.dot.x = this.x
	    this.dot.y = this.y
	}

	bounce() {
		let dx = (this.y-120)/2
		if (this.x <= (186-dx)) {
			this.x = 186-dx
			if (this.dx)
				this.dx *= -1
			else
				this.dx = .2
		} else if (this.x >= (214+dx)) {
			this.x = 214+dx
			if (this.dx)
				this.dx *= -1
			else
				this.dx = -.2
		}
		if (this.y <= 122) {
			this.y = 122
			if (this.dy)
				this.dy *= -1
			else
				this.dy = .2
		} else if (this.y >= 236) {
			this.y = 236
			if (this.dy)
				this.dy *= -1
			else
				this.dy = -.2
			if (this.burner.isOn()) {
				this.dx += this.dx > 0?.1:-.1
				this.dy -= .1
			}
			// randomly absorb molecule and return
			if (this.r == 2 && random.real(0,1) > .5)
				this.x = randomBetween(122,278)
		}
	}

	collide(that) {
	    let dx = this.x - that.x
	    let dy = this.y - that.y
	    let dr = this.r + that.r
	    let d = dx * dx + dy * dy	    
	    if (d >= dr * dr) return
        // Particles collide
        let collisionDist = Math.sqrt(d + 0.1)
        
        // Find unit vector in direction of collision
        let collisionVi = dx / collisionDist
        let collisionVj = dy / collisionDist
        
        // Find velocity of particle projected on to collision vector
        let collisionV1 = dotProduct(this.dx, this.dy, dx, dy) / collisionDist
        let collisionV2 = dotProduct(that.dx, that.dy, dx, dy) / collisionDist
        
        // Find velocity of particle perpendicular to collision vector
        let perpV1 = dotProduct(this.dx, this.dy, -dy, dx) / collisionDist
        let perpV2 = dotProduct(that.dx, that.dy, -dy, dx) / collisionDist
        
        // Find movement in direction of collision
        let sumMass = this.mass + that.mass
        let diffMass = this.mass - that.mass
        let v1p = (diffMass * collisionV1 + 2 * that.mass * collisionV2) / sumMass
        let v2p = (2 * this.mass * collisionV1 - diffMass * collisionV2) / sumMass
        
        // Update velocities
        this.dx = v1p * collisionVi - perpV1 * collisionVj
        this.dy = v1p * collisionVj + perpV1 * collisionVi
        that.dx = v2p * collisionVi - perpV2 * collisionVj
        that.dy = v2p * collisionVj + perpV2 * collisionVi
        
        // Move to avoid overlap
        let overlap = dr + 1 - collisionDist
        let p1 = overlap * that.mass / sumMass
        let p2 = overlap * this.mass / sumMass
        this.x += collisionVi * p1
        this.y += collisionVj * p1
        that.x -= collisionVi * p2
        that.y -= collisionVj * p2
	}
}
 
class Thermometer {
	constructor(stage,x,y) {
		this.tube = new createjs.Shape()
		this.tube.graphics.beginStroke("#000").beginFill("#FFF").drawRect(x,y,6,100).endStroke()
		this.bulb = new createjs.Shape()
		this.bulb.graphics.beginStroke("#000").beginFill("#F00").drawCircle(x+3,y+105,8).endStroke()
		this.fluid = new createjs.Shape()
		this.fluid.graphics.beginStroke("#000").beginFill("#F00").drawRect(x+1,y+50,4,50).endStroke()
		this.fluid.setBounds(x+1,y+50,4,50)
		stage.addChild(this.tube)
		stage.addChild(this.bulb)
		stage.addChild(this.fluid)
	}
	
	heat() {
		let r = this.fluid.getBounds()
		this.fluid.graphics.clear().beginStroke("#000").beginFill("#F00").drawRect(r.x,r.y-1,r.width,r.height+1).endStroke()
		this.fluid.setBounds(r.x,r.y-1,r.width,r.height+1)
	}
}

class Gauge {
	constructor(stage,x,y) {
		this.angle = toRadians(270)
		this.x = x
		this.y = y
		this.face = new createjs.Shape()
		this.face.graphics.beginStroke("#000").beginFill("#FFF").drawCircle(x,y,15).endStroke()
		this.tube = new createjs.Shape()
		this.tube.graphics.beginStroke("#000").drawRect(x-5,y,6,80).endStroke()
		this.arrow = new createjs.Shape()
		this.arrow.graphics.beginStroke("#080").setStrokeStyle(2).moveTo(this.x,this.y).lineTo(this.x,this.y-15).endStroke()
		stage.addChild(this.tube)
		stage.addChild(this.face)
		stage.addChild(this.arrow)
	}
	
	heat() {
		this.angle += .1
		let x = this.x + 15*Math.cos(this.angle)
		let y = this.y + 15*Math.sin(this.angle)
		this.arrow.graphics.clear().beginStroke("#080").setStrokeStyle(2).moveTo(this.x,this.y).lineTo(x,y).endStroke()
	}
	
	lower() {
		this.angle -= .1
		let x = this.x + 15*Math.cos(this.angle)
		let y = this.y + 15*Math.sin(this.angle)
		this.arrow.graphics.clear().beginStroke("#080").setStrokeStyle(2).moveTo(this.x,this.y).lineTo(x,y).endStroke()
	}
}

class Beaker {
	constructor(stage,burner,x,y) {
		this.stage = stage
		this.burner = burner
		this.beaker = new createjs.Shape()
		this.beaker.graphics.ss(1).beginStroke("#000").beginFill("#87CEFA").mt(x-20,y).lt(x-20,y+20).arcTo(x-100,y+200,x,y+200,10).lt(x+50,y+200).arcTo(x+100,y+200,x+20,y+20,10).lt(x+20,y+20).lt(x+20,y).endStroke()
		this.beaker.alpha = 0.6
		this.water = new createjs.Shape()
		this.water.graphics.ss(1).beginFill("#87CEFA").mt(x-73,y+140).lt(x-80,y+160).arcTo(x-100,y+200,x,y+200,10).lt(x+50,y+200).arcTo(x+100,y+200,x+20,y+20,10).lt(x+73,y+140).endStroke()
		this.stopper = new createjs.Shape()
		this.stopper.graphics.beginFill("#008").drawRect(x-18,y-5,36,22).endStroke()
		stage.addChild(this.stopper)
		stage.addChild(this.beaker)
		stage.addChild(this.water)
		this.particles = []
	}
	
	addParticle(r,color,vapor) {
		let particle = new Particle(this.burner,r,color)
		particle.place(vapor)
		this.particles.push(particle)
		this.stage.addChild(particle.dot)
	}
	
	populate() {
		for (let i = 0; i < maxAtoms; i++) this.addParticle(1,"#000",false)
		for (let i = 0; i < waterMolecules; i++) this.addParticle(2,"#FFF",false)
	}
	
	update() {
        for (let i = 0; i < maxAtoms+waterMolecules; i++) {
            for (let j = i + 1; j < maxAtoms+waterMolecules; j++) this.particles[i].collide(this.particles[j]);
        }
		this.particles.forEach(p => { p.move(); p.bounce() })
	}
	
	heat() {
		this.addParticle(2,"#FFF",true)
		waterMolecules++
	}
}

class Bunsen {
	constructor(stage,x,y) {
		this.bunsen = new createjs.Bitmap("assets/bunsen.png")
		this.bunsen.x = x
		this.bunsen.y = y
		this.bunsen.scaleX = .3
		this.bunsen.scaleY = .15
		this.flamecover = new createjs.Shape()
		this.flamecover.graphics.beginFill("#FFF").drawRect(x,y,100,35).endStroke()
		stage.addChild(this.bunsen)
		stage.addChild(this.flamecover)
	}
	
	toggle() {
		this.flamecover.alpha = this.flamecover.alpha?0:1
	}
	
	isOn() {
		return this.flamecover.alpha == 0
	}
}

class Buttons {
	constructor(listener) {
		this.run = document.getElementById("run")
		this.burner = document.getElementById("burner")
		this.reset = document.getElementById("reset")
		this.run.addEventListener("click",() => listener.press("run"))
		this.burner.addEventListener("click",() => listener.press("burner"))
		this.reset.addEventListener("click",() => listener.press("reset"))
	}
	
	disableBurner(value) {
		this.burner.disabled = value
	}
}

class VaporSim {
	constructor() {
		this.mainstage = new createjs.Stage("maincanvas")
		this.buttons = new Buttons(this) 
		this.running = false
	}	
	render() {
		this.gauge = new Gauge(this.mainstage,210,70)
		this.thermometer = new Thermometer(this.mainstage,190,30)
		this.bunsen = new Bunsen(this.mainstage,150,302)
		this.beaker = new Beaker(this.mainstage,this.bunsen,200,100)
		this.beaker.populate()
		this.beaker.update()
		this.mainstage.update()
	}
	
	run() {
		this.render()
		let tick = 0
		createjs.Ticker.addEventListener("tick", e => {
			if (!this.running) return
			this.beaker.update()
			this.mainstage.update()
			if (this.bunsen.isOn()) {
				tick++
				if (tick % framerate == 0) this.heat()
			} else
				tick = 0
		})
	}
	
	reset() {
		waterMolecules = 2
		this.running = false
		this.mainstage.removeAllChildren()
		this.render()
		this.buttons.disableBurner(true)
	}
	
	heat() {
		this.beaker.heat()
		this.thermometer.heat()
		this.gauge.heat()
	}
	
	press(cmd) {
		if (cmd == "run") { 
			this.running = true
			this.buttons.disableBurner(false)
		}
		if (cmd == "burner") {
			this.bunsen.toggle()
			if (!this.bunsen.isOn()) this.gauge.lower()
		}
		
		if (cmd == "reset") this.reset()
	}
}

(new VaporSim()).run()
