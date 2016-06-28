createjs.MotionGuidePlugin.install()
createjs.Sound.registerPlugins([createjs.WebAudioPlugin, createjs.HTMLAudioPlugin, createjs.FlashAudioPlugin])
createjs.Ticker.framerate = 10
/*
 * Given a list of students each which has one or more catsize categories, assign them to teams so that each
 * team has one or more representatives from each category.
 * 
 * The algorithm begins by creating an array of category_team indices. Each category team index represents the next team that
 * doesn't have at least one student in that category. 
 * 
 * For each student, we look for a team that does not have a member in one of the categories this student represents.
 * If there are none, the student is added to the first team that does not yet have teamsize members.
 * 
 * At completion all students have been considered and added to a team.  The teams array contains the team membership.
 */
class Student {
	constructor(name,categories) {
		this.name = name
		this.categories = categories // array of category indices. Example: [0,3] for category 0 and 3
	}
}

class Team {
	constructor(id,catsize,teamsize) {
		this.id = id
		this.catsize = catsize
		this.teamsize = teamsize
		this.students = []
		this.catcnt = [] // number students in each category
		for (let c = 0; c < catsize; c++) this.catcnt.concat(0)
	}
	
	isFull() { return this.students.length == this.teamsize }
	
	addStudent(s) { 
		this.students.concat(s)
		for (let c = 0; c < s.categories.length; c++)
			this.catcnt[s.categories(c)]++
	}
	
	toString() {
		let str = "Team "+this.id+":\n"
		str += "Students:"
		for (let s = 0; s < this.students.length; s++) {
			str += s + ":["
			for (let c = 0; c < s.categories.length; c++)
				str += s.categories[c]+" "
			str += "] "
		}
		str += "\nCategory Counts:"
		for (let c = 0; c < s.categories.length; c++)
			str += c + ":" + this.catcnt[c] + " "
		str += "\n"
		return str
	}
}

class TeamBuilder {
	constructor(students,catsize,teamsize) {
		this.students = students
		this.catsize = catsize
		this.teamsize = teamsize
		this.nteams = students.length/teamsize + 1
		this.teams = []
		for (let t = 0; t < nteams; t++) this.teams.concat(new Team(t,catsize,teamsize))
		this.category_team = []
		for (let c = 0; c < catsize; c++) this.category_team.concat(0)
	}
	
	populate() {
		for (let s = 0; s < students.length; s++) {
			let student = students[s]
			let team = -1
			for (let i = 0; i < student.categories.length; i++) {
				let c = student.categories[i]
				while (this.teams[this.category_team[c] % this.catsize].isFull()) this.category_team[c]++
				team = this.category_team[c]++
				// Add student if the non-full team doesn't have the category otherwise move to next category
				if (this.teams[team].catcnt[c] == 0) {
					this.teams[team].addStudent(s)
					break
				}
			}
			// all teams have at least one member in each category of this student so add student to first non-full team
			if (team >= 0) continue
			for (let t = 0;t < this.nteams; t++)
				if (!this.teams[t].isFull()) {
					this.teams[t].addStudent(s)
					break
				}									
		}
	}
	
	getTeams() { return this.teams }	
}

function assign() {
	let students = []
	for (let s = 0; s < 100; s++) {
		let domains = []
		students.concat(new Student("s"+s,domains))
	}
	let builder = new TeamBuilder(students,6)
	builder.assign()
	builder.getTeams().forEach(t -> console.log(t.toString()))
}