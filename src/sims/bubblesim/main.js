let Random = require("prosemirror/node_modules/random-js")
createjs.MotionGuidePlugin.install()

const initialSpeed = 2, framerate = 30, startr = 20, maxAtmos = 500, maxParcel = 5, maxVelComp = 3.5, randAccel = 0.2

let random = new Random(Random.engines.mt19937().autoSeed())

function toRadians(degree) { return degree * (Math.PI / 180)}

function randomBetween(min,max) { return random.integer(min,max)}

function dotProduct(ax, ay, bx, by) { return ax * bx + ay * by }

class Particle {
	constructor(container) {
		this.container = container
		this.x = 0
		this.y = 0
	    this.r = 1
	    this.mass = 1
		this.dx = initialSpeed * (random.real(0,1) - 0.5) / this.r
		this.dy = initialSpeed * (random.real(0,1) - 0.5) / this.r
		this.dot = 	new createjs.Shape()
		this.dot.graphics.beginStroke("#000").setStrokeStyle(1).drawCircle(0,0,this.r).endStroke()
	}

	place(x,y) {
		this.x = x
		this.y = y
		this.dot.x = x
		this.dot.y = y
	}
	
	move() { this.place(this.x+this.dx,this.y+this.dy)}

	resize(r) {
		this.r = r
		this.dot.graphics.clear().beginStroke("#000").setStrokeStyle(1).drawCircle(0,0,this.r).endStroke()
	}
	
	bounce() { if (this.container.bounce(this)) this.collide(this.container)}

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
		this.stage = stage
		this.maxAtoms = maxAtoms
		this.particles = []
	}
	
	density() { return this.maxAtoms/this.area() }
	
	addParticle() {
		let p = new Particle(this)
		this.place(p)
		this.particles.push(p)
		this.stage.addChild(p.dot)
		return p
	}
	
	populate() {
		for (let i = 0; i < this.maxAtoms; i++) this.addParticle()
	}
	
	update() {
        for (let i = 0; i < this.particles.length; i++) {
        	let p = this.particles[i]
        	for (let j = i + 1; j < this.particles.length; j++) p.collide(this.particles[j])
        }
		this.particles.forEach(p => { p.move(); p.bounce() })
	}
}

class Parcel extends Container {
	constructor(stage,x,y,r) {
		super(stage, maxParcel)
		this.surrogate = new Particle(this)
		this.surrogate.place(x,y)
		this.surrogate.resize(r)
		this.surrogate.mass = 1000000
		this.surrogate.dx = 0
		this.surrogate.dy = 0
		stage.addChild(this.surrogate.dot)
	}
	
	area() { return Math.PI*this.surrogate.r*this.surrogate.r }
	
	rise() { this.surrogate.place(this.surrogate.x,this.surrogate.y-1) }
	
	expand() { return this.surrogate.resize(this.surrogate.r+3) }
	
	contains(p) {
		let dx = p.x-this.surrogate.x
		let dy = p.y-this.surrogate.y
		let r = Math.sqrt(dx*dx+dy*dy)
		return r < this.surrogate.r
	}
		
	bounce(p) {
		if (p.container != this) return this.contains(p)
		if (this.contains(p)) return false
		let lastX = p.x;
		let lastY = p.y;
		
		//random accleration
		p.dx += (1-2*Math.random())*randAccel;
		p.dy += (1-2*Math.random())*randAccel;
		
		//don't let velocity get too large
		if (p.dx > maxVelComp) {
			p.dx = maxVelComp;
		}
		else if (p.velX < -maxVelComp) {
			p.dx = -maxVelComp;
		}
		if (p.dy > maxVelComp) {
			p.dy = maxVelComp;
		}
		else if (p.dy < -maxVelComp) {
			p.dy = -maxVelComp;
		}
		
		p.x += p.dx;
		p.y += p.dy;
		
		let x = p.x - this.surrogate.x, y = p.y - this.surrogate.y, r = this.surrogate.r
		let radSquare= x*x + y*y
		let boundaryRadSquare = r*r
		if (radSquare > boundaryRadSquare) {
				    //find intersection point with circle. simple method: midpoint
			let exitX = (lastX - this.surrogate.x + x)/2
			let exitY = (lastY - this.surrogate.y + y)/2
	
		    //scale to proper radius
		    let exitRad = Math.sqrt(exitX*exitX + exitY*exitY)
		    exitX *= r/exitRad
		    exitY *= r/exitRad
	
		    //place particle there
		    p.x = this.surrogate.x + exitX
		    p.y = this.surrogate.y + exitY
		    let twiceProjFactor = 2*(exitX*p.dx + exitY*p.dy)/boundaryRadSquare
		    p.dx -= twiceProjFactor*exitX
		    p.dy -= twiceProjFactor*exitY
		}
	    return false
	}
	
	place(p) {
		let x = this.surrogate.x, y = this.surrogate.y, r = this.surrogate.r
		let px = randomBetween(-r+2,r-2)
		let dy = Math.floor(Math.sqrt(r*r-px*px))
		let py = randomBetween(-dy+2,dy-2)
		p.place(x+px,y+py)
	}
}

class Atmosphere extends Container {
	constructor(stage,x,y,w,h) {
		super(stage,maxAtmos)
		this.x = x
		this.y = y
		this.w = w
		this.h = h
		this.r = 1
		this.parcel = new Parcel(stage,this.x+this.w/2,this.y+this.h-startr-1,startr)
		this.particles.push(this.parcel.surrogate)
		this.parcel.populate()
		this.populate()
	}
	
	area() { return (this.w-this.x)*(this.h-this.y)}
	
	bounce(p) {
		if (p.x < this.x || p.x > (this.x + this.w))
			p.dx = -p.dx
		if (p.y < this.y || p.y > (this.y + this.h))
			p.dy = -p.dy
	}
	
	place(p) {
		p.place(randomBetween(this.x+1,this.x+this.w-1),randomBetween(this.y+1,this.y+this.h-1))
		if (this.parcel.contains(p)) this.place(p)
	}
	
	update(tick) {
		for (let i = 0; i < 3; i++) {
			this.parcel.update()
			super.update()
		}
		if (this.parcel.surrogate.y > 100)
			this.parcel.rise()
		if (tick % 60 == 0) {
			//if (this.density() > this.parcel.density())
			this.parcel.expand()
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

class BubbleSim {
	constructor() {
		this.mainstage = new createjs.Stage("maincanvas")
		this.buttons = new Buttons(this) 
		this.running = false
		this.render()
	}
	
	render() {
		this.atmosphere = new Atmosphere(this.mainstage,-10,-10,420,410)
		let ground = new createjs.Shape()
		ground.graphics.beginStroke("#888").beginFill("#888").drawRect(0,398,398,2).endStroke()
		this.mainstage.addChild(ground)
	}
		
	run() {
		createjs.Ticker.framerate = framerate
		let tick = 0
		this.atmosphere.update()
		createjs.Ticker.addEventListener("tick", e => {
			this.mainstage.update()
			if (!this.running) return
			this.atmosphere.update(tick)
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

(new BubbleSim()).run()
