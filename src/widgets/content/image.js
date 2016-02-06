import {Inline, Attribute} from "prosemirror/dist/model"
import {elt,insertCSS} from "prosemirror/dist/dom"
import {defParser, defParamsClick, selectedNodeAttr} from "../../utils"

export class Image extends Inline {
	get attrs() {
		return {
			src: new Attribute,
			alt: new Attribute,
			title: new Attribute,
			class: new Attribute({default: "widgets-img widgets-edit"})
		}
	}
}
 
defParser(Image, "img", "widgets-img")

Image.prototype.serializeDOM = (node, s) => s.renderAs(node, "img", node.attrs)

Image.register("command", "insert", {
  label: "Image",
  run(pm, src, alt, title) {
    return pm.tr.replaceSelection(this.create({src, alt, title})).apply(pm.apply.scroll)
  },
  menu: {group: "content", rank: 70, display: {type: "label", label: "Image"}},
  params: [
    { name: "File", label: "Image File", type: "file", default: "img.png", 
   	 prefill: function(pm) { return selectedNodeAttr(pm, this, "src") }},
    { name: "Description", label: "Description / alternative text", type: "text", 
      prefill: function(pm) { return selectedNodeAttr(pm, this, "alt") }},
    { name: "Title", label: "Title", type: "text",
   	  prefill: function(pm) { return selectedNodeAttr(pm, this, "tex") }}
  ],
  select(pm) {
    return pm.doc.path(pm.selection.from.path).type.canContainType(this)
  }
})

defParamsClick(Image,"image:insert",["all"])

insertCSS(`

.ProseMirror .widgets-img {}

`)