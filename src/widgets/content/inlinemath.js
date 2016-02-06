import {Inline, Attribute} from "prosemirror/dist/model"
import {elt, insertCSS} from "prosemirror/dist/dom"
import {defParser, defParamsClick, selectedNodeAttr} from "../../utils"

export class InlineMath extends Inline {
	get attrs() {
		return {
			tex: new Attribute
		}
	}
	get contains() { return null }
}

defParser(InlineMath, "span", "widgets-inlinemath")

InlineMath.prototype.serializeDOM = node => {
	if (node.rendered) {
		node.rendered = node.rendered.cloneNode(true)
	} else {
		node.rendered = elt("span", {class: "widgets-inlinemath widgets-edit"}, " \\("+node.attrs.tex+"\\) ")
		// wait until node is attached to document to render
		MathJax.Hub.Queue(["Delay",MathJax.Callback,100],["Typeset",MathJax.Hub,node.rendered])
	}
	return node.rendered;
}


InlineMath.register("command", "insert", {
	label: "InlineMath",
	run(pm, tex) {
    	return pm.tr.replaceSelection(this.create({tex})).apply(pm.apply.scroll)
  	},
	menu: {group: "content", rank: 71, display: {type: "label", label: "Inline Math"}},
	params: [
     	{ name: "Latex", label: "Latex Expression", type: "text", 
       	  prefill: function(pm) { return selectedNodeAttr(pm, this, "tex") }}
	],
})

defParamsClick(InlineMath,"inlinemath:insert")

insertCSS(`

.ProseMirror .widgets-inlinemath {}

`)