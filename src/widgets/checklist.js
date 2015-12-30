import {Block, Paragraph, Attribute, Pos} from "../../../prosemirror/dist/model"
import {elt, insertCSS} from "../../../prosemirror/dist/dom"
import {defParser, defParamsClick, andScroll} from "../utils"

export class CheckItem extends Paragraph {
	static get kind() { return "." }

	create(attrs, content, marks) {
		if (attrs.value > 0) content = [this.schema.node("checkbox",attrs)]
		return super.create(attrs, content, marks)
	}
}

CheckItem.attributes = {
	name: new Attribute(),
	value: new Attribute()
}


export class CheckList extends Block {
	static get contains() { return "checkitem" }
}

CheckList.attributes = {
	name: new Attribute(),
	layout: new Attribute({default: "vertical"})
}

defParser(CheckItem,"div","widgets-checkitem")
defParser(CheckList,"div","widgets-checklist")

CheckItem.prototype.serializeDOM = (node,s) => s.renderAs(node,"p", {
	name: node.attrs.name+"-"+node.attrs.value, 
	value: node.attrs.value,
	class: "widgets-checkitem"
})

CheckList.prototype.serializeDOM = (node,s) => s.renderAs(node,"div",{
	name: node.attrs.name,
	layout: node.attrs.layout,
	class: "widgets-checklist"
})

CheckItem.register("command", {
	  name: "splitCheckitem",
	  label: "Split the current checkitem",
	  run(pm) {
	    let {node, from, to} = pm.selection
	    if ((node && node.isBlock) || from.path.length < 2 || !Pos.samePath(from.path, to.path)) return false
	    let toParent = from.shorten(), grandParent = pm.doc.path(toParent.path)
	    console.log(grandParent.type.name)
	    if (grandParent.type.name != "checklist") return false
	    return pm.tr.delete(from, to).split(from, 1, pm.schema.nodes.checkitem, {name: grandParent.attrs.name, value: grandParent.size}).apply(andScroll)
	  },
	  key: "Enter(50)"
	})


CheckList.register("command", {
	name: "insertCheckList",
	label: "CheckList",
	run(pm, name, layout) {
		let chkitem = pm.schema.nodes.checkitem.create({name:name, value: 0})                                    
		return pm.tr.replaceSelection(this.create({name:name+"-0", layout:layout},chkitem)).apply(andScroll)
  	},
	params: [
     	{ label: "Name", type: "text"},
     	{ label: "Layout (vertical, horizontal)", type: "select", options: [
     	    {value: "horizontal", label: "horizontal"},
     	    {value: "vertical", label: "vertical"}
     	  ]}
	],
    prefillParams(pm) {
	    let {node} = pm.selection
	    if (node)
	      return [node.attrs.name, node.attrs.layout]
	 }
})

CheckItem.register("command", {
  name: "splitCheckItem",
  label: "Split the current checkitem",
  run(pm) {
    let {node, from, to} = pm.selection
    if ((node && node.isBlock) || from.path.length < 2 || !Pos.samePath(from.path, to.path)) return false
    let toParent = from.shorten(), grandParent = pm.doc.path(toParent.path)
    return pm.tr.delete(from, to).split(from, 1, pm.schema.nodes.checkitem, {
    	name: grandParent.attrs.name+"-"+grandParent.size, 
    	value: grandParent.size}).apply(andScroll)
  },
  key: "Enter(50)"
})

CheckItem.register("command", {
  name: "deleteCheckItem",
  label: "delete this checkitem or checklist",
  run(pm) {
    let {head, empty} = pm.selection
    if (!empty || head.offset > 1) return false
    // Find the node before this one
    let before, cut
    for (let i = head.path.length - 1; !before && i >= 0; i--) if (head.path[i] > 0) {
      cut = head.shorten(i)
      before = pm.doc.path(cut.path).child(cut.offset - 1)
    }
	let mc = pm.doc.path(cut.path).child(cut.offset)
    // if top choice, delete whole question if only one choice
    if (mc.type.name == "checkitem") {
    	return pm.tr.delete(cut, cut.move(1)).apply(andScroll)
    } else {
    	// don't delete question if more than one choice
    	if (mc.size == 1) {
     		return pm.tr.delete(cut,cut.move(1)).apply(andScroll)
    	} else
    		return false;
    }
  },
  key: ["Backspace(50)", "Mod-Backspace(50)"]
})



insertCSS(`

.widgets-checkitem {}
.widgets-checklist {}

`)