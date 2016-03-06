import {Block, Textblock, emptyFragment, Fragment, Attribute, Pos, NodeKind} from "prosemirror/dist/model"
import {elt, insertCSS} from "prosemirror/dist/dom"
import {TextBox} from "./textbox"
import {defParser, defParamsClick, namePattern, nameTitle, selectedNodeAttr, getPosInParent, nodeBefore, insertWidget} from "../../utils"
import {Question, qclass} from "./question"

NodeKind.checkitem = new NodeKind("checkitem")

export class CheckItem extends Block {
	static get kind() { return NodeKind.checkitem }
	get attrs() {
		return {
			name: new Attribute,
			value: new Attribute,
			class: new Attribute({default: "widgets-checkitem"})
		}
	}
	create(attrs, content, marks) {
		if (content.content) {
			let len = content.content.length
			content = Fragment.from([this.schema.nodes.checkbox.create(attrs),content.content[len-1]])
		}
		return super.create(attrs,content,marks)
	}
}

export class CheckList extends Question {
	get attrs() {
		return {
			name: new Attribute,
			class: new Attribute({default: "widgets-checklist "+qclass})
		}
	}
	get isList() { return true }
}

defParser(CheckItem,"div","widgets-checkitem")
defParser(CheckList,"div","widgets-checklist")

CheckItem.prototype.serializeDOM = (node,s) => s.renderAs(node,"div", node.attrs)

function renumber(pm, pos) {
	let cl = pm.doc.path(pos.path), i = 1
	cl.forEach((node,start) => {
		if (node.type.name == "checkitem") {
			pm.tr.setNodeType(new Pos(pos.path,start), node.type, {name: cl.attrs.name+"-"+i, value:i++}).apply()
		}
	})
}

CheckItem.register("command", "split", {
	  label: "Split the current checkitem",
	  run(pm) {
	    let {from, to, node} = pm.selection
	    if ((node && node.isBlock) || from.path.length < 2 || !Pos.samePath(from.path, to.path)) return false
	    let toParent = from.shorten(), parent = pm.doc.path(toParent.path)
	    if (parent.type != this) return false    
	    let tr = pm.tr.delete(from, to).split(from, 2).apply(pm.apply.scroll)
	    renumber(pm, toParent.shorten())
	    return tr
	  },
	  keys: ["Enter(20)"]
	})


CheckItem.register("command", "delete",{
	label: "delete this checkitem or checklist",
	run(pm) {
		let {from,to,head,node} = pm.selection
		// don't allow to delete whole checkitem
		if (node && node.type == this) return true
	    let toCH = from.shorten(), ch = pm.doc.path(toCH.path)
	    if (ch.type != this) return false
		if (from.offset > 0) return pm.tr.delete(from,to).apply(pm.apply.scroll)
	    let toCL = toCH.shorten(), cl = pm.doc.path(toCL.path)
	    let {before,at} = nodeBefore(pm,toCH)
	    // if only question and one choice or still textg then ignore
	    if (cl.size == 2 || before.type != this || ch.lastChild.size > 0) return true;
	    let tr = pm.tr.delete(toCL,toCL.move(1)).apply()
	    renumber(pm, toCL)
	    return tr
	},
	keys: ["Backspace(10)", "Mod-Backspace(10)"]
})

CheckList.register("command", "insert", {
	label: "Check List",
	run(pm, name) {
		let {from,to,node} = pm.selection
		if (node && node.type == this) {
			let tr = pm.tr.setNodeType(from, this, {name: name}).apply()
			renumber(pm,Pos.from(from.toPath().concat(from.offset),0))
			return tr
		} else {
			let choice_content = Fragment.from([
			    this.schema.nodes.checkbox.create({name: name, value: 1}),
			    this.schema.nodes.textbox.create()
			])
			let content = Fragment.from([
			    this.schema.nodes.paragraph.create(null,""),
			    this.schema.nodes.checkitem.create({name: name, value: 1},choice_content)
			])
			return insertWidget(pm,from,this.create({name},content))
	 	}
	},
	select(pm) {
  		return true
	},
	menu: {group: "question", rank: 70, display: {type: "label", label: "CheckList"}},
	params: [
 	    { name: "Name", attr: "name", label: "Short ID", type: "text",
   	  	  prefill: function(pm) { return selectedNodeAttr(pm, this, "name") },
 		  options: {
 			  pattern: namePattern, 
 			  size: 10, 
 			  title: nameTitle}}
	]
})

defParamsClick(CheckList,"checklist:insert")

insertCSS(`

.ProseMirror .widgets-checkitem input {
	float: left;
}

.ProseMirror .widgets-checkitem {
	cursor: text;
}


`)