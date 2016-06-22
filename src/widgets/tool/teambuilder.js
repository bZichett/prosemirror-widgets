/*
 * Given a list of students each which has one or more strength domains, assign them to teams so that each
 * team has one or more representatives from each domain
 * 
 * The algorithm begins by creating an array of 4 domains.  Each domain is initialized with the full set of team indices.
 * A fifth domain is added which represents the full set of teams indices which need members.
 * 
 * Each student searches for a team which does not have at least one of the student strengths.  If there are none, the
 * student is added to the first team that does not yet have teamsize members
 * 
 * At completion all students have been considered and added to a team.  The teams array contains the team groupings.
 */
class Student {
	constructor(name,domains) {
		this.name = name
		this.domains = domains // array of domain indices (0,3)
	}
}

class Team {
	constructor() {
		this.students = []
	}
	
	size() { return this.students.length }
	
	addStudent(s) { this.students.concat(s) }
}

class TeamBuilder {
	constructor(students,teamsize) {
		this.students = students
		this.teamsize = teamsize
		this.nteams = students.length/teamsize + 1
		this.teams = []
		this.domains = []
		init()
	}
	
	init() {
		/*
		 * Make an array of teams for each domain. Add a final array of teams that need members 
		 */
		for (let d = 0; d < 5; d++) {
			let domain = []
			for (let s = 0; s < students.length; s++) domain.concat(s)
			this.domains.concat(domain)
		}
		for (let t = 0; t < nteams; t++)
			this.teams.concat(new Team(this.teamsize))
	}			
		
	assign() {
		for (let s = 0; s< students.length; s++) {
			let student = students[s]
			let team = -1
			for (let d = 0; d < student.domains.length; d++)
				if (this.domains[d].length > 0 && team == -1) team = this.domains.shift()
			// all the teams have at least one member with the domains the student has
			if (team == -1) {
				if (this.domains[4].length > 0) {
					team = this.domains[4].shift()
					// if needs more members add it back
					if (!this.teams[team].size() < (this.teamsize-1)) this.domains[4].unshift(team)
				} 
			}
			if (team == -1)	throw { name: 'BadTeam', message: 'No non-full teams available' }
			this.teams[team].addStudent(s)
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
	builder.getTeams().forEach(t -> console.log(t))
}