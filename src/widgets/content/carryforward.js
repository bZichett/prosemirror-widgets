import {Block, Inline, Attribute} from "prosemirror/dist/model"
import {elt, insertCSS} from "prosemirror/dist/dom"
import {defParser, defParamsClick, namePattern, nameTitle, selectedNodeAttr} from "../../utils"
 
function getCarryOptions(names) {
	return names.map(w => ({value: w, label: w}))
}
 
export class CarryForward extends Inline {
	get attrs() {
		return {
			name: new Attribute,
			model: new Attribute({default: "user_response"}),
			type: new Attribute({default: "carry_forward"})
		}
	}
}
                             
defParser(CarryForward,"thinkspace","widgets-carryforward")

CarryForward.prototype.serializeDOM = node => {
	return elt("thinkspace",{class: "widgets-carryforward", name: node.attrs.name},
		elt("img",{src: "forward.png", width:16, height:16, title:"Carry forward "+node.attrs.name})
	)
}

CarryForward.register("command", "insert", {
	label: "CarryForward",
	run(pm, name) {
    	return pm.tr.replaceSelection(this.create({name})).apply(pm.apply.scroll)
  	},
	params: [ 
   	    { name: "Name", label: "Element name", type: "select",
       	  prefill: function(pm) { return selectedNodeAttr(pm, this, "name") },
 		  options: function() { return getCarryOptions(["test1","test2"])}}
	]
})

defParamsClick(CarryForward,"carryforward:insert",["all"])

insertCSS(`

.ProseMirror .widgets-carryforward img:hover {
	cursor: pointer;
}

`)