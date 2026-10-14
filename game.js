(()=>{'use strict';const $=s=>document.querySelector(s),canvas=$('#stage'),ctx=canvas.getContext('2d');const W=1200,H=650,TAU=Math.PI*2;let game=null,items=[],selected=[0,1,2,3,4,5,6,7,8,9,10],round=0,score=0,target=null,wrong=0,state='idle',phase=0,clock=0,anim=null,token=0,last=0,particles=[],hint=false,feedbackUntil=0,ambient=0,audioCtx=null;const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),lerp=(a,b,t)=>a+(b-a)*t,smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t)},rnd=(a,b)=>a+Math.random()*(b-a),choose=a=>a[Math.floor(Math.random()*a.length)],shuffle=a=>{let b=[...a];for(let i=b.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b};const numbers=$('#numbers');for(let n=0;n<=10;n++){let b=document.createElement('button');b.className='num selected';b.textContent=n;b.onclick=()=>{if(selected.includes(n)){if(selected.length===1)return;selected=selected.filter(x=>x!==n);b.classList.remove('selected')}else{selected.push(n);b.classList.add('selected')}};numbers.append(b)}function sound(type){if(!$('#music').checked)return;try{audioCtx??=new(window.AudioContext||window.webkitAudioContext)();audioCtx.resume();const t=audioCtx.currentTime;const beep=(f,d,kind='sine',vol=.08,delay=0)=>{let o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=kind;o.frequency.setValueAtTime(f,t+delay);g.gain.setValueAtTime(.0001,t+delay);g.gain.exponentialRampToValueAtTime(vol,t+delay+.014);g.gain.exponentialRampToValueAtTime(.0001,t+delay+d);o.connect(g).connect(audioCtx.destination);o.start(t+delay);o.stop(t+delay+d+.01)};if(type==='good'){beep(540,.15,'sine',.07);beep(720,.18,'sine',.07,.12);beep(950,.3,'sine',.09,.25)}else if(type==='wrong'){beep(250,.19,'triangle',.07);beep(205,.25,'triangle',.055,.13)}else if(type==='splash'){beep(175,.2,'sawtooth',.025);beep(130,.3,'triangle',.04,.12)}else if(type==='reel'){beep(460,.1,'triangle',.03);beep(540,.1,'triangle',.03,.1)}else if(type==='bite'){beep(210,.12,'triangle',.06);beep(320,.12,'triangle',.035,.12)}else beep(420,.11,'sine',.04)}catch{}}function speak(){if(state==='animating'||state==='complete'||target===null||target===undefined||!('speechSynthesis'in window))return;try{speechSynthesis.cancel();let u=new SpeechSynthesisUtterance(String(target));u.lang='en-US';const voices=speechSynthesis.getVoices();u.voice=voices.find(v=>v.lang==='en-US'&&/Google|Microsoft|Samantha/i.test(v.name))||voices.find(v=>v.lang.startsWith('en'))||null;u.rate=.78;u.pitch=1.08;u.volume=1;speechSynthesis.speak(u)}catch{}}function feedback(msg,ms=900){let el=$('#feedback');el.textContent=msg;el.classList.add('show');feedbackUntil=performance.now()+ms}function hideFeedback(){if(performance.now()>feedbackUntil)$('#feedback').classList.remove('show')}function reset(){token++;if('speechSynthesis'in window)speechSynthesis.cancel();game=null;items=[];target=null;anim=null;state='idle';particles=[];$('#gameScreen').classList.add('hidden');$('#homeScreen').classList.remove('hidden');$('#feedback').classList.remove('show')}function start(which){game=which;score=0;round=0;token++;$('#homeScreen').classList.add('hidden');$('#gameScreen').classList.remove('hidden');$('#gameTitle').textContent=which==='fish'?'🎣 FISHING ADVENTURE':'🐒 FEED THE MONKEY';$('#instruction').textContent=which==='fish'?'Tap the fish with the number you hear.':'Tap the banana with the number you hear.';newRound()}function newRound(){
 token++;anim=null;state='idle';wrong=0;hint=false;particles=[];
 let pool=shuffle(selected),count=pool.length;
 items=pool.map((n,i)=>({n,i,alive:true,x:0,y:0,baseX:0,baseY:0,
  dir:i%2?1:-1,face:i%2?1:-1,seed:rnd(0,TAU),speed:rnd(36,64),vx:0,vy:0,
  kind:(game==='fish'&&count>=5&&i===count-1?7:(i+(round%7))%7),
  tailSeed:rnd(0,TAU),zone:null,orbit:rnd(0,TAU),orbitPeriod:10,
  laneAmpX:0,laneAmpY:0,escapeAt:-100,escapeDir:1}));
 target=choose(items).n;
 items.forEach((o,i)=>{
  if(game==='fish'){
   const cols=count>=5?4:count===4?2:count;
   const rows=Math.ceil(count/cols);
   const left=54,right=1146,top=132,bottom=568;
   const w=(right-left)/cols,h=(bottom-top)/rows;
   const col=i%cols,row=Math.floor(i/cols);
   o.zone={minX:left+col*w,maxX:left+(col+1)*w,
    minY:top+row*h,maxY:top+(row+1)*h};
   o.baseX=(o.zone.minX+o.zone.maxX)/2;
   o.baseY=(o.zone.minY+o.zone.maxY)/2;
   const size=count>=9?.75:count>=5?.92:1.13;
   const radX=(o.kind===1||o.kind===2?132:o.kind===7?125:o.kind===6?106:112)*size;
   const radY=(o.kind===6?91:o.kind===7?79:o.kind===4?80:88)*size;
   o.laneAmpX=Math.max(0,Math.min(count>=9?24:count>=5?42:77,w/2-radX-13));
   o.laneAmpY=Math.max(0,Math.min(count>=9?6:count>=5?13:25,h/2-radY-9));
   if(o.kind===7){o.laneAmpY=0;o.baseY=o.zone.maxY-radY-10}
   o.orbitPeriod=(o.kind===1?9.7:o.kind===2?9.1:o.kind===6?11.6:o.kind===7?12.4:10.4)+(i%3)*.9;
   const theta=clock*TAU/o.orbitPeriod+o.orbit;
   o.x=o.baseX+o.laneAmpX*Math.sin(theta);
   o.y=o.baseY+(o.kind===7?0:o.laneAmpY*Math.sin(theta*.76+o.seed));
   o.dir=Math.cos(theta)>=0?1:-1;o.face=o.dir;
  }else{
   let cols=Math.ceil(items.length/3),row=Math.floor(i/cols),col=i%cols;
   o.baseX=75+(col+.5)*(680/cols);o.baseY=155+row*170;
   o.x=o.baseX;o.y=o.baseY;
  }
 });updateStats();let id=token;
 setTimeout(()=>{if(token===id&&game)speak()},400)
}
function updateStats(){$('#score').textContent='⭐ '+score;$('#progress').textContent=round+' / '+items.length}function finish(){if($('#infinite').checked){round=0;newRound();return}state='complete';feedback('🏆 Great work! Play again?',300000)}function next(){if(items.every(o=>!o.alive)){finish();return}wrong=0;hint=false;state='idle';target=choose(items.filter(o=>o.alive)).n;updateStats();let id=token;setTimeout(()=>{if(id===token&&game)speak()},550)}function clickObject(o){if(state!=='idle'||!o.alive)return;if(o.n!==target){wrong++;sound('wrong');feedback('Try again! · Listen once more',900);if(game==='fish'){o.scare=performance.now();o.burst=.75;const away=o.x<(o.zone.minX+o.zone.maxX)/2?1:-1;o.vx=away*rnd(160,210);o.vy=o.kind===7?0:rnd(-85,85)}else{o.shake=performance.now();o.cryUntil=performance.now()+1200}if(wrong>=2)hint=true;return}state='animating';hint=false;anim={o,t:0,stage:0,fromX:o.x,fromY:o.y,fishX:o.x,fishY:o.y,hookX:0,hookY:0,grip:false,events:new Set()};sound('tap')}function completeCorrect(){if(!anim)return;anim.o.alive=false;score++;round++;sound('good');feedback('Excellent! ⭐',1050);updateStats();state='transition';anim=null;let id=token;setTimeout(()=>{if(id===token&&game)next()},1150)}function canvasPoint(e){let r=canvas.getBoundingClientRect();const k=Math.min(r.width/W,r.height/H),ox=(r.width-W*k)/2,oy=(r.height-H*k)/2;return{x:(e.clientX-r.left-ox)/k,y:(e.clientY-r.top-oy)/k}}canvas.addEventListener('pointerup',e=>{if(!game||state!=='idle')return;const p=canvasPoint(e);let hit=items.filter(o=>o.alive).reverse().find(o=>{let dx=p.x-o.x,dy=p.y-o.y;return game==='fish'?(!o.zone||(p.x>=o.zone.minX&&p.x<=o.zone.maxX&&p.y>=o.zone.minY&&p.y<=o.zone.maxY))&&Math.abs(dx)<(items.length>8?99:items.length>4?120:151)&&Math.abs(dy)<(items.length>8?60:items.length>4?76:98):Math.abs(dx)<Math.min(110,350/Math.ceil(items.length/3))&&Math.abs(dy)<77});if(hit)clickObject(hit)});$('#listen').onclick=speak;$('#restart').onclick=()=>{if(game){score=0;round=0;newRound()}};$('#home').onclick=reset;$('#full').onclick=()=>{if(!document.fullscreenElement)document.documentElement.requestFullscreen?.();else document.exitFullscreen?.()};document.querySelectorAll('[data-game]').forEach(b=>b.onclick=()=>start(b.dataset.game));function path(points,stroke,width=3){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.lineCap='round';ctx.stroke()}function ellipse(x,y,rx,ry,color,rot=0){ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,TAU);ctx.fill();ctx.restore()}function text(str,x,y,size=55,color='#fff',outline='#163650'){ctx.save();ctx.font=`1000 ${size}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=Math.max(5,size/8);ctx.strokeStyle=outline;ctx.strokeText(str,x,y);ctx.fillStyle=color;ctx.fillText(str,x,y);ctx.restore()}function roundRect(x,y,w,h,r,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill()}function grad(a,b){let g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,a);g.addColorStop(1,b);return g}function backgroundFish(t){ctx.fillStyle=grad('#1ab6db','#04467f');ctx.fillRect(0,0,W,H);for(let i=0;i<9;i++){let x=70+i*145+Math.sin(t*.18+i)*18;path([[x-130,0],[x+45,650]],'#ffffff0c',55)}for(let i=0;i<36;i++){let x=(i*193+45)%W,y=(i*117+t*(12+i%5*6))%H;ellipse(x,H-y,3+i%3,3+i%3,'#a3eaff50')}ctx.fillStyle='#d5c591';ctx.beginPath();ctx.moveTo(0,600);ctx.quadraticCurveTo(350,560,620,606);ctx.quadraticCurveTo(940,630,1200,580);ctx.lineTo(1200,650);ctx.lineTo(0,650);ctx.fill();for(let i=0;i<13;i++){let x=i*101+25,h=45+(i*17)%85;path([[x,624],[x-9,624-h*.55],[x+6,624-h]],i%2?'#36ad84':'#2a9b87',9)}for(let i=0;i<6;i++){let x=70+i*215;ellipse(x,604,34,16,i%2?'#ff986a':'#ffcc7a')}}function fish(o,t){
 const x=o.x,y=o.y,k=o.kind,scale=items.length>8?.75:items.length>4?.92:1.13;
 const wave=Math.sin(t*(k===6?3.2:k===7?4.0:6.1)+o.tailSeed);
 const wag=wave*.17;
 const palette=[['#ffc548','#f57d29'],['#84b3ce','#446e98'],['#8be0f1','#3da0c5'],['#f3afdf','#a657ab'],['#ffdd7a','#ed9f3b'],['#ff9f78','#d85c52'],['#c89ded','#7f54ae'],['#f2ad81','#d86648']];
 const [light,dark]=palette[k];
 ctx.save();ctx.translate(x,y);const turn=k===6||k===7?1:(Math.sign(o.face)||1)*(.23+.77*Math.abs(o.face));ctx.scale(turn*scale,scale);
 if(k===6){ // OCTOPUS — pear-shaped mantle and eight independent tentacles.
  for(let j=0;j<8;j++){
   const x0=-50+j*14,sw=Math.sin(t*2.0+j*.9+o.seed)*12;
   ctx.beginPath();ctx.moveTo(x0,13);
   ctx.bezierCurveTo(x0-17,40,x0+sw-16,60,x0+sw-21,76+j%3*4);
   ctx.strokeStyle=j%2?'#a760c6':'#c88ade';ctx.lineWidth=12;ctx.lineCap='round';ctx.stroke();
   ellipse(x0+sw-17,66+j%3*4,2.4,3.2,'#f9d8f9');
  }
  ellipse(0,-7,72,69,dark);ellipse(-4,-15,67,63,light);
  ellipse(-17,-47,39,15,'#f9d6fa8a');ellipse(30,0,15,20,'#fff');ellipse(32,0,8,12,'#2e3a54');
  ellipse(-24,2,13,17,'#fff');ellipse(-21,3,7,10,'#253653');
  ctx.strokeStyle='#754178';ctx.lineWidth=3;ctx.beginPath();ctx.arc(7,27,11,.1,Math.PI-.1);ctx.stroke();
 }else if(k===7){ // CRAB — crab scuttles sideways on the seabed, never swims midwater.
  for(let j=0;j<3;j++)for(const side of [-1,1]){
   ctx.beginPath();ctx.moveTo(side*(25+j*15),23);ctx.quadraticCurveTo(side*(65+j*9),25+j*8,side*(91+j*4),53+j*5);
   ctx.strokeStyle='#bd543c';ctx.lineWidth=9;ctx.lineCap='round';ctx.stroke();
  }
  for(const side of [-1,1]){
   ctx.beginPath();ctx.moveTo(side*50,1);ctx.quadraticCurveTo(side*90,-29,side*103,-31);ctx.strokeStyle='#c75e43';ctx.lineWidth=13;ctx.stroke();
   ellipse(side*108,-33,23,21,'#ef8460');ellipse(side*112,-49,12,7,'#ffbb8c');
   path([[side*36,-25],[side*36,-47]],'#ad4739',9);
   ellipse(side*36,-53,13,14,'#fff');ellipse(side*39,-53,6,8,'#233449');
  }
  const shell=ctx.createLinearGradient(0,-45,0,51);shell.addColorStop(0,'#ffd1a0');shell.addColorStop(.42,'#f79b70');shell.addColorStop(1,'#ba4a39');
  ellipse(0,11,73,49,shell);ellipse(-28,-7,31,11,'#fff1d28c');
 }else if(k===1||k===2){ // SHARK & DOLPHIN — distinct hydrodynamic bodies.
  const shark=k===1;
  ctx.save();ctx.translate(-91,0);ctx.rotate(wag);
  ctx.fillStyle=dark;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-45,-57);ctx.lineTo(-36,-1);ctx.lineTo(-48,52);ctx.closePath();ctx.fill();ctx.restore();
  const skin=ctx.createLinearGradient(0,-50,0,52);skin.addColorStop(0,light);skin.addColorStop(.8,dark);skin.addColorStop(1,'#27496c');ctx.fillStyle=skin;
  ctx.beginPath();ctx.moveTo(-98,-4);ctx.bezierCurveTo(-47,-61,50,-51,93,-17);
  ctx.quadraticCurveTo(shark?113:129,shark?-5:-6,shark?105:121,9);
  ctx.bezierCurveTo(61,54,-34,49,-97,19);ctx.closePath();ctx.fill();
  ctx.fillStyle=dark;ctx.beginPath();ctx.moveTo(-16,-35);ctx.lineTo(12,shark?-98:-77);ctx.lineTo(43,-32);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(-12,22);ctx.lineTo(-59,63);ctx.lineTo(29,30);ctx.closePath();ctx.fill();
  ctx.fillStyle='#f3f8fa';ctx.beginPath();ctx.moveTo(-52,24);ctx.bezierCurveTo(0,56,71,29,100,5);ctx.quadraticCurveTo(14,17,-52,24);ctx.fill();
  ellipse(78,-12,6,8,'#182f42');ellipse(76,-15,2.2,2.6,'#fff');
  if(shark){for(let j=0;j<3;j++)path([[42-j*8,1],[43-j*8,12]],'#385972',2.5)}
  else{ctx.strokeStyle='#396787';ctx.lineWidth=2;ctx.beginPath();ctx.arc(96,10,9,Math.PI*1.08,Math.PI*1.83);ctx.stroke()}
  ctx.save();ctx.globalAlpha=.25;ellipse(-34,-26,36,8,'#fff');ctx.restore();
 }else{ // CLOWNFISH, ANGELFISH, PUFFER, SPOTTED REEF FISH
  const puffer=k===4,angel=k===5;
  ctx.save();ctx.translate(-72,1);ctx.rotate(wag);
  ctx.fillStyle=dark;ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(-35,-62,-63,-48);ctx.quadraticCurveTo(-41,0,-63,48);ctx.quadraticCurveTo(-28,60,0,0);ctx.fill();ctx.restore();
  ctx.fillStyle=dark;ctx.beginPath();ctx.moveTo(-24,-30);ctx.quadraticCurveTo(3,angel?-116:-84,43,-31);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(-3,29);ctx.quadraticCurveTo(-34,68,46,37);ctx.closePath();ctx.fill();
  const skin=ctx.createLinearGradient(-85,-47,78,51);skin.addColorStop(0,'#ffecbe');skin.addColorStop(.2,light);skin.addColorStop(.78,dark);skin.addColorStop(1,'#92425b');
  ctx.fillStyle=skin;ctx.beginPath();ctx.ellipse(0,0,puffer?70:83,puffer?69:angel?62:54,0,0,TAU);ctx.fill();
  ctx.save();ctx.globalAlpha=.23;ellipse(-19,-26,48,15,'#fff');ctx.restore();
  if(k===0){ // Clownfish white bands outlined in midnight brown.
   for(const bx of [-42,-2,42]){
    ctx.save();ctx.beginPath();ctx.ellipse(0,0,83,54,0,0,TAU);ctx.clip();
    path([[bx-7,-57],[bx+2,-23],[bx-5,16],[bx+5,56]],'#5f473b',20);
    path([[bx-7,-57],[bx+2,-23],[bx-5,16],[bx+5,56]],'#fff8e9',15);ctx.restore();
   }
  }else if(k===3){for(let j=0;j<7;j++)ellipse(-47+j*16,-20+((j*13)%47),4.3,6.2,'#fff7e4c9')}
  else if(k===4){for(let j=0;j<9;j++){let q=-Math.PI+j*Math.PI/8;path([[Math.cos(q)*69,Math.sin(q)*65],[Math.cos(q)*80,Math.sin(q)*76]],'#c98424',4)}}
  else if(k===5){for(let j=0;j<3;j++){path([[-52+j*39,-41],[-48+j*39,46]],'#fff6d4',12)}}
  ellipse(48,-17,13,16,'#fff');ellipse(51,-16,7,9,'#28354d');ellipse(53,-19,2,3,'#fff');
  ctx.strokeStyle='#604d4d';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(75,12,7,.1,1.5);ctx.stroke();
  ctx.strokeStyle='#ffffff70';ctx.lineWidth=2;ctx.beginPath();ctx.arc(39,0,12,-1.2,1.3);ctx.stroke();
 }
 ctx.restore();
 // The number remains truly upright, independent of swimming direction.
 let yN=k===7?20:k===6?-4:8;
 const labelSize=(items.length>8?95:items.length>4?92:88)*scale;
 ctx.save();ctx.shadowColor='#062f4d88';ctx.shadowBlur=6;
 text(o.n,x,y+yN*scale,labelSize,'#fffefa','#133f5c');ctx.restore();
 if(hint&&o.n===target){ctx.save();ctx.shadowBlur=24;ctx.shadowColor='#ffe879';ctx.strokeStyle='#fff27f';ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(x,y,138*scale,93*scale,0,0,TAU);ctx.stroke();ctx.restore()}
}
function rod(t){
 const a=game==='fish'?anim:null,at=a?a.t:0;
 // The rod remains anchored to the boat, with a smoothly steered tip.
 const pivot={x:1130,y:48}, startTip={x:815,y:65};
 const desired=a?{x:clamp(a.fromX+25,190,990),y:clamp(a.fromY-175,40,230)}:startTip;
 const aim=a?smooth(at/.48):0;
 const tip={x:lerp(startTip.x,desired.x,aim),y:lerp(startTip.y,desired.y,aim)};
 const drop=a?smooth((at-.48)/.88):0;
 const pull=a?smooth((at-1.62)/1.22):0;
 const fishScale=items.length>8?.75:items.length>4?.92:1.13;
 const mouth={x:a?a.fromX+a.o.dir*64*fishScale:tip.x,y:a?a.fromY-3:tip.y+58};
 const idleHook={x:tip.x+4,y:tip.y+52};
 const hook={x:lerp(idleHook.x,mouth.x,drop),y:lerp(idleHook.y,mouth.y,drop)};
 if(a&&at>=1.62){hook.x=lerp(mouth.x,tip.x+4,pull);hook.y=lerp(mouth.y,tip.y+50,pull)}
 ctx.save();ctx.lineCap='round';
 // Rod shaft, cork grip, glossy graphite blank, and guides.
 let tension=a?smooth((at-1.22)/.28)*(1-smooth((at-2.82)/.24)):0;let bend=92*tension;tip.y+=bend*.46;
 ctx.beginPath();ctx.moveTo(1200,-75);ctx.lineTo(pivot.x,pivot.y);ctx.quadraticCurveTo(lerp(pivot.x,tip.x,.55),lerp(pivot.y,tip.y,.55)-bend,tip.x,tip.y);
 ctx.strokeStyle='#42281c';ctx.lineWidth=23;ctx.stroke();ctx.strokeStyle='#d3a66a';ctx.lineWidth=16;ctx.stroke();ctx.strokeStyle='#f8d99b';ctx.lineWidth=4;ctx.stroke();
 ctx.beginPath();ctx.moveTo(pivot.x,pivot.y);ctx.quadraticCurveTo(lerp(pivot.x,tip.x,.55),lerp(pivot.y,tip.y,.55)-bend,tip.x,tip.y);ctx.strokeStyle='#384c57';ctx.lineWidth=7;ctx.stroke();
 for(let j=1;j<=4;j++){let f=j/5,x=lerp(pivot.x,tip.x,f),y=lerp(pivot.y,tip.y,f)-bend*Math.sin(Math.PI*f);ellipse(x,y,5,8,'#dbe9e9')}
 ellipse(1134,50,29,29,'#283d4c');ellipse(1134,50,23,23,'#bdcbd3');ellipse(1134,50,14,14,'#456777');ellipse(1134,50,5,5,'#e5f5f8');
 const spin=a&&at>1.62&&at<2.85?at*18:0;
 path([[1134+Math.cos(spin)*15,50+Math.sin(spin)*15],[1160+Math.cos(spin)*15,64+Math.sin(spin)*15]],'#e6d8a7',5);
 // A taut continuous line, always from the final guide to the hook.
 ctx.beginPath();ctx.moveTo(tip.x,tip.y);ctx.quadraticCurveTo((tip.x+hook.x)/2+Math.min(10,Math.abs(tip.x-hook.x)*.025),(tip.y+hook.y)/2+7,hook.x,hook.y);
 ctx.strokeStyle='#12384d88';ctx.lineWidth=4.5;ctx.stroke();ctx.strokeStyle='#f4faff';ctx.lineWidth=2;ctx.stroke();
 ctx.strokeStyle='#dce7e8';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(hook.x,hook.y-3);ctx.lineTo(hook.x,hook.y+12);ctx.arc(hook.x+9,hook.y+12,9,Math.PI,.12,true);ctx.stroke();
 ctx.restore();if(a){a.hookX=hook.x;a.hookY=hook.y;a.mouthOffset=a.o.dir*68*fishScale}
 return{hookX:hook.x,hookY:hook.y}
}
function drawFish(t){backgroundFish(t);let hook=rod(t);for(let o of items){if(!o.alive){continue}if(anim?.o===o&&anim.t>1.62){o.x=hook.hookX-(anim.mouthOffset||0);o.y=hook.hookY+3}else if(anim?.o===o){o.x=anim.fishX;o.y=anim.fishY}fish(o,t)}if(anim&&anim.t>1.33&&anim.t<1.66){for(let i=0;i<7;i++)ellipse(anim.fishX+Math.sin(i*2)*35,anim.fishY+Math.cos(i*2+t*4)*24,5,5,'#dcf9ff')}roundRect(20,18,285,47,16,'#053d6588');text('CATCH THE NUMBER!',162,42,23,'#fff','#12547a')}
function backgroundMonkey(t){ctx.fillStyle=grad('#b9f4ed','#9edb76');ctx.fillRect(0,0,W,H);ellipse(1050,110,100,100,'#fff3a2aa');for(let i=0;i<8;i++){let x=i*177-40;ellipse(x,90,155,100,i%2?'#51b977':'#75c98b');ellipse(x+25,140,115,80,'#389f6b')}ctx.fillStyle='#77ba67';ctx.fillRect(0,520,W,130);for(let i=0;i<24;i++){let x=i*53;path([[x,580],[x+Math.sin(t+i)*9,540]],'#3d9259',5)}roundRect(620,420,470,110,55,'#8d5b39');roundRect(625,410,460,60,30,'#bc8350');for(let i=0;i<4;i++)ellipse(665+i*95,455,22,8,'#e1a76c66')}
function bananaShape(x,y,scale=1,rotation=-.16,number=null){
 ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.scale(scale,scale);
 ctx.shadowColor='#183c214b';ctx.shadowBlur=10;ctx.shadowOffsetY=6;
 let skin=ctx.createLinearGradient(-70,-30,70,70);skin.addColorStop(0,'#fff7a6');skin.addColorStop(.34,'#ffe45c');skin.addColorStop(.72,'#ffc22e');skin.addColorStop(1,'#c98715');ctx.fillStyle=skin;
 ctx.beginPath();ctx.moveTo(-72,-43);ctx.bezierCurveTo(-62,6,-26,39,13,25);ctx.bezierCurveTo(42,18,64,-10,75,-37);ctx.bezierCurveTo(71,20,42,66,-3,70);ctx.bezierCurveTo(-51,71,-76,19,-72,-43);ctx.closePath();ctx.fill();ctx.shadowBlur=0;
 ctx.strokeStyle='#f6b22c';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-66,-35);ctx.bezierCurveTo(-26,52,39,70,70,-28);ctx.stroke();
 ctx.strokeStyle='#fff9ba';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-54,-29);ctx.bezierCurveTo(-22,32,32,48,60,-22);ctx.stroke();
 roundRect(-78,-51,16,13,4,'#67512c');roundRect(69,-45,16,13,4,'#6d5026');
 for(let i=0;i<9;i++){ellipse(-45+(i*37)%104,-8+(i*17)%48,2,3,'#b78320aa')}
 if(number!==null){ctx.rotate(-rotation);text(number,0,12,77,'#ffffff','#5b451a')}
 ctx.restore()
}
function banana(o,t){let shake=o.shake&&performance.now()-o.shake<560;bananaShape(o.x+(shake?Math.sin(t*30)*7:0),o.y,items.length>8?.88:items.length>6?1.00:1.15,-.16,o.n);if(hint&&o.n===target){ctx.save();ctx.shadowBlur=36;ctx.shadowColor='#fff465';ctx.strokeStyle=`rgba(255,245,85,${.75+.2*Math.sin(t*7)})`;ctx.lineWidth=9;ctx.beginPath();ctx.ellipse(o.x,o.y,items.length>8?90:112,items.length>8?75:92,0,0,TAU);ctx.stroke();ctx.restore()}}
function monkey(t){
 const a=game==='monkey'?anim:null,at=a?a.t:0;
 // Four continuous motion curves: approach -> reach -> take -> bring banana to mouth -> reset.
 const approach=a?smooth((at-.10)/.67):0;
 const reach=a?smooth((at-.81)/.53):0;
 const take=a?smooth((at-1.43)/.71):0;
 const eat=a?smooth((at-2.18)/.85):0;
 const back=a?smooth((at-3.08)/.44):0;
 const home={x:1002,y:257};
 const tx=a?a.fromX:0,ty=a?a.fromY:0;
 const walkTarget={x:a?clamp(tx+153,190,1052):home.x,y:a?clamp(ty-126,180,325):home.y};
 const mx=lerp(lerp(home.x,walkTarget.x,approach),home.x,back);
 const my=lerp(lerp(home.y,walkTarget.y,approach),home.y,back);
 const shoulder={x:mx-67,y:my+104};
 const mouth={x:mx-13,y:my+1};
 // Exact grip: banana center is always at palm + (25,12), including its FIRST attached frame.
 const grip={x:tx-25,y:ty-12};
 const rest={x:shoulder.x-48,y:shoulder.y+80};
 const handOut={x:lerp(rest.x,grip.x,reach),y:lerp(rest.y,grip.y,reach)};
 const mouthGrip={x:mouth.x-14-25,y:mouth.y-12};
 const hand={x:lerp(handOut.x,mouthGrip.x,take),y:lerp(handOut.y,mouthGrip.y,take)};
 const sad=!a&&items.some(o=>o.cryUntil&&performance.now()<o.cryUntil);
 const tilt=sad?Math.sin(t*14)*.085:0;
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 // Curved tail behind the character.
 ctx.strokeStyle='#7c5138';ctx.lineWidth=23;ctx.beginPath();ctx.moveTo(mx+67,my+136);
 ctx.bezierCurveTo(mx+181,my+156,mx+175,my+3,mx+116,my+17);ctx.stroke();
 ctx.strokeStyle='#c58b5b';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(mx+73,my+137);ctx.bezierCurveTo(mx+166,my+140,mx+168,my+9,mx+120,my+21);ctx.stroke();
 // Body, belly, feet, far arm remain anatomically connected.
 ellipse(mx,my+151,104,115,'#925b3c');ellipse(mx-3,my+149,97,106,'#b87c50');
 ellipse(mx-11,my+158,74,86,'#f1c59a');
 ellipse(mx-66,my+231,42,25,'#985c3a');ellipse(mx+52,my+231,42,25,'#985c3a');
 ctx.beginPath();ctx.moveTo(mx+69,my+116);ctx.quadraticCurveTo(mx+112,my+142,mx+83,my+184);
 ctx.strokeStyle='#895537';ctx.lineWidth=32;ctx.stroke();ellipse(mx+83,my+184,21,19,'#efba8f');
 // Head with rounded muzzle and eyes that look toward the chosen banana.
 ctx.save();ctx.translate(mx,my-51);ctx.rotate(tilt);
 ellipse(-105,-10,41,46,'#9b6141');ellipse(105,-10,41,46,'#9b6141');
 ellipse(-105,-10,25,28,'#eebd95');ellipse(105,-10,25,28,'#eebd95');
 ellipse(0,0,112,106,'#9c6341');ellipse(-6,-8,104,97,'#b77c50');
 ellipse(-17,-51,70,20,'#e6aa7a6c');
 ellipse(0,24,88,77,'#f4cea7');
 const look=a?clamp((tx-mx)/290,-1,1)*5:0;
 ellipse(-36,-19,18,20,'#fffaf4');ellipse(37,-19,18,20,'#fffaf4');
 ellipse(-37+look,-18,9,12,'#272a31');ellipse(37+look,-18,9,12,'#272a31');
 ellipse(-40+look,-23,3,4,'#fff');ellipse(35+look,-23,3,4,'#fff');
 ctx.strokeStyle='#7e513f';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-55,-46);ctx.quadraticCurveTo(-37,-54,-21,-45);ctx.moveTo(21,-45);ctx.quadraticCurveTo(38,-52,54,-44);ctx.stroke();
 ellipse(0,20,16,11,'#88513b');ellipse(-6,16,4,3,'#eeb98e');
 if(sad){ctx.strokeStyle='#85513b';ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,73,21,Math.PI*1.1,Math.PI*1.9);ctx.stroke();
  const tear=10*Math.abs(Math.sin(t*7));ellipse(-59,9+tear,6,14,'#6ed4ff');ellipse(58,9+tear,6,14,'#6ed4ff');
 }else if(a&&at>=2.16&&at<3.05){const bite=Math.abs(Math.sin((at-2.16)*Math.PI*6.7));
  ellipse(0,53,23,7+bite*12,'#7d493b');ellipse(0,61,12,3+bite*5,'#ee8e91');
 }else{ctx.strokeStyle='#804e3c';ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,42,23,.13,Math.PI-.13);ctx.stroke()}
 ctx.restore();
 // Solve a continuous two-bone IK elbow with consistent outward bend.
 const upper=109,lower=115;
 const dx=hand.x-shoulder.x,dy=hand.y-shoulder.y,rawLen=Math.hypot(dx,dy)||.00001;
 const len=clamp(rawLen,28,upper+lower-4),angle=Math.atan2(dy,dx);
 const b=Math.acos(clamp((upper*upper+len*len-lower*lower)/(2*upper*len),-1,1));
 const elbow={x:shoulder.x+upper*Math.cos(angle-b),y:shoulder.y+upper*Math.sin(angle-b)};
 const wrist={x:shoulder.x+dx*len/rawLen,y:shoulder.y+dy*len/rawLen};
 // Two limbs meet at the elbow. Unlike a one-segment Bezier, the curve actually passes the joint.
 const armPath=()=>{ctx.beginPath();ctx.moveTo(shoulder.x,shoulder.y);
  ctx.quadraticCurveTo((shoulder.x+elbow.x)/2,shoulder.y,elbow.x,elbow.y);
  ctx.quadraticCurveTo((elbow.x+wrist.x)/2,wrist.y,wrist.x,wrist.y)};
 armPath();ctx.strokeStyle='#754831';ctx.lineWidth=42;ctx.stroke();
 armPath();ctx.strokeStyle='#ae714c';ctx.lineWidth=33;ctx.stroke();
 ctx.save();ctx.globalAlpha=.38;ctx.beginPath();ctx.moveTo(shoulder.x-7,shoulder.y-4);
 ctx.lineTo(elbow.x-6,elbow.y-3);ctx.lineTo(wrist.x-5,wrist.y-2);ctx.strokeStyle='#e5aa7a';ctx.lineWidth=5;ctx.stroke();ctx.restore();
 ellipse(shoulder.x,shoulder.y,21,22,'#af764f');
 ellipse(elbow.x,elbow.y,18,19,'#b67851');
 // The palm is oriented along the forearm (not a detached flat icon).
 const handAngle=Math.atan2(wrist.y-elbow.y,wrist.x-elbow.x);
 ctx.save();ctx.translate(wrist.x,wrist.y);ctx.rotate(handAngle);
 ellipse(0,0,23,20,'#ebb68c');ellipse(0,-6,17,10,'#f7cba7');ctx.restore();
 const holding=a&&at>=1.43&&at<3.04;
 if(holding){
  const bananaScale=items.length>8?.88:items.length>6?1.00:1.15;
  bananaShape(wrist.x+25,wrist.y+12,bananaScale*(1-take*.37)*(1-eat*.94),-.16,null);
  // Thumb and curled fingers are drawn over the fruit; their positions follow the wrist exactly.
  ctx.save();ctx.translate(wrist.x,wrist.y);ctx.rotate(handAngle*.26);
  for(let j=0;j<3;j++)ellipse(9+j*12,16+j%2*3,7,14,'#eeb487');
  ellipse(28,-4,10,17,'#f7c79b');ctx.restore();
 }else{
  ctx.save();ctx.translate(wrist.x,wrist.y);ctx.rotate(handAngle);
  for(let j=0;j<4;j++)ellipse(16+j*2,-15+j*10,12,5.6,'#f4c199');
  ellipse(4,21,13,6,'#edb58a');ctx.restore();
 }
 window.__monkeyPose={shoulder,elbow,wrist,desired:hand,grip,mouth,holding,
   upperLength:Math.hypot(elbow.x-shoulder.x,elbow.y-shoulder.y),
   lowerLength:Math.hypot(elbow.x-wrist.x,elbow.y-wrist.y),at,mx,my};
 ctx.restore();
}
function drawMonkey(t){backgroundMonkey(t);for(let o of items)if(o.alive&&o!==anim?.o)banana(o,t);if(anim&&anim.t<1.43)banana(anim.o,t);monkey(t);roundRect(20,18,275,47,16,'#276738bb');text('FEED THE MONKEY!',155,42,23,'#fff','#285e3a')}
function frame(ts){let dt=Math.min(.04,(ts-last)/1000||0);last=ts;clock+=dt;hideFeedback();if(game){let dpr=Math.min(2,window.devicePixelRatio||1),r=canvas.getBoundingClientRect(),cw=Math.max(1,Math.round(r.width*dpr)),ch=Math.max(1,Math.round(r.height*dpr));if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch}ctx.setTransform(1,0,0,1,0,0);const surround=ctx.createLinearGradient(0,0,0,ch);if(game==='fish'){surround.addColorStop(0,'#1ab6db');surround.addColorStop(1,'#04467f')}else{surround.addColorStop(0,'#60bf81');surround.addColorStop(1,'#9edb76')}ctx.fillStyle=surround;ctx.fillRect(0,0,cw,ch);const k=Math.min(cw/W,ch/H);ctx.setTransform(k,0,0,k,(cw-W*k)/2,(ch-H*k)/2);if(anim){let old=anim.t;anim.t+=dt;if(game==='fish'){if(old<.48&&anim.t>=.48)sound('reel');if(old<1.35&&anim.t>=1.35)sound('splash');if(old<1.62&&anim.t>=1.62)sound('reel');if(anim.t>=3.04)completeCorrect()}else{if(old<1.28&&anim.t>=1.28)sound('tap');if(old<2.14&&anim.t>=2.14)sound('bite');if(old<2.55&&anim.t>=2.55)sound('bite');if(anim.t>=3.58)completeCorrect()}}if(game==='fish'){
 for(const o of items){if(!o.alive||anim?.o===o)continue;
  // Smooth loop within its own cell; never picks random waypoints or ricochets.
  const p=clock*TAU/o.orbitPeriod+o.orbit;
  const oldX=o.x,oldY=o.y;
  const baseX=o.baseX+o.laneAmpX*Math.sin(p);
  const baseY=o.baseY+(o.kind===7?0:o.laneAmpY*Math.sin(p*.76+o.seed));
  let fright=0;
  const u=(clock-o.escapeAt)/1.75;
  if(u>=0&&u<1)fright=Math.sin(Math.PI*u)**2;
  const avail=o.escapeDir>0?(o.zone.maxX-o.baseX):(o.baseX-o.zone.minX);
  const fleeDistance=Math.max(0,Math.min(o.laneAmpX+18,avail-100*(items.length>8?.75:items.length>4?.92:1.13)-8));
  o.x=clamp(baseX+fright*o.escapeDir*fleeDistance,o.zone.minX+10,o.zone.maxX-10);
  o.y=baseY;
  o.vx=(o.x-oldX)/Math.max(dt,.001);o.vy=(o.y-oldY)/Math.max(dt,.001);
  if(Math.abs(o.vx)>5)o.dir=o.vx>=0?1:-1;
  o.face+=((o.kind===6||o.kind===7?1:o.dir)-o.face)*(1-Math.exp(-dt*8));
 }
 drawFish(clock)}else drawMonkey(clock)}requestAnimationFrame(frame)}requestAnimationFrame(frame);
window.__oceanQA=()=>({game,state,round,score,target,wrong,hint,clock,
 canvas:{width:canvas.clientWidth,height:canvas.clientHeight},
 items:items.map(o=>({n:o.n,kind:o.kind,x:o.x,y:o.y,alive:o.alive,
  box:o.zone?{...o.zone}:null,ampX:o.laneAmpX,ampY:o.laneAmpY})),
 monkeyPose:window.__monkeyPose||null});
})();
