import {EditorState} from "prosemirror/node_modules/prosemirror-state"
import {EditorView} from "prosemirror/node_modules/prosemirror-view"
import {schema, DomParser} from "prosemirror/node_modules/prosemirror-schema-basic"
import {MenuBarEditorView} from "prosemirror/node_modules/prosemirror-menu"
import {exampleSetup} from "prosemirror/node_modules/prosemirror-example-setup"

let content = document.querySelector("#content")
 
let view = new MenuBarEditorView(document.querySelector("#editor"), {
	state: EditorState.create({
		doc: DOMParser.fromSchema(schema).parse(content),
		plugins: [exampleSetup({schema: schema})]
	}),
	onAction: function(action) {
	    view.updateState(view.state.applyAction(action))
	}
}) 































/*import {ProseMirror} from "prosemirror/dist/edit"
import "prosemirror/dist/menu/tooltipmenu"
import "prosemirror/dist/menu/menubar"
import {insertCSS} from "prosemirror/dist/dom"
import {defineFileHandler} from "./utils"
import {widgetSchema, commands, mainMenuBar} from "./schema" 
 
let pm = window.pm = new ProseMirror({
  place: document.querySelector("#editor"),
  menuBar: mainMenuBar,
  schema: widgetSchema,
  commands: commands,
  doc: document.querySelector("#content"),
  docFormat: "dom"
})
 

pm.setOption("tooltipMenu", {
	selectedBlockMenu: true,
	inlineContent: [inlineGroup,insertMenu],
	blockContent: [[blockGroup, textblockMenu,alignGroup], [contentInsertMenu, questionInsertMenu]],
})
	
defineFileHandler(function(files) {
	console.log(files)
})

insertCSS(`
#editor {
	width: 800px;
}

`)

 */