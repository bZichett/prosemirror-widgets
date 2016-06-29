
/*
 * Given a list of students each which have one or more catsize categories, assign to teams so that each
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
	
	canAdd(c) { return this.catcnt[c] == 0 && !isFull() }
	
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
	constructor(settings) {
		this.settings = settings
		this.render()
	}
	
	render() {
		this.getStudents()
		this.catsize = this.settings.getCategories()
		this.teamsize = this.settings.getTeams()
		this.nteams = this.students.length/this.teamsize + 1
		this.teams = []
		for (let t = 0; t < this.nteams; t++) this.teams.concat(new Team(t,this.catsize,this.teamsize))
		this.category_team = []
		for (let c = 0; c < this.catsize; c++) this.category_team.concat(0)
	}
	
	getStudents() {
		this.students = []
    	for (let s = 0; s < this.settings.getStudents(); s++) {
    		this.students.concat(new Student("s"+s,[]))
    	}
	}
	
	populate() {
		for (let s = 0; s < this.students.length; s++) {
			let student = this.students[s]
			let team = -1
			for (let i = 0; i < student.categories.length; i++) {
				let c = student.categories[i]
				for (let t = this.category_team[c]; t < this.nteams; t++)
					if (this.teams[t].canAdd(c)) {
						team = t
						this.teams[team].addStudent(s)
						break
					}
			}
			// all teams have at least one member in each category of this student then add student to first non-full team
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

class Settings {
	constructor() {
		this.size = document.getElementById("size")
		this.team = document.getElementById("team")
		this.category = document.getElementById("category")
		this.category.addEventListener("change", e => {
			this.buildInputTable()
		})
	}
	
	getStudents() { return parseInt(this.size.value) }
	
	getTeams() { return parseInt(this.team.value) }

	getCategories() { return parseInt(this.category.value) }
	
	getInput(id,sz) {
		let input = document.createElement("input")
		input.setAttribute("id",id)
		input.setAttribute("size",sz)
		input.setAttribute("type","text")
		return input
	}
 		
	buildInputTable() {
		let table = document.getElementById("cattable1")
		let nrows = this.getCategories()+1
		if (table.rows.length < nrows)
			for (let i = table.rows.length; i < nrows; i++) {
				let row = table.insertRow(i)
				row.insertCell(0).appendChild(this.getInput("c"+i,20))
				row.insertCell(1).appendChild(this.getInput("s"+i,3))
			}
		else if (table.rows.length > nrows)
			for (let i = table.rows.length-1; i >= nrows; i--)
				table.deleteRow(i)
	}
}

class Buttons {
	constructor() {
		this.assign = document.getElementById("assign")
	}
	
	addListener(listener) { 
		this.assign.addEventListener("click", e => listener(e))
	}
}

let tb = new TeamBuilder(new Settings())

function assign() {
	let builder = new TeamBuilder(new Settings())
	builder.assign()
	builder.getTeams().forEach(t => console.log(t.toString()))
}