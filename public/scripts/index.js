/**
 * Main workspace class.
 */
class BlocklyWorkspace {
  levels = document.getElementsByName('level');
  game;
  level = localStorage.getItem("level")||0;
  constructor() {
    this.initLevels();
    this.initBlocks();
    this.initActions();
    this.game = new Game(this.level);
    this.game.setScore();
    if(!sessionStorage.getItem("dispalert"))
      alert("Click \'Displacements\' to choose blocks for movement.");
    sessionStorage.setItem("dispalert",true);
  }

  /**
   * Initializes level radios.
   */
  initLevels(){
    this.levels[this.level].click();
    this.levels.forEach((level,l)=>{
      level.onchange=_=>{
        if(level.checked){
          this.level = l;
          localStorage.setItem("level",l);
          this.game = new Game(l);
          this.game.setScore();
        }
      }
    });
  }

  /**
   * Initializes blockly blocks
   */
  initBlocks(){
    [{
      name:'vertical_pos',
      field:'dy',
      color:220,
      caption:'Vertical:',
      action:(dy)=>`this.game.yOffset(${-dy})&&`
    },{
      name:'horizontal_pos',
      field:'dx',
      color:130,
      caption:'Horizontal:',
      action:(dx)=>`this.game.xOffset(${dx})&&`
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

  /**
   * Initializes bottom actions
   */
  initActions(){
    const shoot = document.getElementById("shoot");
    const action=()=>{
      Blockly.JavaScript.addReservedWords("code");
      let code = Blockly.JavaScript.workspaceToCode(this.workspace);
      if(code){
        eval(`if(!(${code.substr(0,code.length-2)})){
          shoot.onclick=_=>{}
          this.game.onCollision();
          shoot.onclick=_=>{action();}
        } else if(this.game.giftInBasket()){
          shoot.onclick=_=>{}
          this.game.setScore(true);
          alert("You Won!");
          location.reload();
        } else {
          shoot.onclick=_=>{action();}
        }`);
      }
    }
    shoot.onclick = (_) => {action()};
    document.getElementById("reset").onclick = (_) => {
      Blockly.mainWorkspace.clear();
      this.game.resetGame();
    };

    document.getElementById("undo").onclick = (_) => {
      Blockly.mainWorkspace.undo();
    };
    
    document.getElementById("redo").onclick = (_) => {
      Blockly.mainWorkspace.undo(true);
    };
  }
}

/**
 * For every new game. Default contructor repaints canvas, and resets everything.
 */
class Game {
  canvas = document.getElementById("canvas");
  context = this.canvas.getContext("2d");
  thegift = document.getElementById("gift");
  brokengift = document.getElementById("brokengift");
  hurdle = document.getElementById("hurdle");
  thebasket = document.getElementById("basket");

  gift = {};
  basket = {};
  hurdles = [];
  level = 0;

  constructor(level = 0) {
    Blockly.mainWorkspace.clear();
    this.level = level;
    this.resetGame(level);
  }

  /**
   * Resets the game canvas to default view according to level, clears canvas, resets gift, resets basket, resets hurdles.
   * @param {Number} level The index indicating game level.
   */
  resetGame(level = 0){
    this.clearCanvas();
    this.resetGift();
    this.resetBasket();
    this.setHurdles(level);
  }

  /**
   * Clears the canvas
   */
  clearCanvas(){
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height); 
  }

  /**
   * Resets the gift to default position
   */
  resetGift(){
    this.gift = {
      width:this.thegift.width,
      height:this.thegift.height,
      startx:this.thegift.width,
      endx:this.thegift.width*2,
      starty:this.canvas.height-this.thegift.height,
      endy:this.canvas.height
    }
    this.setGift();
  }

  /**
   * Resets basket to default position.
   */
  resetBasket(){
    this.basket = {
      height:this.thebasket.height,
      width:this.thebasket.width,
      startx:this.canvas.width-200,
      endx:this.canvas.width-200+this.thebasket.width,
      starty:this.canvas.height-this.thebasket.height,
      endy:this.canvas.height,
      center:this.canvas.width-200+(this.thebasket.width/2)
    }
    this.context.drawImage(this.thebasket,this.basket.startx,this.basket.starty);
  }

  /**
   * Sets the gift to its current game position
   */
  setGift(){
    this.context.drawImage(this.thegift,this.gift.startx,this.gift.starty);
  }

  /**
   * Breaks the gift at its current game postion
   */
  breakGift(){
    this.context.clearRect(this.gift.startx, this.gift.starty, this.gift.width, this.gift.height);
    this.context.drawImage(this.brokengift,this.gift.startx,this.gift.starty-this.brokengift.height+40);
  }

  /**
   * Sets hurdles and their positions according to the game level.
   * @param {Number} level The level of current game.
   */
  setHurdles(level){
    [[[300,280]],[[200,280],[500,100]],[[200,200],[350,0],[500,280]]][level]  //start coordinates for all hurdles of level
      .forEach((hurdle,h)=>{
        this.hurdles.push({
          startx:hurdle[0],
          starty:hurdle[1],
          endx:hurdle[0]+this.hurdle.width,
          endy:hurdle[1]+this.hurdle.height
        })
        this.context.drawImage(this.hurdle,this.hurdles[h].startx,this.hurdles[h].starty);
      });
  }

  /**
   * Moves gift by given amount in x axis, with checking collision and breaking gift if any.
   * @param {Number} dx The amount of movement in x axis (horizontal direction)
   * @returns {Boolean} If movement is completed without collision, returns true, or otherwise.
   */
  xOffset(dx){
    let passed = true;
    this.context.clearRect(this.gift.startx, this.gift.starty, this.gift.width, this.gift.height);
    if(this.hurdles.some((hurdle)=>{
      const canvaserr = this.gift.startx+dx<0  //negative
        || this.gift.endx+dx>this.canvas.width;  //out of canvas
      if((this.gift.endy>=hurdle.starty&&this.gift.endy<=hurdle.endy)
          ||(this.gift.starty>=hurdle.starty&&this.gift.starty<=hurdle.endy)){  //any hurdle in scope
        if(dx<0){ //moving back
          if(this.gift.startx+dx<=hurdle.endx){ //about to collide backwards
            if(this.gift.endx>hurdle.startx){ //is in right side of hurdle
              this.gift.startx = hurdle.endx;
              this.gift.endx = hurdle.endx + this.gift.width;
              return true;
            }
          }
        } else {  //moving forward
          if(this.gift.endx+dx>=hurdle.startx){ //about to collide forwards
            if(this.gift.startx<hurdle.endx){ //is in left side of hurdle
              this.gift.endx = hurdle.startx;
              this.gift.startx = hurdle.startx - this.gift.width;
              return true;
            }
          }
        }
      } else {
        if(canvaserr) //colliding with canvas
          if(dx<0){ //backwards
            this.gift.startx = 0;
            this.gift.endx = this.gift.width;
          } else {  //forwards
            this.gift.startx = this.canvas.width - this.gift.width;
            this.gift.endx = this.canvas.width;
          }
      }
      return canvaserr;
    })){
      passed = false;
    }
    else {  //no collision
      this.gift.startx+=dx;
      this.gift.endx+=dx;
    }
    this.clearCanvas();
    this.setHurdles(this.level);
    this.setGift();
    this.resetBasket();
    return passed;
  }
  
  /**
   * Moves gift by given amount in y axis, with checking collision and breaking gift if any.
   * @param {Number} dy The amount of movement in y axis (vertical direction)
   * @returns {Boolean} If movement is completed without collision, returns true, or otherwise.
   */
  yOffset(dy){
    let passed = true;
    this.context.clearRect(this.gift.startx, this.gift.starty, this.gift.width, this.gift.height);
    this.context.clearRect(this.basket.startx,this.basket.starty,this.basket.width,this.basket.height);
    if(this.hurdles.some((hurdle)=>{
      const canvaserr =  this.gift.starty+dy<0  //negative
        || this.gift.endy+dy>this.canvas.height //out of canvas
        if((this.gift.endx>=hurdle.startx&&this.gift.endx<=hurdle.endx)
          ||(this.gift.startx>=hurdle.startx&&this.gift.startx<=hurdle.endx)){  //any hurdle in scope
        if(dy<0){ //moving up
          if(this.gift.starty+dy<=hurdle.endy){ //about to collide
            if(this.gift.endy>hurdle.starty){ //is in bottom side of hurdle
              this.gift.starty = hurdle.endy;
              this.gift.endy = hurdle.endy + this.gift.width;
              return true;
            }
          }
        } else {  //moving down
          if(this.gift.endy+dy>=hurdle.starty){ //about to collide
            if(this.gift.starty<hurdle.endy){ //is in top side of hurdle
              this.gift.endy = hurdle.starty;
              this.gift.starty = hurdle.starty - this.gift.width;
              return true;
            }
          }
        }
      } else {
        if(canvaserr) //colliding with canvas
          if(dy<0){ //upwards
            this.gift.starty = 0;
            this.gift.endy = this.gift.height;
          } else {  //downwards
            this.gift.starty = this.canvas.height - this.gift.height;
            this.gift.endy = this.canvas.height;
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
    this.clearCanvas();
    this.setHurdles(this.level);
    this.setGift();
    this.resetBasket();
    return passed;
  }

  /**
   * Checks if gift is inside basket
   * @returns {Boolean} true if inside, else false.
   */
  giftInBasket(){
    return this.gift.startx>this.basket.startx&&this.gift.endx<this.basket.endx&&this.gift.endy<=this.basket.endy&&this.gift.starty>this.basket.starty;
  }

  /**
   * Sets canvas for collision view, and resets game for current level.
   */
  onCollision(){
    this.breakGift()
    setTimeout(() => {
      this.resetGame(this.level);
    }, 800);
  }

  /**
   * Saves and displays score, updates if needed.
   * @param {Boolean} update If true, will increase the score by 1 and save.
   */
  setScore(update = false){
    const id = `${this.level}score`
    let score;
    if(update){
      score = localStorage.getItem(id)?Number(localStorage.getItem(id))+1:1
    } else {
      score = localStorage.getItem(id)||0;
    }
    localStorage.setItem(id,score);
    document.getElementById("score").innerHTML = localStorage.getItem(id);
    document.getElementById("clearScore").onclick =_=>{ 
      localStorage.removeItem(id)
      document.getElementById("score").innerHTML = 0;
    }
  }
}

window.onload = (_) => window.app = new BlocklyWorkspace();
