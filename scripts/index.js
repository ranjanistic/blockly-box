class BlocklyWorkspace {
  constructor() {
    this.init();

    Blockly.Blocks['launch_angle'] = {
      init: function() {
        this.setColour(220);
        this.appendDummyInput()
          .appendField("launch angle:")
          .appendField(new Blockly.FieldAngle(45), 'angle');
      }
    };
    Blockly.JavaScript['launch_angle'] = function(block){
      // Search the text for a substring.
      var angle = block.getFieldValue('angle');
      var code = `this.game.clearInstance();this.game.launchBall(${angle});`;
      return code;
    };

    this.workspace = Blockly.inject("blocklyDiv", {
      toolbox: document.getElementById("toolbox"),
    });
    document.getElementById("shoot").onclick = (_) => {
      Blockly.JavaScript.addReservedWords("code");
      let code = Blockly.JavaScript.workspaceToCode(this.workspace);
      console.log(code);
      eval(code);
    };
    document.getElementById("reset").onclick = (_) => {
      Blockly.mainWorkspace.clear();
      this.game.clearInstance();
    };
    document.getElementById("undo").onclick = (_) => {
      Blockly.mainWorkspace.undo();
    };
    document.getElementById("redo").onclick = (_) => {
      Blockly.mainWorkspace.undo(true);
    };
  }
  init(){
    let levels = document.getElementsByName('level');
    let labels = [];
    for(let i = 0; i < levels.length; i++){
      labels.push(document.querySelector('label[for=' + levels[i].id + ']').innerHTML)
    }
    this.game = new GameCanvas();
    levels.forEach((level,l)=>{
      level.onchange=_=>{
        if(level.checked){
          this.game.clearInstance()
          this.game = new GameCanvas(l);
        }
      }
    });
  }
}

class GameCanvas {
  constructor(level = 0) {
    this.canvas = document.getElementById("canvas");
    this.context = this.canvas.getContext("2d");
    this.interval;
    this.radius = 30;
    this.x = 0+this.radius;
    this.y = canvas.height-30;
   [this.level0,this.level1,this.level2][level](this.context);
  }
  ball(){
    this.context.beginPath();
    this.context.arc(this.x, this.y,this.radius, 0, Math.PI*2);
    this.context.fillStyle = "#ee2323";
    this.context.fill();
    this.context.closePath();
  }
  reset() {
    
  }
  getFraction(decimal){
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
  launchBall(angle){
    if(angle<0||angle>90) return false;
    console.log(angle);
    let frac;
    if(Math.round(angle) == 90){
      frac = [1,0]
    } else {
      console.log(Math.tan((Math.PI/180)*angle));
      frac = this.getFraction(Math.tan((Math.PI/180)*angle))
    }
    console.log(frac);
    let dy = frac[0];
    let dx = frac[1];
    this.interval = setInterval(()=>{
      this.context.clearRect(0, 0, canvas.width, canvas.height);
      this.ball(this.context);
      if(this.x + dx > this.canvas.width-this.radius || this.x + dx < this.radius) {
        dx = -dx;
      }
      if(this.y + dy > this.canvas.height-this.radius || this.y + dy < this.radius) {
        dy = -dy;
      }
      this.x+=dx
      this.y+=dy
    },1);
  }
  level0(){
    this.radius = 30;
  }
  level1(){
    this.radius = 20;
    console.log(this.radius);
  }
  level2(){
    this.radius = 10;
  }
  clearInstance(){
    this.context.clearRect(0, 0, canvas.width, canvas.height);
    clearInterval(this.interval);
    this.x = 0+this.radius;
    this.y = canvas.height-30;
  }
}

window.onload = (_) => window.app = new BlocklyWorkspace();
