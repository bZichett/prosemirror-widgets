export {widgetParamHandler, defineFileHandler, namePattern, nameTitle, defParamsClick, selectedNodeAttr} from "./params"
export {alignGroup,LeftAlign,CenterAlign,RightAlign,JustifyAlign} from "./align"
import {Pos} from "prosemirror/dist/model"
import {selectableNodeAbove} from "prosemirror/dist/edit/selection"
import {widgetParamHandler} from "./params"

if (window.MathJax)
	MathJax.Hub.Queue(function () {
	    MathJax.Hub.Config({
	    	tex2jax: {
	        	displayMath: [ ["\\[","\\]"] ], 
	        	inlineMath: [ ["\\(","\\)"] ],
	        	processEscapes: true
	    	},
	    	displayAlign:"left"
		})
	})

export function defParser(type,tag,cls) {
	type.register("parseDOM", {
		tag: tag,
		rank: 25,
		parse: (dom, context, type, attrs) => {
			let contains = dom.classList.contains(cls)
			if (!contains) return false
			context.insertFrom(dom, type, attrs)
		}
	})	
}

export function getPosInParent(pm, pos, child) {
	let i = 0, parent = pm.doc.path(pos.path)
	parent.forEach((node,start) => { i = node == child?start: 0 })
	return new Pos(pos.path,i)
}

export function nodeBefore(pm, pos) {
    let before, cut
    for (let i = pos.path.length - 1; !before && i >= 0; i--) if (pos.path[i] > 0) {
      cut = pos.shorten(i)
      before = pm.doc.path(cut.path).child(cut.offset - 1)
    }
    return {before,at: new Pos(cut.path,cut.offset-1)}
}

export function insertWidget(pm, pos, w) {
  for (;;) {
    if (pos.depth == 0) return pm.tr.insert(pos,w).apply(pm.apply.scroll) 
    pos = pos.shorten(null,1)
  }
}


/*import {InputRule} from "prosemirror/dist/inputrules"
let urlex = /((https?:\/\/)?[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?)/
LinkMark.register("autoInput","startLink", new InputRule(urlex," ",
	function(pm, match, pos) {
		let url = match[0]
		console.log(url)
		pm.setMark(this,pos,{href: url, title: ""})
	}
))*/

