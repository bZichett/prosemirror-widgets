import {Block, Paragraph, Attribute} from "prosemirror/dist/model"
import {elt, insertCSS} from "prosemirror/dist/dom"
import {defParser, defParamsClick, namePattern, nameTitle, selectedNodeAttr} from "../../utils"

export class Scale extends Block {
	static get contains() { return "paragraph"}
	get attrs() {
		return {
			name: new Attribute,
			startvalue: new Attribute({default: "1"}),
			startlabel: new Attribute({default: "low"}),
			endvalue: new Attribute({default: "10"}),
			endlabel: new Attribute({default: "high"}),
		}
	}
}

defParser(Scale,"div","widgets-scale")

Scale.prototype.serializeDOM = (node,s) => {
	let dom = s.renderAs(node,"div",{class: "widgets-scale widgets-edit", contenteditable: false})
	let para = elt("p")
	dom.appendChild(para)
	para.appendChild(elt("span", null, node.attrs.startlabel+" "))
	let startVal = Number(node.attrs.startvalue)
	let endVal = Number(node.attrs.endvalue)
	if (startVal < endVal)
		for (let i = startVal; i <= endVal; i++) {
			let name = node.attrs.name+i
			para.appendChild(
				elt("span",{class: "widgets-scaleitem"},
					elt("label",{for: name},i.toString()),
					elt("input",{id: name, name:node.attrs.name, type:"radio", value:i})
				)
			)
		}
	else
		for (let i = startVal; i >=  endVal; i--) {
			para.appendChild(
				elt("span",{class: "widgets-scaleitem"},
					elt("label",{for: name},i.toString()),
					elt("input",{id: name, name:node.attrs.name, type:"radio", value:i})
				)
			)
		}
	para.appendChild(elt("span", null, " "+node.attrs.endlabel))
	return dom
}

Scale.register("command", "insert",{
	label: "Scale",
	run(pm, name, startvalue, startlabel, endvalue, endlabel) {
    	return pm.tr.replaceSelection(this.create({name,startvalue,startlabel,endvalue,endlabel})).apply(pm.apply.scroll)
  	},
	params: [
  	    { name: "Name", label: "Short ID", type: "text",
     	  prefill: function(pm) { return selectedNodeAttr(pm, this, "name") },
   		  options: {
   			  pattern: namePattern, 
   			  size: 10, 
   			  title: nameTitle}},
     	{ label: "Start value", type: "number", default: 1, 
		  prefill: function(pm) { return selectedNodeAttr(pm, this, "startvalue") }},
     	{ name: "Start Label", label: "Text on left", type: "text", default: "low",
		  prefill: function(pm) { return selectedNodeAttr(pm, this, "startlabel") }},
     	{ label: "End value", type: "number", default: 10,
  	      prefill: function(pm) { return selectedNodeAttr(pm, this, "endvalue") }},
     	{ name: "End Label", label: "Text on right", type: "text", default: "high", 
  		  prefill: function(pm) { return selectedNodeAttr(pm, this, "endlabel") }}
	]
})

defParamsClick(Scale,"scale:insert")

insertCSS(`

.widgets-scaleitem {
	display: inline-block;
	text-align: center;
}

.widgets-scaleitem input {
	display: block;
}

.widgets-scale span {
	vertical-align: middle;
	font-weight: normal;
}

.ProseMirror .widgets-scale:hover {}

`)