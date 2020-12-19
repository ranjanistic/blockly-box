const instance = (l) => `instance${l}`;
class BlocklyWorkspace {
  levels = document.getElementsByName('level');
  game = {};
  level = localStorage.getItem("level")||0;
  constructor() {
    this.initLevels();
    this.initBlocks();
    this.initActions();
    this.game[instance(this.level)] = new Game(this.level);
  }
  initLevels(){
    this.levels[this.level].click();
    this.levels.forEach((level,l)=>{
      level.onchange=_=>{
        if(level.checked){
          delete this.game[instance(this.level)]
          this.level = l;
          localStorage.setItem("level",l);
          this.game[instance(l)] = new Game(l);
        }
      }
    });
  }
  initBlocks(level = 0){
    [{
      name:'vertical_pos',
      field:'dy',
      color:220,
      caption:'Vertical:',
      action:(dy)=>`this.game[instance(this.level)].yOffset(${-dy})&&`
    },{
      name:'horizontal_pos',
      field:'dx',
      color:130,
      caption:'Horizontal:',
      action:(dx)=>`this.game[instance(this.level)].xOffset(${dx})&&`
    }].forEach((block)=>{
      Blockly.Blocks[block.name] = {
        init: function() {
          this.setColour(block.color);
          this.appendDummyInput()
            .appendField(block.caption)
            .appendField(new Blockly.FieldNumber(0), block.field);
          this.setPreviousStatement(true);
          this.setNextStatement(true);
        }
      };
      Blockly.JavaScript[block.name] = function(bl){
        return block.action(bl.getFieldValue(block.field));
      };
    })
    this.workspace = Blockly.inject("blocklyDiv", {
      toolbox: document.getElementById("toolbox"),
    });
  }
  initActions(level = 0){
    document.getElementById("shoot").onclick = (_) => {
      Blockly.JavaScript.addReservedWords("code");
      let code = Blockly.JavaScript.workspaceToCode(this.workspace);
      if(code){
        eval(`if(!(${code.substr(0,code.length-2)})) this.game[instance(this.level)].onCollision()`);}
    };
    document.getElementById("reset").onclick = (_) => {
      Blockly.mainWorkspace.clear();
      delete this.game[instance(this.level)]
      this.game[instance(this.level)] = new Game(this.level);
    };

    document.getElementById("undo").onclick = (_) => {
      Blockly.mainWorkspace.undo();
    };
    
    document.getElementById("redo").onclick = (_) => {
      Blockly.mainWorkspace.undo(true);
    };
  }
}

class Game {
  canvas = document.getElementById("canvas");
  context = this.canvas.getContext("2d");
  thegift = document.getElementById("gift");
  brokengift = document.getElementById("brokengift");
  hurdle = document.getElementById("hurdle");
  thebasket = document.getElementById("basket");

  gift = {
    width:this.thegift.width,
    height:this.thegift.height,
    startx:this.thegift.width,
    endx:this.thegift.width*2,
    starty:this.canvas.height-this.thegift.height,
    endy:this.canvas.height
  };
  basket = {
    length:this.thebasket.length,
    width:this.thebasket.width,
    startx:this.canvas.width-200,
    endx:this.canvas.width-200+this.thebasket.width,
    starty:this.canvas.height-this.thebasket.height,
    endy:0,
    center:this.canvas.width-200+(this.thebasket.width/2)
  }
  hurdles = [];
  constructor(level = 0) {
    Blockly.mainWorkspace.clear();
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.drawImage(this.thegift,this.gift.startx,this.gift.starty);
    this.context.drawImage(this.thebasket,this.basket.startx,this.basket.starty);
    this.levels[level]();
  }

  levels = [
    ()=>{
      this.hurdles.push({
        startx:300,
        starty:280,
        endx:300+this.hurdle.width,
        endy:280+this.hurdle.height
      });
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
    let passed = true;
    this.context.clearRect(this.gift.startx, this.gift.starty, this.gift.width, this.gift.height);
    this.context.clearRect(this.basket.startx,this.basket.starty,this.basket.width,this.basket.height);
    if(this.hurdles.some((hurdle)=>{
      const canvaserr = this.gift.startx+dx<0  //negative
        || this.gift.endx+dx>this.canvas.width;  //out of canvas
      console.log(canvaserr);
      if((this.gift.endy>=hurdle.starty&&this.gift.endy<=hurdle.endy)
          ||(this.gift.starty>=hurdle.starty&&this.gift.starty<=hurdle.endy)){  //any hurdle in scope
        
        if(dx<0){
          if(this.gift.startx+dx<=hurdle.endx){
            return canvaserr||this.gift.endx>hurdle.startx
          }
        } else {
          if(this.gift.endx+dx>=hurdle.startx){
            return canvaserr||this.gift.startx<hurdle.endx
          }
        }
      }
      return canvaserr;
    })){
      passed = false;
    }
    else {
      this.gift.startx+=dx;
      this.gift.endx+=dx;
    }
    this.context.drawImage(this.thegift,this.gift.startx,this.gift.starty);
    this.context.drawImage(this.thebasket,this.basket.startx,this.basket.starty);
    return passed;
  }
  
  yOffset(dy){
    let passed = true;
    this.context.clearRect(this.gift.startx, this.gift.starty, this.gift.width, this.gift.height);
    this.context.clearRect(this.basket.startx,this.basket.starty,this.basket.width,this.basket.height);
    if(this.hurdles.some((hurdle)=>{
      const canvaserr =  this.gift.starty+dy<0  //negative
        || this.gift.endy+dy>this.canvas.height //out of canvas
        if((this.gift.endx>=hurdle.startx&&this.gift.endx<=hurdle.endx)
          ||(this.gift.startx>=hurdle.startx&&this.gift.startx<=hurdle.endx)){  //any hurdle in scope
        if(dy<0){
          if(this.gift.starty+dy<=hurdle.endy){
            return canvaserr||this.gift.endy>hurdle.starty
          }
        } else {
          if(this.gift.endy+dy>=hurdle.starty){
            return canvaserr||this.gift.starty<hurdle.endy
          }
        }
      }
      return canvaserr;
    })) {
      passed = false;
    }
    else {
      this.gift.starty+=dy;
      this.gift.endy+=dy;
    }
    this.context.drawImage(this.thegift,this.gift.startx,this.gift.starty);
    this.context.drawImage(this.thebasket,this.basket.startx,this.basket.starty);
    return passed;
  }
  onCollision(){
    this.context.clearRect(this.gift.startx, this.gift.starty, this.gift.width, this.gift.height);
    this.context.drawImage(this.brokengift,this.gift.startx,this.gift.starty-this.brokengift.height+40);
    setTimeout(() => {
      this.context.clearRect(this.gift.startx, this.gift.starty-this.brokengift.height+40, this.brokengift.width, this.brokengift.height);
      this.context.clearRect(this.gift.startx, this.gift.starty, this.gift.width, this.gift.height);
      this.context.clearRect(this.basket.startx,this.basket.starty,this.basket.width,this.basket.height);
      this.gift.startx = this.gift.width;
      this.gift.starty = this.canvas.height-this.gift.height;
      this.gift.endx = this.thegift.width*2;
      this.gift.endy = this.canvas.height;
      this.context.drawImage(this.thegift,this.gift.startx,this.gift.starty);
      this.context.drawImage(this.thebasket,this.basket.startx,this.basket.starty);
    }, 500);
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