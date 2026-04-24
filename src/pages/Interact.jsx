import React, { useState, useEffect, useRef, useCallback } from 'react';

/* ─── PALETTE ─────────────────────────────────────────────── */
const C = {
  fur:'#D4956A', furDark:'#B87345', furDeep:'#9B5E30',
  belly:'#EDD4AA', earInner:'#E8A085', nose:'#2C1810',
  eye:'#1A0C08', white:'#FFFFFF', shine:'rgba(255,255,255,0.65)',
  blush:'rgba(232,130,100,0.26)', collar:'#4A7FE0', tag:'#E8A84C',
  tongue:'#E05878', tongueLine:'#B03455', brow:'#7A4825', mouth:'#7A4825',
};

/* ─── DRAW HELPERS ─────────────────────────────────────────── */
function rr(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y);
  ctx.quadraticCurveTo(x+w,y,x+w,y+r); ctx.lineTo(x+w,y+h-r);
  ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h); ctx.lineTo(x+r,y+h);
  ctx.quadraticCurveTo(x,y+h,x,y+h-r); ctx.lineTo(x,y+r);
  ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
}

function drawEye(ctx,ex,ey,ox,oy,blink,mood,sleeping){
  ctx.save(); ctx.translate(ex,ey);
  ctx.beginPath(); ctx.ellipse(0,0,11,11*Math.max(0.04,blink),0,0,Math.PI*2);
  ctx.fillStyle=C.white; ctx.fill();
  if(blink>0.25&&!sleeping){
    const px=Math.max(-4,Math.min(4,ox*4.5));
    const py=Math.max(-4,Math.min(3,oy*4));
    ctx.beginPath(); ctx.ellipse(px,py,7,7,0,0,Math.PI*2);
    ctx.fillStyle=C.eye; ctx.fill();
    ctx.beginPath(); ctx.ellipse(px+2.8,py-2.5,2.4,2.4,0,0,Math.PI*2);
    ctx.fillStyle=C.shine; ctx.fill();
    if(mood==='love'){
      ctx.font='bold 9px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillStyle='#E05878'; ctx.fillText('♥',px,py);
    }
  } else {
    ctx.lineWidth=2; ctx.strokeStyle=C.brow; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(-8,0); ctx.quadraticCurveTo(0,4,8,0); ctx.stroke();
  }
  ctx.restore();
}

/*
  drawDog — smooth natural animation via sin curves on time t.
  squashY: spring squash/stretch on landing (1=normal).
  No accumulated legAnim counters — all motion derived from t.
*/
function drawDog(ctx,cx,cy,sc,opts={}){
  const {
    t=0,eyeOffX=0,eyeOffY=0,tailAngle=0,blinkAmt=1,
    mood='happy',headTilt=0,
    sitting=false,sleeping=false,pawUp=false,
    dancing=false,eating=false,bathing=false,
    earPerk=0,squashY=1,bodyWobble=0,
  }=opts;

  ctx.save();
  ctx.translate(cx,cy);
  ctx.scale(sc,sc*squashY);

  const sY=sitting?10:0;
  const hY=sitting?-12:0;

  /* shadow scales inversely to squash so it stays grounded */
  ctx.save(); ctx.scale(1,1/squashY);
  const shadowW=52*(1+(1-squashY)*0.5);
  ctx.beginPath(); ctx.ellipse(0,76+sY,shadowW,10,0,0,Math.PI*2);
  ctx.fillStyle='rgba(44,24,16,0.08)'; ctx.fill();
  ctx.restore();

  /* ── TAIL ── smooth sin wag */
  ctx.save(); ctx.translate(50,14+sY); ctx.rotate(tailAngle);
  ctx.beginPath();
  ctx.moveTo(0,0);
  ctx.bezierCurveTo(30,-12,38,-32,22,-46);
  ctx.bezierCurveTo(13,-52,3,-46,7,-36);
  ctx.bezierCurveTo(16,-26,14,-10,0,0);
  ctx.fillStyle=C.furDark; ctx.fill();
  ctx.beginPath(); ctx.ellipse(20,-46,8,8,0,0,Math.PI*2);
  ctx.fillStyle=C.belly; ctx.fill();
  ctx.restore();

  /* ── BACK LEGS ── alternating sin walk cycle */
  if(!sitting){
    const bAmp=dancing?0.38:eating?0.09:0.09;
    const bSpd=dancing?1.1:eating?0.55:0.42;
    [-36,36].forEach((lx,i)=>{
      const rot=Math.sin(t*bSpd+(i===0?0:Math.PI))*bAmp;
      ctx.save(); ctx.translate(lx,40+sY); ctx.rotate(rot);
      rr(ctx,-11,-8,22,30,11); ctx.fillStyle=C.furDark; ctx.fill();
      ctx.beginPath(); ctx.ellipse(0,24,11,7,0,0,Math.PI*2);
      ctx.fillStyle=C.furDeep; ctx.fill();
      ctx.restore();
    });
  } else {
    [-26,26].forEach((lx,i)=>{
      ctx.save(); ctx.translate(lx,46); ctx.rotate(i===0?0.38:-0.38);
      ctx.beginPath(); ctx.ellipse(0,0,22,15,0,0,Math.PI*2);
      ctx.fillStyle=C.furDark; ctx.fill();
      ctx.restore();
    });
  }

  /* ── BODY ── */
  ctx.save(); ctx.translate(0,sY);
  if(bathing) ctx.rotate(Math.sin(bodyWobble)*0.13);
  ctx.beginPath(); ctx.ellipse(0,18,52,40,0,0,Math.PI*2);
  ctx.fillStyle=C.fur; ctx.fill();
  ctx.beginPath(); ctx.ellipse(0,26,32,26,0,0,Math.PI*2);
  ctx.fillStyle=C.belly; ctx.fill();
  ctx.restore();

  /* ── FRONT LEGS ── */
  if(!sitting&&!dancing){
    const fAmp=eating?0.15:0.07;
    const fSpd=eating?0.8:0.42;
    [-24,24].forEach((lx,i)=>{
      const isPaw=i===1&&pawUp;
      let rot=Math.sin(t*fSpd+(i===0?0:Math.PI))*fAmp;
      ctx.save(); ctx.translate(lx,40+sY);
      if(isPaw){ rot=-1.05; ctx.translate(0,-8); }
      ctx.rotate(rot);
      rr(ctx,-9,-4,18,28,9); ctx.fillStyle=C.fur; ctx.fill();
      ctx.beginPath(); ctx.ellipse(0,25,10,6,0,0,Math.PI*2);
      ctx.fillStyle=C.furDark; ctx.fill();
      ctx.restore();
    });
  } else if(dancing){
    /* excited dance: arms raise and lower alternately with larger amplitude */
    [-24,24].forEach((lx,i)=>{
      const lift=Math.sin(t*1.2+(i===0?0:Math.PI));
      const rot=(i===0?-0.85:0.85)+lift*0.38;
      const ty=-4+lift*7;
      ctx.save(); ctx.translate(lx,30+sY+ty); ctx.rotate(rot);
      rr(ctx,-9,-4,18,28,9); ctx.fillStyle=C.fur; ctx.fill();
      ctx.beginPath(); ctx.ellipse(0,25,10,6,0,0,Math.PI*2);
      ctx.fillStyle=C.furDark; ctx.fill();
      ctx.restore();
    });
  } else {
    /* sitting: straight front legs */
    [-20,20].forEach((lx)=>{
      ctx.save(); ctx.translate(lx,44);
      rr(ctx,-8,-4,16,22,8); ctx.fillStyle=C.fur; ctx.fill();
      ctx.beginPath(); ctx.ellipse(0,19,9,5.5,0,0,Math.PI*2);
      ctx.fillStyle=C.furDark; ctx.fill();
      ctx.restore();
    });
  }

  /* ── COLLAR ── */
  ctx.save(); ctx.translate(0,sY-2);
  ctx.beginPath(); ctx.ellipse(0,-4,27,8,0,0,Math.PI*2);
  ctx.fillStyle=C.collar; ctx.fill();
  ctx.beginPath(); ctx.ellipse(0,0,5.5,5.5,0,0,Math.PI*2);
  ctx.fillStyle=C.tag; ctx.fill();
  ctx.restore();

  /* ── HEAD ── */
  const headBob=eating?Math.sin(t*0.8)*0.05:0;
  ctx.save(); ctx.translate(0,-40+hY); ctx.rotate(headTilt+headBob);

  /* ears — perk up when excited */
  const ep=earPerk;
  [[-33,-4,-0.22-ep*0.12],[33,-4,0.22+ep*0.12]].forEach(([ex,ey,rot])=>{
    ctx.save(); ctx.translate(ex,ey); ctx.rotate(rot);
    ctx.beginPath(); ctx.ellipse(0,0,13,24,0,0,Math.PI*2);
    ctx.fillStyle=C.furDark; ctx.fill();
    ctx.beginPath(); ctx.ellipse(0,5,8,16,0,0,Math.PI*2);
    ctx.fillStyle=C.earInner; ctx.fill();
    ctx.restore();
  });

  /* skull */
  ctx.beginPath(); ctx.ellipse(0,0,41,37,0,0,Math.PI*2);
  ctx.fillStyle=C.fur; ctx.fill();
  ctx.beginPath(); ctx.ellipse(0,-22,13,10,0,0,Math.PI*2);
  ctx.globalAlpha=0.38; ctx.fillStyle=C.furDark; ctx.fill(); ctx.globalAlpha=1;

  /* snout */
  ctx.beginPath(); ctx.ellipse(0,13,24,18,0,0,Math.PI*2);
  ctx.fillStyle=C.belly; ctx.fill();

  /* nose */
  ctx.beginPath(); ctx.ellipse(0,5,10,7.5,0,0,Math.PI*2);
  ctx.fillStyle=C.nose; ctx.fill();
  ctx.beginPath(); ctx.ellipse(-4,2.5,2.8,2,0,0,Math.PI*2);
  ctx.fillStyle=C.shine; ctx.fill();

  /* blush */
  [[-27,10],[27,10]].forEach(([bx,by])=>{
    ctx.beginPath(); ctx.ellipse(bx,by,12,7,0,0,Math.PI*2);
    ctx.fillStyle=C.blush; ctx.fill();
  });

  /* eyes */
  drawEye(ctx,-17,-8,eyeOffX,eyeOffY,blinkAmt,mood,sleeping);
  drawEye(ctx, 17,-8,eyeOffX,eyeOffY,blinkAmt,mood,sleeping);

  /* brows */
  const bTilt=mood==='sad'?0.32:(mood==='excited'||mood==='love')?-0.2:0;
  const bY=mood==='excited'?-3.5:mood==='sad'?2.5:0;
  ctx.lineWidth=2.6; ctx.strokeStyle=C.brow; ctx.lineCap='round';
  [[-17,-21],[17,-21]].forEach(([bx,by],i)=>{
    ctx.save(); ctx.translate(bx,by+bY); ctx.rotate(i===0?bTilt:-bTilt);
    ctx.beginPath(); ctx.moveTo(-9,0); ctx.quadraticCurveTo(0,-2.5,9,0); ctx.stroke();
    ctx.restore();
  });

  /* mouth */
  ctx.lineWidth=2; ctx.strokeStyle=C.mouth; ctx.lineCap='round';
  if(sleeping){
    ctx.beginPath(); ctx.moveTo(-6,21); ctx.lineTo(6,21); ctx.stroke();
    ctx.font='bold 12px sans-serif'; ctx.fillStyle='#8B9BB4';
    ctx.textAlign='left'; ctx.fillText('z',30,-26);
    ctx.font='9px sans-serif'; ctx.fillText('z',40,-40);
  } else if(mood==='sad'){
    ctx.beginPath(); ctx.moveTo(-11,25); ctx.quadraticCurveTo(0,20,11,25); ctx.stroke();
  } else if(eating){
    const chew=Math.abs(Math.sin(t*0.8))*5;
    ctx.beginPath(); ctx.ellipse(0,22+chew*0.4,9,4+chew,0,0,Math.PI*2);
    ctx.fillStyle='#3A1A10'; ctx.fill();
    ctx.beginPath(); ctx.ellipse(0,23+chew,6,3.5,0,0,Math.PI*2);
    ctx.fillStyle=C.tongue; ctx.fill();
  } else {
    ctx.beginPath(); ctx.moveTo(-11,19); ctx.quadraticCurveTo(0,28,11,19); ctx.stroke();
    if(mood!=='tired'){
      ctx.beginPath(); ctx.ellipse(0,26,8,6,0,0,Math.PI*2);
      ctx.fillStyle=C.tongue; ctx.fill();
      ctx.lineWidth=1.2; ctx.strokeStyle=C.tongueLine;
      ctx.beginPath(); ctx.moveTo(0,20); ctx.lineTo(0,32); ctx.stroke();
    }
  }

  ctx.restore(); /* head */
  ctx.restore(); /* root */
}

/* ─── MOOD ─────────────────────────────────────────────────── */
function detectMood(s){
  if(s.energy<40)    return{mood:'tired', emoji:'😴',label:'Sleepy',   color:'#8B9BB4'};
  if(s.hunger<35)    return{mood:'sad',   emoji:'🍖',label:'Starving!',color:'#E86B8A'};
  if(s.hygiene<50)   return{mood:'sad',   emoji:'🛁',label:'Needs bath',color:'#9B7BE8'};
  if(s.love>90)      return{mood:'love',  emoji:'💕',label:'In love',   color:'#E86B8A'};
  if(s.happiness>85) return{mood:'excited',emoji:'✨',label:'Overjoyed',color:'#E8A84C'};
  if(s.happiness>75) return{mood:'happy', emoji:'😊',label:'Happy',    color:'#4CAF7D'};
  return              {mood:'sad',   emoji:'🥺',label:'Sad',       color:'#E86B8A'};
}
function parseMoodFromReply(t){
  const tx=t.toLowerCase();
  if(/excit|happy|woof|yay|amazing|love|joy|great|fun|yum|tail|wag|treat|bark/.test(tx)) return 'excited';
  if(/sad|miss|tired|lonely|hungry|bath|upset|sigh/.test(tx)) return 'sad';
  if(/love|heart|best|friend|forever|care|snuggle|always/.test(tx)) return 'love';
  return 'happy';
}

const OPENROUTER_API_KEY='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';
const OR_MODEL='anthropic/claude-3-haiku';

/* ─── COMPONENT ────────────────────────────────────────────── */
export default function Interact(){
  const canvasRef   =useRef(null);
  const mouseRef    =useRef({x:0,y:0});
  const rafRef      =useRef(null);
  const chatRef     =useRef(null);
  const chatHistory =useRef([]);

  /* All animation state — never triggers re-renders */
  const A=useRef({
    t:0,
    tailAngle:-0.2,tailDir:1,
    blinkVal:1,blinkTimer:0,blinkDown:false,
    floatT:0,
    eyeOffX:0,eyeOffY:0,eyeTargetX:0,eyeTargetY:0,
    headTilt:0,
    squashY:1,squashVel:0,
    sitting:false,sleeping:false,pawUp:false,
    dancing:false,eating:false,bathing:false,
    earPerk:0,bodyWobble:0,
    rolling:false,rollingAngle:0,
    ball:null,
    currentMood:'happy',
  }).current;

  const [stats,setStats]=useState({hunger:75,energy:82,hygiene:88,happiness:78,love:70});
  const [mood,setMood]  =useState({mood:'happy',emoji:'😊',label:'Happy',color:'#4CAF7D'});
  const [messages,setMessages]=useState([
    {from:'dog',text:"*spins three times* You're HERE! I sat so good all day. 🐾"}
  ]);
  const [inputVal,setInputVal]=useState('');
  const [isTyping,setIsTyping]=useState(false);
  const [activeAct,setActiveAct]=useState(null);
  const [notif,setNotif]=useState(null);
  const [particles,setParticles]=useState([]);

  /* ── CANVAS: ResizeObserver keeps pixel buffer = CSS size × dpr ── */
  useEffect(()=>{
    const cvs=canvasRef.current;
    if(!cvs) return;
    const container=cvs.parentElement;
    function resize(){
      const dpr=window.devicePixelRatio||1;
      const w=container.clientWidth;
      const h=container.clientHeight;
      if(cvs.width===Math.round(w*dpr)&&cvs.height===Math.round(h*dpr)) return;
      cvs.width=Math.round(w*dpr);
      cvs.height=Math.round(h*dpr);
      cvs.style.width=w+'px';
      cvs.style.height=h+'px';
    }
    resize();
    const ro=new ResizeObserver(resize);
    ro.observe(container);
    return()=>ro.disconnect();
  },[]);

  /* ── ANIMATION LOOP ── */
  useEffect(()=>{
    const cvs=canvasRef.current;
    if(!cvs) return;
    const ctx=cvs.getContext('2d');

    function loop(){
      const dpr=window.devicePixelRatio||1;
      const W=cvs.width, H=cvs.height;
      const Wl=W/dpr, Hl=H/dpr;
      ctx.clearRect(0,0,W,H);
      ctx.save(); ctx.scale(dpr,dpr);

      A.t+=0.05;

      /* tail wag — speed and range vary by mood */
      const tSpd=A.sleeping?0.004:A.currentMood==='excited'?0.14:A.currentMood==='sad'?0.016:0.055;
      const tRange=A.sleeping?0.05:A.currentMood==='excited'?0.62:A.dancing?0.55:0.42;
      A.tailAngle+=tSpd*A.tailDir;
      if(A.tailAngle>tRange)  A.tailDir=-1;
      if(A.tailAngle<-tRange) A.tailDir= 1;

      /* blink */
      A.blinkTimer++;
      const bFreq=A.sleeping?99999:A.currentMood==='excited'?100:210;
      if(!A.blinkDown&&A.blinkTimer>bFreq){A.blinkDown=true;A.blinkTimer=0;}
      if(A.blinkDown){
        A.blinkVal-=0.22; if(A.blinkVal<0)A.blinkVal=0;
        if(A.blinkTimer>5){A.blinkDown=false;A.blinkVal=1;A.blinkTimer=0;}
      }
      if(A.sleeping) A.blinkVal=0;

      /* idle float — smooth sin, zero when sitting */
      A.floatT+=A.sitting?0:0.018;
      const floatAmp=A.currentMood==='excited'?9:5;
      const floatY=A.sitting?0:Math.sin(A.floatT)*floatAmp;

      /* squash spring — bounces back to 1 naturally */
      A.squashVel+=(1-A.squashY)*0.3;
      A.squashVel*=0.68;
      A.squashY+=A.squashVel;

      /* ear perk */
      const epT=(A.currentMood==='excited'||A.currentMood==='love')?1:0;
      A.earPerk+=(epT-A.earPerk)*0.07;

      /* bath shake */
      if(A.bathing){A.bodyWobble+=0.38;if(A.bodyWobble>Math.PI*7)A.bathing=false;}
      else A.bodyWobble=0;

      /* rolling */
      if(A.rolling) A.rollingAngle+=0.12;

      /* fetch ball physics */
      if(A.ball){
        A.ball.x+=A.ball.vx; A.ball.y+=A.ball.vy; A.ball.vy+=0.55;
        const ground=Hl*0.78;
        if(A.ball.y>ground){
          A.ball.vy*=-0.48; A.ball.y=ground;
          if(Math.abs(A.ball.vy)<1.2) A.ball=null;
        }
        if(A.ball&&A.ball.x>Wl+20) A.ball=null;
      }

      /* eye tracking */
      const mx=mouseRef.current.x,my=mouseRef.current.y;
      const rect=cvs.getBoundingClientRect();
      const dogSX=rect.left+Wl/2;
      const dogSY=rect.top+Hl*0.52+floatY;
      const ddx=mx-dogSX,ddy=my-dogSY;
      const dd=Math.sqrt(ddx*ddx+ddy*ddy)||1;
      A.eyeTargetX=Math.max(-1,Math.min(1,ddx/dd));
      A.eyeTargetY=Math.max(-1,Math.min(1,ddy/dd));
      A.eyeOffX+=(A.eyeTargetX-A.eyeOffX)*0.07;
      A.eyeOffY+=(A.eyeTargetY-A.eyeOffY)*0.07;

      /* head tilt follows cursor softly */
      const tiltT=Math.max(-0.13,Math.min(0.13,ddx*0.00022));
      A.headTilt+=(tiltT-A.headTilt)*0.05;

      /* draw ball */
      if(A.ball){
        ctx.beginPath(); ctx.arc(A.ball.x,A.ball.y,9,0,Math.PI*2);
        ctx.fillStyle='#CFDF34'; ctx.fill();
        ctx.strokeStyle='#6E7A0F'; ctx.lineWidth=1.5; ctx.stroke();
        ctx.beginPath(); ctx.arc(A.ball.x,A.ball.y,9,0.3,2.1);
        ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=1; ctx.stroke();
      }

      /* dog scale: fills ~58% of the shorter dimension of the container */
      const dogScale=Math.min(Wl,Hl)*0.0022;
      const dogX=Wl/2;
      const dogY=Hl*0.52+floatY;

      ctx.save();
      if(A.rolling){
        ctx.translate(dogX,dogY); ctx.rotate(A.rollingAngle); ctx.translate(-dogX,-dogY);
      }
      drawDog(ctx,dogX,dogY,dogScale,{
        t:A.t, eyeOffX:A.eyeOffX, eyeOffY:A.eyeOffY,
        tailAngle:A.tailAngle, blinkAmt:A.blinkVal,
        mood:A.currentMood, headTilt:A.headTilt,
        sitting:A.sitting, sleeping:A.sleeping,
        pawUp:A.pawUp, dancing:A.dancing,
        eating:A.eating, bathing:A.bathing,
        earPerk:A.earPerk, squashY:A.squashY, bodyWobble:A.bodyWobble,
      });
      ctx.restore();

      ctx.restore(); /* dpr */
      rafRef.current=requestAnimationFrame(loop);
    }
    loop();
    return()=>cancelAnimationFrame(rafRef.current);
  },[]);

  /* ── MOUSE ── */
  useEffect(()=>{
    const h=e=>{mouseRef.current={x:e.clientX,y:e.clientY};};
    window.addEventListener('mousemove',h);
    return()=>window.removeEventListener('mousemove',h);
  },[]);

  /* ── STAT DECAY ── */
  useEffect(()=>{
    const t=setInterval(()=>{
      setStats(s=>{
        const n={
          hunger:   Math.max(0,s.hunger-6),
          energy:   Math.max(0,s.energy-7),
          hygiene:  Math.max(0,s.hygiene-5),
          happiness:Math.max(0,s.happiness-(s.hunger<30?2:5)),
          love:     Math.max(0,s.love-6),
        };
        const m=detectMood(n); setMood(m); A.currentMood=m.mood;
        return n;
      });
    },2000);
    return()=>clearInterval(t);
  },[]);

  /* ── BURST ── */
  const burst=useCallback((emojis,count=7)=>{
    const ps=Array.from({length:count},()=>({
      id:Math.random(),
      emoji:emojis[Math.floor(Math.random()*emojis.length)],
      x:40+Math.random()*20,y:28+Math.random()*20,
      vx:(Math.random()-0.5)*5,vy:-(Math.random()*3.5+1.5),
      size:16+Math.random()*12,
    }));
    setParticles(p=>[...p,...ps]);
    setTimeout(()=>setParticles(p=>p.filter(x=>!ps.find(n=>n.id===x.id))),1600);
  },[]);

  const notify=useCallback((msg)=>{
    setNotif(msg); setTimeout(()=>setNotif(null),2200);
  },[]);

  const resetStates=()=>{
    A.sitting=false;A.sleeping=false;A.pawUp=false;
    A.dancing=false;A.eating=false;A.bathing=false;
    A.rolling=false;A.rollingAngle=0;A.ball=null;
  };

  /* ── ACTIONS ── */
  const triggerAction=useCallback((type)=>{
    resetStates();
    setActiveAct(type); setTimeout(()=>setActiveAct(null),1500);

    switch(type){
      case 'feed':
        A.sitting=true; A.eating=true; A.squashY=0.84; A.squashVel=0;
        setStats(s=>({...s,hunger:Math.min(100,s.hunger+30),happiness:Math.min(100,s.happiness+7)}));
        burst(['🍖','✨'],8); notify('Nom nom nom 🍖');
        setTimeout(()=>{A.eating=false;A.sitting=false;},3500);
        break;
      case 'treat':
        A.sitting=true; A.earPerk=1; A.squashY=0.88;
        setTimeout(()=>{A.sitting=false;A.squashY=0.76;A.squashVel=-0.08;A.eating=true;},350);
        setTimeout(()=>{A.eating=false;},1800);
        setStats(s=>({...s,hunger:Math.min(100,s.hunger+14),happiness:Math.min(100,s.happiness+20),love:Math.min(100,s.love+8)}));
        burst(['🍪','⭐','✨'],10); notify('TREAT!! Best day!! 🍪');
        break;
      case 'pet':
        A.headTilt=-0.2; A.earPerk=1; A.squashY=0.92;
        setStats(s=>({...s,happiness:Math.min(100,s.happiness+14),love:Math.min(100,s.love+16)}));
        burst(['💕','💖'],8); notify('Good boy/girl!! 💕');
        setTimeout(()=>{A.headTilt=0;},2500);
        break;
      case 'play':
        A.dancing=true; A.squashY=0.78; A.squashVel=-0.05;
        setStats(s=>({...s,energy:Math.max(0,s.energy-16),hunger:Math.max(0,s.hunger-10),happiness:Math.min(100,s.happiness+24),love:Math.min(100,s.love+10)}));
        burst(['🎮','⚡','💥'],9); notify('ZOOMIES!! 🐾');
        setTimeout(()=>{A.dancing=false;},3200);
        break;
      case 'fetch':
        A.ball={x:60,y:200,vx:8,vy:-14}; A.squashY=0.86;
        setStats(s=>({...s,energy:Math.max(0,s.energy-10),happiness:Math.min(100,s.happiness+18)}));
        burst(['🎾','💨'],6); notify('On it!! 🎾');
        break;
      case 'sleep':
        A.sleeping=true; A.sitting=true;
        setStats(s=>({...s,energy:Math.min(100,s.energy+38),happiness:Math.min(100,s.happiness+4)}));
        notify('Zzzzz 😴');
        setTimeout(()=>{A.sleeping=false;A.sitting=false;A.blinkVal=1;},5500);
        break;
      case 'bath':
        A.bathing=true; A.bodyWobble=0; A.squashY=0.88;
        setStats(s=>({...s,hygiene:Math.min(100,s.hygiene+48),happiness:Math.min(100,s.happiness+4)}));
        burst(['💧','🫧','✨'],11); notify('SHAKE SHAKE 💦');
        break;
      case 'sit':
        A.sitting=true; A.squashY=0.88;
        burst(['⭐'],4); notify('Good sit! ⭐');
        setTimeout(()=>A.sitting=false,3500);
        break;
      case 'shake':
        A.sitting=true; A.squashY=0.9;
        setTimeout(()=>{A.pawUp=true;},450);
        burst(['🤝','⭐'],5); notify('Paw! 🤝');
        setTimeout(()=>{A.sitting=false;A.pawUp=false;},4000);
        break;
      case 'roll':
        A.rolling=true; A.rollingAngle=0; A.squashY=0.82;
        burst(['🔄','✨'],6); notify('Roll over! 🔄');
        setTimeout(()=>{A.rolling=false;},2200);
        break;
      default: break;
    }
    setStats(prev=>{
      const m=detectMood(prev); setMood(m); A.currentMood=m.mood; return prev;
    });
  },[burst,notify]);

  /* ── CHAT ── */
  const sendMessage=useCallback(async(text)=>{
    const msg=(text||inputVal).trim();
    if(!msg||isTyping) return;
    setInputVal('');
    chatHistory.current.push({role:'user',content:msg});
    setMessages(m=>[...m,{from:'user',text:msg}]);
    setIsTyping(true); A.earPerk=1;

    const moodState=detectMood(stats);
    const ss=`hunger:${Math.round(stats.hunger)}% energy:${Math.round(stats.energy)}% hygiene:${Math.round(stats.hygiene)}% happiness:${Math.round(stats.happiness)}%`;
    const fallbacks=[
      "*perks ears* I definitely heard that. *tilts head* Say it again?",
      "*wags tail dangerously fast* That's the best thing anyone has ever said. Tell me more.",
      "*sits very still* Processing... *chases tail* Okay I'm back.",
    ];
    try{
      const res=await fetch('https://openrouter.ai/api/v1/chat/completions',{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':`Bearer ${OPENROUTER_API_KEY}`,'HTTP-Referer':'https://bork.app','X-Title':'Bork'},
        body:JSON.stringify({
          model:OR_MODEL,max_tokens:180,
          messages:[
            {role:'system',content:`You are Bork, a golden-brown AI dog with enormous personality. Stats: ${ss}. Mood: ${moodState.label}. PERSONALITY: enthusiastic, loving, easily distracted by imaginary squirrels. Use *action emotes* naturally. 2-3 sentences max, punchy. Never break character. 1-2 emojis max.`},
            ...chatHistory.current.slice(-12)
          ],
        })
      });
      const data=await res.json();
      const reply=data.choices?.[0]?.message?.content||fallbacks[Math.floor(Math.random()*fallbacks.length)];
      chatHistory.current.push({role:'assistant',content:reply});
      const rm=parseMoodFromReply(reply);
      A.currentMood=rm;
      if(rm==='excited'){A.squashY=0.8;A.squashVel=-0.06;}
      if(rm==='love'){A.headTilt=-0.1;setTimeout(()=>A.headTilt=0,2000);}
      setStats(s=>({...s,happiness:Math.min(100,s.happiness+3),love:Math.min(100,s.love+2)}));
      setMessages(m=>[...m,{from:'dog',text:reply}]);
    }catch(e){
      setMessages(m=>[...m,{from:'dog',text:fallbacks[Math.floor(Math.random()*fallbacks.length)]}]);
    }finally{setIsTyping(false);}
  },[inputVal,isTyping,stats]);

  useEffect(()=>{
    if(chatRef.current) chatRef.current.scrollTop=chatRef.current.scrollHeight;
  },[messages,isTyping]);

  const statColor=v=>v>60?'#4CAF7D':v>30?'#E8A84C':'#E05878';
  const quickPhrases=["Did you miss me?","Favourite food?","Show me a trick!","Are you happy?"];
  const actions=[
    {id:'feed',icon:'🍖',label:'Feed'},{id:'treat',icon:'🍪',label:'Treat'},
    {id:'pet', icon:'✋',label:'Pet'}, {id:'play', icon:'🎮',label:'Play'},
    {id:'fetch',icon:'🎾',label:'Fetch'},{id:'sleep',icon:'😴',label:'Sleep'},
    {id:'bath', icon:'🛁',label:'Bath'},{id:'sit',  icon:'🪑',label:'Sit'},
    {id:'shake',icon:'🤝',label:'Shake'},{id:'roll', icon:'🔄',label:'Roll'},
  ];

  return(
    <>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
      *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

      .bk{
        height:100vh;width:100vw;overflow:hidden;
        display:flex;flex-direction:column;
        background:#F7F2EA;
        font-family:'DM Sans',sans-serif;color:#1E0E06;
      }

      /* TOPBAR */
      .bk-top{
        flex:0 0 50px;
        display:flex;align-items:center;justify-content:space-between;
        padding:0 1.2rem;
        background:rgba(247,242,234,0.96);
        border-bottom:1px solid rgba(196,149,106,0.13);
        backdrop-filter:blur(8px);z-index:10;
      }
      .bk-logo{font-family:'Fraunces',serif;font-weight:700;font-size:1.15rem;letter-spacing:-0.4px;}
      .bk-logo em{color:#C4803A;font-style:normal;}
      .bk-status{display:flex;align-items:center;gap:0.45rem;font-size:0.76rem;font-weight:500;color:#6B3A2A;}
      .bk-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;animation:bkp 2.4s infinite;}
      @keyframes bkp{0%,100%{opacity:1}50%{opacity:0.3}}
      .bk-back{font-size:0.73rem;font-weight:600;color:#6B3A2A;background:none;border:1px solid rgba(196,149,106,0.28);border-radius:30px;padding:0.26rem 0.82rem;cursor:pointer;transition:all .14s;}
      .bk-back:hover{background:#1E0E06;color:#F7F2EA;border-color:#1E0E06;}

      /* BODY — three columns that fill remaining height */
      .bk-body{
        flex:1;min-height:0;
        display:grid;
        grid-template-columns:260px 1fr 340px;
      }

      /* LEFT */
      .bk-left{
        border-right:1px solid rgba(196,149,106,0.11);
        padding:0.8rem;
        display:flex;flex-direction:column;gap:0.55rem;
        overflow-y:auto;
        
      }
      .bk-lbl{font-size:0.59rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#C4803A;}
      .bk-moodrow{display:flex;align-items:center;gap:0.48rem;background:#fff;border-radius:10px;padding:0.5rem 0.65rem;border:1px solid rgba(196,149,106,0.13);}
      .bk-moodemoji{font-size:1.15rem;}
      .bk-moodlabel{font-family:'Fraunces',serif;font-weight:600;font-size:0.82rem;}
      .bk-moodsub{font-size:0.6rem;color:#6B3A2A;}
      .bk-stat{display:flex;flex-direction:column;gap:0.18rem;}
      .bk-statrow{display:flex;justify-content:space-between;align-items:center;}
      .bk-statname{font-size:0.66rem;font-weight:600;color:#5A3020;}
      .bk-statnum{font-size:0.63rem;font-weight:700;font-family:'Fraunces',serif;}
      .bk-track{height:4px;background:rgba(196,149,106,0.13);border-radius:6px;overflow:hidden;}
      .bk-fill{height:100%;border-radius:6px;transition:width .5s cubic-bezier(.4,0,.2,1);}
      .bk-actgrid{display:grid;grid-template-columns:1fr 1fr;gap:0.32rem;}
      .bk-act{
        display:flex;flex-direction:column;align-items:center;gap:0.16rem;
        padding:0.46rem 0.2rem;
        background:#fff;border:1px solid rgba(196,149,106,0.16);border-radius:9px;
        font-size:0.56rem;font-weight:700;letter-spacing:0.4px;text-transform:uppercase;
        color:#5A3020;cursor:pointer;transition:all .12s;
      }
      .bk-act:hover{background:#1E0E06;color:#F7F2EA;border-color:#1E0E06;transform:translateY(-1px);}
      .bk-act.active{background:#C4803A;border-color:#C4803A;color:#fff;transform:scale(0.94);}
      .bk-acticon{font-size:1rem;}

      /* STAGE — canvas fills it via CSS, pixel buffer set by ResizeObserver */
      .bk-stage{
        position:relative;
        background:linear-gradient(170deg,#EDE5D5 0%,#E2D7C2 55%,#D8CCBA 100%);
        overflow:hidden;
      }
      .bk-ground{position:absolute;bottom:0;left:0;right:0;height:24%;background:linear-gradient(0deg,#B6946A 0%,#CAA67A 50%,transparent 100%);pointer-events:none;}
      .bk-sky{position:absolute;top:0;left:0;right:0;height:40%;background:linear-gradient(180deg,rgba(195,222,238,0.28) 0%,transparent 100%);pointer-events:none;}
      /* canvas fills stage exactly — NO hard-coded px, NO width/height attrs here */
      .bk-canvas{display:block;position:absolute;inset:0;cursor:crosshair;}
      .bk-notif{
        position:absolute;top:0.6rem;left:50%;transform:translateX(-50%);
        background:rgba(30,14,6,0.86);color:#F7F2EA;
        padding:0.32rem 0.95rem;border-radius:30px;
        font-size:0.73rem;font-weight:600;white-space:nowrap;
        z-index:20;backdrop-filter:blur(6px);
        animation:nPop .2s cubic-bezier(.34,1.56,.64,1);
      }
      @keyframes nPop{from{opacity:0;transform:translateX(-50%) scale(0.8)}to{opacity:1;transform:translateX(-50%) scale(1)}}
      .bk-ptlayer{position:absolute;inset:0;pointer-events:none;z-index:15;}
      .bk-ptcl{position:absolute;pointer-events:none;animation:ptF 1.5s ease-out forwards;}
      @keyframes ptF{0%{opacity:1;transform:translate(0,0) scale(1)}100%{opacity:0;transform:translate(var(--vx),var(--vy)) scale(0.3)}}
      .bk-hint{position:absolute;bottom:0.45rem;right:0.65rem;font-size:0.58rem;color:rgba(30,14,6,0.28);font-weight:500;z-index:3;pointer-events:none;}

      /* CHAT */
      .bk-chat{
  border-left:1px solid rgba(196,149,106,0.11);
  display:flex;
  flex-direction:column;
  background:#1E0E06;

  min-height: 0; /* ✅ ADD THIS */
},
      .bk-chattop{flex-shrink:0;padding:0.6rem 0.85rem;border-bottom:1px solid rgba(196,149,106,0.1);display:flex;align-items:center;gap:0.5rem;background:rgba(255,255,255,0.04);}
      .bk-chatav{width:26px;height:26px;border-radius:50%;background:#C4803A;display:flex;align-items:center;justify-content:center;font-size:0.8rem;flex-shrink:0;}
      .bk-chatname{font-family:'Fraunces',serif;font-weight:700;font-size:0.82rem;color:#F7F2EA;}
      .bk-chatonline{font-size:0.62rem;color:#4CAF7D;font-weight:500;}
      .bk-msgs{
  flex:1;
  overflow-y:auto;
  padding:0.7rem;
  display:flex;
  flex-direction:column;
  gap:0.46rem;

  min-height: 0; /* ✅ helps in nested flex cases */
},
      .bk-msg{display:flex;gap:0.38rem;align-items:flex-end;}
      .bk-msg.user{flex-direction:row-reverse;}
      .bk-bubble{max-width:84%;padding:0.46rem 0.7rem;border-radius:12px;font-size:0.76rem;line-height:1.5;}
      .bk-msg.dog .bk-bubble{background:rgba(255,255,255,0.08);color:#F7F2EA;border-bottom-left-radius:3px;}
      .bk-msg.user .bk-bubble{background:#C4803A;color:#1E0E06;font-weight:500;border-bottom-right-radius:3px;}
      .bk-msgav{width:19px;height:19px;border-radius:50%;background:rgba(196,149,106,0.2);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:0.62rem;}
      .bk-typing{display:flex;gap:3px;padding:3px 2px;}
      .bk-typing span{width:5px;height:5px;border-radius:50%;background:rgba(247,242,234,0.38);animation:tdot 1.1s infinite;}
      .bk-typing span:nth-child(2){animation-delay:.18s}.bk-typing span:nth-child(3){animation-delay:.36s}
      @keyframes tdot{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}
      .bk-pills{flex-shrink:0;display:flex;flex-wrap:wrap;gap:0.28rem;padding:0.38rem 0.7rem 0;}
      .bk-pill{background:rgba(255,255,255,0.05);border:1px solid rgba(196,149,106,0.14);border-radius:30px;padding:0.2rem 0.56rem;font-size:0.63rem;color:rgba(247,242,234,0.5);cursor:pointer;transition:all .12s;white-space:nowrap;}
      .bk-pill:hover{background:rgba(196,128,58,0.2);color:#F7F2EA;border-color:rgba(196,128,58,0.36);}
      .bk-inputrow{flex-shrink:0;padding:0.55rem 0.65rem;border-top:1px solid rgba(196,149,106,0.1);display:flex;gap:0.38rem;}
      .bk-input{flex:1;background:rgba(255,255,255,0.07);border:1px solid rgba(196,149,106,0.16);border-radius:30px;padding:0.44rem 0.8rem;color:#F7F2EA;font-family:'DM Sans',sans-serif;font-size:0.76rem;outline:none;transition:border-color .18s;}
      .bk-input::placeholder{color:rgba(247,242,234,0.22);}
      .bk-input:focus{border-color:#C4803A;}
      .bk-send{background:#C4803A;border:none;border-radius:30px;padding:0.44rem 0.85rem;font-family:'Fraunces',serif;font-weight:600;font-size:0.73rem;color:#fff;cursor:pointer;transition:all .13s;flex-shrink:0;}
      .bk-send:hover:not(:disabled){background:#D49B5C;}
      .bk-send:disabled{opacity:0.36;cursor:not-allowed;}

      @media(max-width:880px){
        .bk-body{grid-template-columns:160px 1fr 210px;}
      }
      @media(max-width:620px){
        .bk-body{grid-template-columns:1fr;grid-template-rows:1fr 280px;overflow-y:auto;}
        .bk-left{display:none;}
      }
    `}</style>

    <div className="bk">
      <header className="bk-top">
        <div className="bk-logo">B<em>.</em>ORK</div>
        <div className="bk-status">
          <div className="bk-dot" style={{background:mood.color}}/>
          <span>{mood.emoji} {mood.label}</span>
        </div>
        <button className="bk-back" onClick={()=>window.history.back()}>← Back</button>
      </header>

      <div className="bk-body">

        {/* LEFT */}
        <aside className="bk-left">
          <div className="bk-lbl">Vitals</div>
          <div className="bk-moodrow">
            <div className="bk-moodemoji">{mood.emoji}</div>
            <div>
              <div className="bk-moodlabel" style={{color:mood.color}}>{mood.label}</div>
              <div className="bk-moodsub">Current mood</div>
            </div>
          </div>
          {[
            {key:'hunger',label:'Hunger',icon:'🍖'},
            {key:'energy',label:'Energy',icon:'⚡'},
            {key:'hygiene',label:'Hygiene',icon:'🛁'},
            {key:'happiness',label:'Happiness',icon:'😊'},
            {key:'love',label:'Love',icon:'💕'},
          ].map(({key,label,icon})=>(
            <div className="bk-stat" key={key}>
              <div className="bk-statrow">
                <span className="bk-statname">{icon} {label}</span>
                <span className="bk-statnum" style={{color:statColor(stats[key])}}>{Math.round(stats[key])}%</span>
              </div>
              <div className="bk-track">
                <div className="bk-fill" style={{width:`${stats[key]}%`,background:statColor(stats[key])}}/>
              </div>
            </div>
          ))}
          <div className="bk-lbl" style={{marginTop:'0.15rem'}}>Actions</div>
          <div className="bk-actgrid">
            {actions.map(({id,icon,label})=>(
              <button key={id} className={`bk-act${activeAct===id?' active':''}`} onClick={()=>triggerAction(id)}>
                <span className="bk-acticon">{icon}</span>{label}
              </button>
            ))}
          </div>
        </aside>

        {/* STAGE */}
        <div className="bk-stage">
          <div className="bk-sky"/>
          <div className="bk-ground"/>
          {notif&&<div className="bk-notif">{notif}</div>}
          <div className="bk-ptlayer">
            {particles.map(p=>(
              <span key={p.id} className="bk-ptcl" style={{
                left:`${p.x}%`,top:`${p.y}%`,fontSize:`${p.size}px`,
                '--vx':`${p.vx*38}px`,'--vy':`${p.vy*38}px`,
              }}>{p.emoji}</span>
            ))}
          </div>
          <canvas
            ref={canvasRef}
            className="bk-canvas"
            onClick={()=>triggerAction('pet')}
            title="Click to pet Bork!"
          />
          <div className="bk-hint">click to pet</div>
        </div>

        {/* CHAT */}
        <div className="bk-chat">
          <div className="bk-chattop">
            <div className="bk-chatav">🐶</div>
            <div>
              <div className="bk-chatname">Bork</div>
              <div className="bk-chatonline">
                <span style={{display:'inline-block',width:5,height:5,borderRadius:'50%',background:'#4CAF7D',marginRight:4,animation:'bkp 2.4s infinite'}}/>
                Online
              </div>
            </div>
          </div>
          <div className="bk-msgs" ref={chatRef}>
            {messages.map((m,i)=>(
              <div key={i} className={`bk-msg ${m.from}`}>
                {m.from==='dog'&&<div className="bk-msgav">🐾</div>}
                <div className="bk-bubble">{m.text}</div>
              </div>
            ))}
            {isTyping&&(
              <div className="bk-msg dog">
                <div className="bk-msgav">🐾</div>
                <div className="bk-bubble"><div className="bk-typing"><span/><span/><span/></div></div>
              </div>
            )}
          </div>
          <div className="bk-pills">
            {quickPhrases.map((p,i)=>(
              <button key={i} className="bk-pill" onClick={()=>sendMessage(p)}>{p}</button>
            ))}
          </div>
          <div className="bk-inputrow">
            <input
              className="bk-input"
              value={inputVal}
              onChange={e=>setInputVal(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&sendMessage()}
              placeholder="Talk to Bork..."
              disabled={isTyping}
            />
            <button className="bk-send" onClick={()=>sendMessage()} disabled={isTyping||!inputVal.trim()}>
              Send ↗
            </button>
          </div>
        </div>

      </div>
    </div>
    </>
  );
}