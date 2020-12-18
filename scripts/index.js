window.onload=_=>{
    var workspace = Blockly.inject("blocklyDiv", {
        toolbox: document.getElementById("toolbox"),
      });
      document.getElementById("shoot").onclick=_=>{
        Blockly.JavaScript.addReservedWords('code');
        var code = Blockly.JavaScript.workspaceToCode(workspace);
        eval(code);
      }
      document.getElementById("reset").onclick=_=>{
        Blockly.mainWorkspace.clear()
      }
      document.getElementById("undo").onclick=_=>{
        Blockly.mainWorkspace.undo()
      }
      document.getElementById("redo").onclick=_=>{
        Blockly.mainWorkspace.undo(true)
      }
}