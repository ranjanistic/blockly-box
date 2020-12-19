class BlocklyWorkspace {
  constructor() {
    this.level = 0;
    this.initLevels();
    this.initBlocks();
    this.initActions();
  }
  initLevels(){
    let levels = document.getElementsByName('level');
    let labels = [];
    for(let i = 0; i < levels.length; i++){
      labels.push(document.querySelector('label[for=' + levels[i].id + ']').innerHTML)
    }
    this.game = new GameCanvas();
    levels.forEach((level,l)=>{
      level.onchange=_=>{
        if(level.checked){
          this.level = l;
          this.game = new GameCanvas(l);
        }
      }
    });
  }
  initBlocks(){
    Blockly.Blocks['vertical_pos'] = {
      init: function() {
        this.setColour(220);
        this.appendDummyInput()
          .appendField("vertical offset:")
          .appendField(new Blockly.FieldNumber(0), 'dy');
      }
    };

    Blockly.JavaScript['vertical_pos'] = function(block){
      const dy = block.getFieldValue('dy');
      return `this.game.yOffset(${dy});`;
    };

    Blockly.Blocks['horizontal_pos'] = {
      init: function() {
        this.setColour(220);
        this.appendDummyInput()
          .appendField("horizontal offset:")
          .appendField(new Blockly.FieldNumber(0), 'dx');
      }
    };
    Blockly.JavaScript['horizontal_pos'] = function(block){
      const dx = block.getFieldValue('dx');
      return `this.game.xOffset(${dx});`;
    };

    this.workspace = Blockly.inject("blocklyDiv", {
      toolbox: document.getElementById("toolbox"),
    });
  }
  initActions(){
    document.getElementById("shoot").onclick = (_) => {
      Blockly.JavaScript.addReservedWords("code");
      let code = Blockly.JavaScript.workspaceToCode(this.workspace);
      eval(code);
    };

    document.getElementById("reset").onclick = (_) => {
      Blockly.mainWorkspace.clear();
      this.game = new GameCanvas(this.level);
    };

    document.getElementById("undo").onclick = (_) => {
      Blockly.mainWorkspace.undo();
    };
    
    document.getElementById("redo").onclick = (_) => {
      Blockly.mainWorkspace.undo(true);
    };
  }
}

class GameCanvas {
  canvas = document.getElementById("canvas");
  context = this.canvas.getContext("2d");
  gift = document.getElementById("gift");
  hurdle = document.getElementById("hurdle");
  basket = document.getElementById("basket");

  constructor(level = 0) {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.drawImage(this.gift,this.gift.width,this.canvas.height-this.gift.height);
    this.context.drawImage(this.basket,this.canvas.width-200,this.canvas.height - this.basket.height);
    this.levels[level]();
  }

  levels = [
    ()=>{
      this.context.drawImage(this.hurdle,300,280);
    },
    ()=>{
      this.context.drawImage(this.hurdle,500,100);
      this.context.drawImage(this.hurdle,200,280);
    },
    ()=>{
      this.context.drawImage(this.hurdle,500,280);
      this.context.drawImage(this.hurdle,350,0);
      this.context.drawImage(this.hurdle,200,200);
    }
  ]

  xOffset(dx){
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ballView(dx<this.canvas.width-this.ball().radius?dx:this.ball().radius);
  }
  yOffset(dy){
    this.context.clearRect(0, 0, canvas.width, canvas.height);
    this.ballView(0,dy<this.ball().posy?dy:0);
  }
}

window.onload = (_) => window.app = new BlocklyWorkspace();

const getFraction=(decimal)=>{
  if(decimal == 1) return [1,1];
  const gcd = (a, b)=> { //Greatest common divisor
    if (b < 0.0000001) return a;
    return gcd(b, Math.floor(a % b));
  };
  let denominator = Math.pow(10, decimal.toString().length - 2);
  let numerator = decimal * denominator;
  numerator/=gcd(numerator, denominator)
  denominator/=gcd(numerator, denominator)
  return [Math.floor(numerator),Math.floor(denominator)]; //[numerator,denominator]
}