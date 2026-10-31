import {useLayoutEffect,useRef} from 'react';
import Phaser from 'phaser';
import {CHARACTERS,ROCKS,TRAPS,type RoomState} from '../shared/game';
import {socket} from './network';
import {touch} from './controls';
export function Island({state,playerId}:{state:RoomState;playerId:string}){
 const host=useRef<HTMLDivElement>(null);const latest=useRef(state);latest.current=state;
 useLayoutEffect(()=>{
  let seq=0;let lastInput=0;let seen=0;const sprites=new Map<string,Phaser.GameObjects.Container>();const treasures=new Map<string,Phaser.GameObjects.Container>();
  class IslandScene extends Phaser.Scene {
   keys!:Record<string,Phaser.Input.Keyboard.Key>;
   create(){this.cameras.main.setBackgroundColor('#147f91');this.drawIsland();
    this.keys=this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE') as typeof this.keys;
    this.input.keyboard!.addCapture(['UP','DOWN','LEFT','RIGHT','SPACE']);
   }
   drawIsland(){const g=this.add.graphics();
    g.fillStyle(0x3aaeb0,0.45);g.fillRoundedRect(42,35,1200,745,150);g.lineStyle(3,0xa7ede0,0.5);g.strokeRoundedRect(53,43,1175,725,145);
    g.fillStyle(0x0c5966,0.3);g.fillRoundedRect(67,72,1150,690,120);g.fillStyle(0xf8da8a);g.fillRoundedRect(66,58,1150,690,110);g.fillStyle(0xedd095);g.fillRoundedRect(85,80,1112,646,93);
    g.fillStyle(0x76b96b);g.fillRoundedRect(112,97,1058,586,82);g.fillStyle(0x8ac875);g.fillRoundedRect(132,112,1018,551,70);
    g.lineStyle(65,0xead397,1);g.beginPath();g.moveTo(175,650);g.lineTo(180,400);g.lineTo(365,400);g.lineTo(590,360);g.lineTo(700,480);g.lineTo(1090,480);g.lineTo(1090,640);g.strokePath();
    g.lineStyle(44,0xf2dda9,1);g.beginPath();g.moveTo(175,650);g.lineTo(180,400);g.lineTo(365,400);g.lineTo(590,360);g.lineTo(700,480);g.lineTo(1090,480);g.lineTo(1090,640);g.strokePath();
    let seed=51;const rand=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
    for(let i=0;i<210;i++){const x=145+rand()*980,y=125+rand()*510;g.fillStyle(i%3===0?0xd8e6a0:0x4b9c62,0.5);g.fillEllipse(x,y,3+rand()*7,3);}
    for(const r of ROCKS){g.fillStyle(0x326f60,0.23);g.fillEllipse(r.x+5,r.y+15,r.r*2.3,r.r*1.5);g.fillStyle(0x728d83);g.fillRoundedRect(r.x-r.r,r.y-r.r,r.r*2,r.r*1.7,17);g.fillStyle(0xa6b6a1);g.fillRoundedRect(r.x-r.r+4,r.y-r.r+3,r.r*1.8,r.r*0.65,12);g.fillStyle(0x4a9667);g.fillEllipse(r.x-10,r.y-r.r+1,r.r,13);}
    for(const t of TRAPS){g.fillStyle(0x674a45,0.18);g.fillEllipse(t.x,t.y+5,68,30);g.fillStyle(0xbd7958);g.fillCircle(t.x,t.y,t.r);g.fillStyle(0x6a5145);g.fillCircle(t.x,t.y,21);for(let i=0;i<5;i++){g.fillStyle(0xe8dbc2);g.fillTriangle(t.x-20+i*9,t.y+7,t.x-16+i*9,t.y-9,t.x-12+i*9,t.y+7);}this.add.text(t.x,t.y+36,'TRAP',{fontSize:'11px',fontFamily:'sans-serif',color:'#724d3b',fontStyle:'bold'}).setOrigin(.5);}
    const palm=(x:number,y:number,s=1)=>{const tree=this.add.graphics();tree.fillStyle(0x215c50,.18);tree.fillEllipse(x+18,y+11,100*s,25*s);tree.lineStyle(14*s,0x9c7046);tree.beginPath();tree.moveTo(x,y);tree.lineTo(x-9*s,y-60*s);tree.strokePath();tree.lineStyle(4*s,0xd9aa65);tree.beginPath();tree.moveTo(x-4*s,y-5*s);tree.lineTo(x-14*s,y-60*s);tree.strokePath();for(let i=0;i<7;i++){const a=i*Math.PI*2/7;tree.fillStyle(i%2?0x338358:0x216f52);tree.fillEllipse(x-9*s+Math.cos(a)*27*s,y-60*s+Math.sin(a)*16*s,75*s,22*s);}tree.fillStyle(0xd8ae65);tree.fillCircle(x-10*s,y-54*s,8*s);};
    [[113,190],[140,540],[1148,160],[1158,590],[525,120],[735,672],[935,118],[345,680]].forEach(([x,y])=>palm(x,y,.9));
    // Ancient arch, outside the traversable playfield.
    g.fillStyle(0x587975);g.fillRoundedRect(535,29,35,71,8);g.fillRoundedRect(704,29,35,71,8);g.fillStyle(0xa9b9a1);g.fillRoundedRect(528,20,218,30,8);g.fillStyle(0x4f9468);g.fillEllipse(570,23,76,15);g.fillEllipse(715,25,65,14);
    this.add.text(640,66,'WHISPERING RUINS',{fontSize:'13px',fontFamily:'sans-serif',fontStyle:'bold',color:'#f4edcb',letterSpacing:3}).setOrigin(.5);
    this.add.text(640,745,'C O R A L   C O V E',{fontSize:'14px',fontFamily:'sans-serif',color:'#fff1b7'}).setOrigin(.5);
    for(let i=0;i<18;i++){const wave=this.add.ellipse(15+i*75,772-(i%3)*5,28,3,0x9fe5dc,.45);this.tweens.add({targets:wave,x:wave.x+18,alpha:.1,duration:2000+i*80,yoyo:true,repeat:-1});}
   }
   avatar(id:string){const c=CHARACTERS.find(c=>c.id===id)!;const g=this.add.graphics();g.fillStyle(0x143b3c,.22);g.fillEllipse(0,17,37,14);g.fillStyle(0x173b40);g.fillRoundedRect(-13,0,26,24,8);g.fillStyle(c.color);g.fillCircle(0,-7,20);
    if(id==='rabbit'){g.fillRoundedRect(-15,-42,10,27,5);g.fillRoundedRect(5,-42,10,27,5);}else if(id==='frog'){g.fillCircle(-13,-22,9);g.fillCircle(13,-22,9);}else if(id==='bear'){g.fillCircle(-16,-23,9);g.fillCircle(16,-23,9);}else{g.fillTriangle(-20,-14,-20,-37,-4,-22);g.fillTriangle(20,-14,20,-37,4,-22);}
    g.fillStyle(0xffedcc);g.fillEllipse(0,-1,27,19);g.fillStyle(0x173b40);g.fillCircle(-8,-11,2.8);g.fillCircle(8,-11,2.8);g.fillTriangle(-3,-3,3,-3,0,1);g.fillStyle(0xffcb65);g.fillTriangle(-13,7,15,7,8,17);g.fillStyle(0xb67146);g.fillRoundedRect(-19,6,8,16,3);return g;
   }
   treasure(kind:string){const g=this.add.graphics();g.fillStyle(0x306b55,.16);g.fillEllipse(0,12,30,10);
    if(kind==='coin'){g.fillStyle(0xc28731);g.fillCircle(0,0,11);g.fillStyle(0xffd36d);g.fillCircle(-1,-2,10);g.lineStyle(2,0xfff0ac);g.strokeCircle(-1,-2,7);g.fillStyle(0xc28731);g.fillRect(-2,-7,2,10);}
    else if(kind==='diamond'){g.fillStyle(0x146c91);g.fillTriangle(-14,-6,14,-6,0,15);g.fillStyle(0x73e3db);g.fillTriangle(-14,-6,14,-6,0,-17);g.fillStyle(0xc2fff0);g.fillTriangle(-14,-6,0,-17,-4,-5);g.fillStyle(0x20bdb8);g.fillTriangle(-4,-5,14,-6,0,15);}
    else if(kind==='chest'){g.fillStyle(0x724931);g.fillRoundedRect(-20,-12,40,31,6);g.fillStyle(0xe5a844);g.fillRoundedRect(-20,-13,40,15,6);g.fillStyle(0xffda78);g.fillRect(-15,-12,5,30);g.fillRect(10,-12,5,30);g.fillRoundedRect(-5,-1,10,12,2);g.fillStyle(0x724931);g.fillCircle(0,3,2);}
    else {g.fillStyle(kind==='boots'?0xeebd63:0x99dbe9);g.fillCircle(0,0,16);g.lineStyle(2,0xffffff,.8);g.strokeCircle(0,0,13);g.fillStyle(0x28636c);if(kind==='boots'){g.fillRoundedRect(-7,-9,8,17,3);g.fillRoundedRect(-7,3,17,7,3);}else{g.fillTriangle(-9,-8,9,-8,0,12);g.fillRect(-9,-8,18,9);}}
    return g;
   }
   update(time:number,delta:number){const s=latest.current;const k=this.keys;if(!k)return;
    if(time-lastInput>50){lastInput=time;const x=touch.x+(k.D.isDown||k.RIGHT.isDown?1:0)-(k.A.isDown||k.LEFT.isDown?1:0);const y=touch.y+(k.S.isDown||k.DOWN.isDown?1:0)-(k.W.isDown||k.UP.isDown?1:0);if(socket.connected)socket.emit('input',{x:Math.max(-1,Math.min(1,x)),y:Math.max(-1,Math.min(1,y)),dig:touch.dig||k.SPACE.isDown,seq:seq++});}
    for(const t of s.treasures){let c=treasures.get(t.id);if(!c){c=this.add.container(t.x,t.y,[this.treasure(t.kind)]);c.setDepth(5);treasures.set(t.id,c);}c.setVisible(t.active&&!t.hidden);c.y=t.y+Math.sin(time/280+t.x)*3;}
    for(const p of s.players){let c=sprites.get(p.id);if(!c){const ring=this.add.ellipse(0,10,51,38).setStrokeStyle(2,p.id===playerId?0xffed9b:0xffffff,.7);const name=this.add.text(0,38,p.name+(p.id===playerId?' · YOU':''),{fontSize:'14px',fontFamily:'sans-serif',color:'#123c3c',fontStyle:'bold',backgroundColor:'#fff2c9',padding:{x:7,y:4}}).setOrigin(.5);c=this.add.container(p.x,p.y,[ring,this.avatar(p.character),name]);c.setDepth(20);sprites.set(p.id,c);}const moving=Math.abs(p.x-c.x)+Math.abs(p.y-c.y)>1;c.x=Phaser.Math.Linear(c.x,p.x,Math.min(1,delta/60));c.y=Phaser.Math.Linear(c.y,p.y,Math.min(1,delta/60));const art=c.list[1] as Phaser.GameObjects.Graphics;art.y=moving?Math.sin(time/65)*3:Math.sin(time/400)*1.3;c.setAlpha(p.connected?1:.4);const ring=c.list[0] as Phaser.GameObjects.Ellipse;ring.setStrokeStyle(p.shieldUntil>s.serverTime?4:2,p.shieldUntil>s.serverTime?0x9de6ff:p.id===playerId?0xffed9b:0xffffff,.8);}
    for(const [id,c] of sprites)if(!s.players.some(p=>p.id===id)){c.destroy();sprites.delete(id);}
    for(const e of s.events){if(e.id<=seen)continue;seen=Math.max(seen,e.id);if(e.x===undefined)continue;const label=this.add.text(e.x,e.y!-50,e.text.split(': ').slice(1).join(' ')||'✦',{fontSize:'17px',fontFamily:'sans-serif',color:e.kind==='trap'?'#a53835':'#fff6bf',stroke:'#255848',strokeThickness:3,fontStyle:'bold'}).setOrigin(.5).setDepth(50);this.tweens.add({targets:label,y:label.y-55,alpha:0,duration:1300,onComplete:()=>label.destroy()});}
   }
  }
  // Canvas suits this vector scene and avoids allocating WebGL contexts for every open room tab.
  // Attach during the layout lifecycle so continuous socket updates cannot defer canvas mounting.
  const game=new Phaser.Game({type:Phaser.CANVAS,parent:host.current!,width:1280,height:800,backgroundColor:'#147f91',scene:IslandScene,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},render:{antialias:true},audio:{noAudio:true}});
  const clear=()=>{touch.x=0;touch.y=0;touch.dig=false;};window.addEventListener('blur',clear);return()=>{clear();window.removeEventListener('blur',clear);game.destroy(true);};
 },[playerId]);
 return <div className="island-canvas" ref={host} aria-label="Treasure island. Move with WASD or arrow keys, dig with Space." role="application"/>;
}
