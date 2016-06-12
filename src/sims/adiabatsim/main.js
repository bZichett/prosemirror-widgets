let Random = require("prosemirror/node_modules/random-js")
createjs.MotionGuidePlugin.install()

initialSpeed = 2, framerate = 60

let random = new Random(Random.engines.mt19937().autoSeed())

function toRadians(degree) { return degree * (Math.PI / 180)}

function randomBetween(min,max) { return random.integer(min,max)}

function dotProduct(ax, ay, bx, by) { return ax * bx + ay * by }

class Particle {
	constructor(container) {
	    this.r = 1
	    this.mass = 1
		this.dot = 	new createjs.Shape()
		this.dot.graphics.beginStroke("#666").beginFill("#FFF").setStrokeStyle(1).drawCircle(0,0,r).endStroke()
		this.container = container
	}

/*	place() {
		let ty = vapor? 118: randomBetween(0,water_level)
		this.x = randomBetween(190-ty/2,210+ty/2)
		this.y = ty + 120
		this.dx = initialSpeed * (random.real(0,1) - 0.5) / this.r
		this.dy = initialSpeed * (random.real(0,1) - 0.5) / this.r
		this.bounce()
		this.move()
	}
*/
	move() {
	    this.x += this.dx
	    this.y += this.dy
	    this.dot.x = this.x
	    this.dot.y = this.y
	}

	bounce() {
		if (container.bounce(p))
			this.collide(container)
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

class Container {
	constructor(stage, maxAtoms) {
		this.x = 0
		this.y = 0
		this.dx = 0
		this.dy = 0
		this.r = 1
		this.mass = 1000000
		this.stage = stage
		this.particles = []
	}
	
	addParticle() {
		let p = new Particle(this)
		this.place(p)
		this.particles.push(p)
		this.stage.addChild(p.dot)
		return p
	}
	
	populate() {
		for (let i = 0; i < maxAtoms; i++) this.addParticle()
	}
	
	update() {
        for (let i = 0; i < this.particles.length; i++) {
        	let p = this.particles[i]
        	for (let j = i + 1; j < this.particles.length; j++) p.collide(particles[j])
        }
		this.particles.forEach(p => { p.move(); p.bounce() })
	}
}

class Parcel extends Container {
	constructor(stage,circle) {
		super(stage, 20)
		this.circle = circle
		this.populate()
	}
	
	move(dx,dy) {
		this.circle.x += dx
		this.circle.y += dy
	}
	
	expand(dr) {
		this.circle.r += dr
	}
	
	bounce(p) {
		let dx = p.x-circle.x
		let dy = p.y-circle.y
		let dr = Math.sqrt(dx*dx + dy*dy)
		if (p.container == this && dr >= circle.r)
			return true
		else 
			return dr <= circle.dr
	}
	
	place(p) {
		p.x = randomBetween(circle.x-circle.r+1,circle.x+circle.r-1)
		p.y = randomBetween(circle.y-circle.r+1,circle.y+circle.r-1)
	}
}

class Atmosphere extends Container {
	constructor(stage,rect) {
		super(stage,40)
		this.rect = rect
		this.parcel = new Parcel(stage,new Graphics.Circle(x,y,r))
		this.particles.push(this.parcel)
		this.populate()
	}
	
	bounce(p) {
		if (p.x < rect.x || p.x > rect.x + rect.width)
			p.dx *= -1
		if (p.y < rect.y || p.y > rect.y + rect.height)
			p.dy *= -1
	}
	
	place(p) {
		// regen if in parcel
		p.x = randomBetween(rect.x+1,rect.x+rect.width-1)
		p.y = randomBetween(rect.y+1,rect.y+rect.height-1)
	}
}

}
class Buttons {
	constructor(listener) {
		this.run = document.getElementById("run")
		this.reset = document.getElementById("reset")
		this.run.addEventListener("click",() => listener.press("run"))
		this.reset.addEventListener("click",() => listener.press("reset"))
	}
}

class AdiabatSim {
	constructor() {
		this.mainstage = new createjs.Stage("maincanvas")
		this.buttons = new Buttons(this) 
		this.running = false
	}	
	render() {
		this.atmosphere = new Atmosphere(this.mainstage)
	}
	
	run() {
		this.render()
		createjs.Ticker.framerate = framerate
		let tick = 0
		createjs.Ticker.addEventListener("tick", e => {
			this.mainstage.update()
			if (!this.running) return
			if (tick % framerate == 0) {
			}
			tick++
		})
	}
	
	reset() {
		this.running = false
		this.mainstage.removeAllChildren()
		this.render()
	}
	
	press(cmd) {
		if (cmd == "run") { 
			this.running = true
		}
		if (cmd == "reset") this.reset()
	}
}

(new AdiabatSim()).run()
