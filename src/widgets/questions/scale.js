import {Block, Paragraph, Attribute} from "prosemirror/dist/model"
import {elt, insertCSS} from "prosemirror/dist/dom"
import {defParser, defParamsClick, namePattern, nameTitle, selectedNodeAttr} from "../../utils"

export class ScaleDisplay extends Block {
	get attrs() {
		return {
			name: new Attribute,
			startvalue: new Attribute({default: "1"}),
			startlabel: new Attribute({default: "low"}),
			endvalue: new Attribute({default: "10"}),
			endlabel: new Attribute({default: "high"})
		}
	}
}

ScaleDisplay.prototype.serializeDOM = (node,s) => {
	let para = elt("div",{contenteditable: false})
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
	return para
}

export class Scale extends Block {
	static get contains() { return "text"}
	get attrs() {
		return {
			name: new Attribute,
			startvalue: new Attribute({default: "1"}),
			startlabel: new Attribute({default: "low"}),
			endvalue: new Attribute({default: "10"}),
			endlabel: new Attribute({default: "high"}),
			class: new Attribute({default: "widgets-scale widgets-edit"})
		}
	}
	create(attrs, content, marks) {
		return super.create(attrs,[
		    this.schema.nodes.paragraph.create(null,"",marks),
		    this.schema.nodes.scaledisplay.create(attrs, null, marks)
		],marks)
	}
}

defParser(Scale,"div","widgets-scale")

Scale.prototype.serializeDOM = (node,s) => s.renderAs(node,"div",node.attrs)

Scale.register("command", "insert",{
	label: "Scale",
	run(pm, name, startvalue, startlabel, endvalue, endlabel) {
		let {from,to,node} = pm.selection
		if (node && node.type == this) {
			return pm.tr.setNodeType(from, this, {name,startvalue,startlabel,endvalue,endlabel}).apply(pm.apply.scroll)
		} else
			return pm.tr.replaceSelection(this.create({name,startvalue,startlabel,endvalue,endlabel})).apply(pm.apply.scroll)
  	},
	menu: {group: "question", rank: 74, display: {type: "label", label: "Scale"}},
	params: [
  	    { name: "Name", attr: "name", label: "Short ID", type: "text",
     	  prefill: function(pm) { return selectedNodeAttr(pm, this, "name") },
   		  options: {
   			  pattern: namePattern, 
   			  size: 10, 
   			  title: nameTitle}},
     	{ label: "Start value", attr: "startvalue", type: "number", default: 1, 
		  prefill: function(pm) { return selectedNodeAttr(pm, this, "startvalue") }},
     	{ name: "Start Label", attr: "startlabel", label: "Text on left", type: "text", default: "low",
		  prefill: function(pm) { return selectedNodeAttr(pm, this, "startlabel") }},
     	{ label: "End value", attr: "endvalue", type: "number", default: 10,
  	      prefill: function(pm) { return selectedNodeAttr(pm, this, "endvalue") }},
     	{ name: "End Label", attr: "endlabel", label: "Text on right", type: "text", default: "high", 
  		  prefill: function(pm) { return selectedNodeAttr(pm, this, "endlabel") }}
	]
})

defParamsClick(Scale,"scale:insert")

insertCSS(`

.widgets-scaleitem {
	display: inline-block;
	text-align: center;
    padding: 4px;
}

.widgets-scaleitem input {
	display: block;
}

.widgets-scale span {
	vertical-align: middle;
	font-weight: normal;
}

.ProseMirror .widgets-scale p:hover {
    cursor: text;
}

.widgets-scale {
	padding: 8px;
    border-top: 1px solid #AAA;
}

.widgets-scale div {
	display: inline-block;
	padding: 4px;
	background: #EEE;
    border-radius: 6px;
    border: 1px solid #AAA;
}
`)