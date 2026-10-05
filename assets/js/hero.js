'use strict';
(() => {
  const hero = document.querySelector('.cinematic-hero');
  if (!hero) return;
  const overlay = hero.querySelector('.cinema-overlay');
  const scene = hero.querySelector('.cinema-scene');
  const canvas = document.getElementById('cinema-canvas');
  const image = hero.querySelector('.cinema-city');
  const skip = hero.querySelector('.cinema-skip');
  const replay = hero.querySelector('.cinema-replay');
  const introPause = hero.querySelector('.cinema-intro-pause');
  const motion = hero.querySelector('.hero-motion-toggle');
  const caption = hero.querySelector('.cinema-caption');
  // Escape the hero's stacking context so the intro covers the sticky header too.
  document.body.append(overlay);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const DURATION = 11.8;
  const HANDOFF = 10.9;
  const stills = [image, image, image];
  let renderer = null, frame = 0, last = 0, clock = 0, introTime = 0;
  let intro = false, paused = reduced.matches, visible = true, chapter = -1;
  let x = 0, y = 0, targetX = 0, targetY = 0, savedFocus = null;
  let touchStart = null, resetSize = true, openingLoad = null, preparing = false;
  const inertStates = new Map();
  const chapters = [
    {number:'01', title:'A NEW BEGINNING', lines:['오늘도,','문을 엽니다.'], subtitle:'작은 시작에도, 큰 용기가 필요하니까요.', start:.65, end:3.2},
    {number:'02', title:'SIDE BY SIDE', lines:['그 용기가','내일이 되도록.'], subtitle:'그 한 걸음 곁에, 미소금융이 함께합니다.', start:3.9, end:6.9},
    {number:'03', title:'TOMORROW, TOGETHER', lines:['당신의 시작에,','미소를 더합니다.'], subtitle:'미소금융부산중구법인', start:7.6, end:11.4}
  ];

  const clamp = value => Math.max(0,Math.min(1,value));
  const smooth = value => {const n=clamp(value);return n*n*(3-2*n);};
  const ease = value => 1-Math.pow(1-clamp(value),3);

  // Three art-directed brand stills, not documentary customer photographs.
  // The opening uses close focus, a threshold shot, then the approved neighbourhood.
  function createRenderer() {
    const gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,powerPreference:'low-power'});
    if(!gl)throw new Error('WebGL unavailable');
    const vertex=`attribute vec2 aPosition;varying vec2 vUV;void main(){vUV=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}`;
    const fragment=`precision mediump float;varying vec2 vUV;
      uniform sampler2D uPicture,uFirst,uDoor;
      uniform vec2 uResolution,uImage,uFirstSize,uDoorSize,uPointer;uniform float uIntro,uTime;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      vec3 shot(sampler2D source,vec2 dimensions,vec2 centre,float zoom,float blur){
        float aspect=uResolution.x/uResolution.y,imageAspect=dimensions.x/dimensions.y;
        vec2 crop=vec2(min(1.,aspect/imageAspect),min(1.,imageAspect/aspect));
        vec2 halfCrop=crop*.5/zoom;
        centre=clamp(centre,halfCrop+vec2(.002),vec2(.998)-halfCrop);
        vec2 uv=clamp((vUV-.5)*crop/zoom+centre,vec2(.002),vec2(.998));
        vec3 colour=texture2D(source,uv).rgb;
        if(blur>.05){
          vec2 spread=crop/zoom*blur/uResolution;
          colour=colour*.4+(texture2D(source,uv+vec2(spread.x,0.)).rgb+texture2D(source,uv-vec2(spread.x,0.)).rgb+texture2D(source,uv+vec2(0.,spread.y)).rgb+texture2D(source,uv-vec2(0.,spread.y)).rgb)*.15;
        }
        return colour;
      }
      vec3 neighbourhood(float t){
        float aspect=uResolution.x/uResolution.y,imageAspect=uImage.x/uImage.y;
        float travel=smoothstep(6.6,10.9,t),settled=smoothstep(9.85,11.8,t);
        vec2 crop=vec2(min(1.,aspect/imageAspect),min(1.,imageAspect/aspect));
        float zoom=mix(1.48,1.035,travel)+sin(uTime*.09)*.005*settled;
        vec2 centre=mix(vec2(.43,.4),vec2(.5,.5),travel);
        // Narrow devices keep their camera on the street rather than a cropped sky.
        centre.x=mix(centre.x,.56,(1.-smoothstep(.55,1.,aspect))*travel);
        vec2 uv=(vUV-.5)*crop/zoom+centre;
        float foreground=pow(1.-vUV.y,2.);
        uv+=uPointer*vec2(.005,.003)*foreground*settled;
        uv.x+=sin(uTime*.055)*.002*settled;
        vec3 picture=texture2D(uPicture,clamp(uv,vec2(.002),vec2(.998))).rgb;
        float diagonal=vUV.x+vUV.y*.6;
        float beam=exp(-pow((diagonal-1.15+sin(uTime*.05)*.01)*3.,2.));
        picture+=vec3(.035,.022,.008)*beam;
        // The settled shot has a soft forest-green shade behind the homepage copy.
        float left=1.-smoothstep(.13,.78,vUV.x);
        float mobile=(1.-smoothstep(.65,1.,aspect));
        float shade=mix(left*.63,(.18+.45*smoothstep(.42,.94,vUV.y)),mobile)*settled;
        picture=mix(picture,vec3(.045,.13,.095),shade);
        return picture;
      }
      void main(){
        float t=uIntro,aspect=uResolution.x/uResolution.y;
        vec3 picture;
        if(t>=11.8){
          // Keep the settled homepage's existing framing, colours and GPU cost.
          picture=neighbourhood(t);
        }else{
          float firstCut=smoothstep(2.95,3.85,t),lastCut=smoothstep(6.45,7.45,t);
          float firstMove=smoothstep(0.,3.85,t),doorMove=smoothstep(3.,7.45,t);
          vec3 first=vec3(0.),door=vec3(0.),wide=vec3(0.);
          if(firstCut<1.)first=shot(uFirst,uFirstSize,mix(vec2(.59,.5),vec2(.62,.51),firstMove),mix(1.12,1.025,firstMove),5.5*(1.-smoothstep(.15,1.55,t)));
          vec2 doorCentre=mix(vec2(.62,.5),vec2(.6,.49),doorMove);
          doorCentre.x=mix(doorCentre.x,.73,1.-smoothstep(.6,1.,aspect));
          if(firstCut>0.&&lastCut<1.)door=shot(uDoor,uDoorSize,doorCentre,mix(1.14,1.025,doorMove),2.*(1.-smoothstep(3.1,4.2,t)));
          if(lastCut>0.)wide=neighbourhood(t);
          picture=mix(mix(first,door,firstCut),wide,lastCut);
          float light=exp(-pow((vUV.x+vUV.y*.75-1.23)*4.,2.))*smoothstep(3.55,5.2,t)*(1.-smoothstep(6.2,7.4,t));
          picture+=vec3(.032,.025,.015)*light;
          picture=mix(vec3(.025,.035,.045),picture,smoothstep(.05,1.15,t));
          float bars=.066*(1.-smoothstep(9.7,11.8,t));
          float film=smoothstep(bars,bars+.004,vUV.y)*(1.-smoothstep(1.-bars-.004,1.-bars,vUV.y));
          picture=mix(vec3(.025,.035,.045),picture,film);
        }
        float vignette=1.-smoothstep(.4,1.2,length(vUV-.5))*.12;picture*=vignette;
        picture+=(hash(vUV*uResolution+fract(uTime)*37.)-.5)*.009;
        gl_FragColor=vec4(picture,1.);
      }`;
    const shader=(type,source)=>{const sh=gl.createShader(type);gl.shaderSource(sh,source);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw new Error('Opening shader unavailable');return sh;};
    const program=gl.createProgram(),shaders=[shader(gl.VERTEX_SHADER,vertex),shader(gl.FRAGMENT_SHADER,fragment)];
    shaders.forEach(sh=>gl.attachShader(program,sh));gl.linkProgram(program);shaders.forEach(sh=>gl.deleteShader(sh));
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Opening renderer unavailable');
    const quad=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,quad);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    const textures=stills.map(()=>gl.createTexture());
    function upload(index,picture){
      gl.activeTexture(gl.TEXTURE0+index);gl.bindTexture(gl.TEXTURE_2D,textures[index]);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
      if(index>0&&picture===image)gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,1,1,0,gl.RGB,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0]));
      else gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,picture);
    }
    stills.forEach((picture,index)=>upload(index,picture));
    const uniforms=Object.fromEntries(['uPicture','uFirst','uDoor','uResolution','uImage','uFirstSize','uDoorSize','uPointer','uIntro','uTime'].map(n=>[n,gl.getUniformLocation(program,n)]));
    const attribute=gl.getAttribLocation(program,'aPosition');
    function size(){const bounds=intro?{width:innerWidth,height:innerHeight}:hero.getBoundingClientRect();const ratio=Math.min(devicePixelRatio||1,innerWidth<761?1:1.25);canvas.width=Math.round(bounds.width*ratio);canvas.height=Math.round(bounds.height*ratio);gl.viewport(0,0,canvas.width,canvas.height);resetSize=false;}
    return{setShot(index,picture){stills[index]=picture;upload(index,picture);},draw(t,time,px,py){
      if(resetSize)size();gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,quad);gl.enableVertexAttribArray(attribute);gl.vertexAttribPointer(attribute,2,gl.FLOAT,false,0,0);
      textures.forEach((texture,index)=>{gl.activeTexture(gl.TEXTURE0+index);gl.bindTexture(gl.TEXTURE_2D,texture);});
      gl.uniform1i(uniforms.uPicture,0);gl.uniform1i(uniforms.uFirst,1);gl.uniform1i(uniforms.uDoor,2);
      gl.uniform2f(uniforms.uResolution,canvas.width,canvas.height);
      ['uImage','uFirstSize','uDoorSize'].forEach((name,index)=>gl.uniform2f(uniforms[name],stills[index].naturalWidth,stills[index].naturalHeight));
      gl.uniform2f(uniforms.uPointer,px,py);gl.uniform1f(uniforms.uIntro,t);gl.uniform1f(uniforms.uTime,time);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    }};
  }

  function lock(active) {
    document.documentElement.classList.toggle('cinema-running',active);
    if(active) {
      const targets=[document.querySelector('.header'),document.querySelector('.skip-link'),hero.querySelector('.world-hero-shell'),...document.querySelectorAll('#main > section:not(.cinematic-hero),body > .partner-strip,body > .footer,body > .back-top,body > dialog')];
      targets.filter(Boolean).forEach(el=>{inertStates.set(el,el.inert);el.inert=true;});
    } else {inertStates.forEach((value,el)=>{el.inert=value;});inertStates.clear();}
  }
  function updateButtons() {
    hero.dataset.motionPaused=String(paused);
    motion.setAttribute('aria-pressed',String(paused));
    motion.setAttribute('aria-label',paused?'첫 화면 움직임 재생':'첫 화면 움직임 멈추기');
    motion.querySelector('.motion-label').textContent=paused?'움직임 재생':'움직임 멈추기';
    motion.querySelector('[aria-hidden]').textContent=paused?'▷':'Ⅱ';
    introPause.textContent=paused?'▷':'Ⅱ';
    introPause.setAttribute('aria-label',paused?'오프닝 재생':'오프닝 멈추기');
  }
  function stopFrame(){cancelAnimationFrame(frame);frame=0;last=0;}
  function start(){if(!frame&&!paused&&!document.hidden&&(intro||visible)&&renderer)frame=requestAnimationFrame(tick);}
  function render(){if(renderer)renderer.draw(intro?introTime:DURATION,clock,x,y);}
  function setChapter(next) {
    if(next===chapter)return;chapter=next;overlay.dataset.chapter=String(next+1);
    const current=chapters[next];
    caption.querySelector('.cinema-chapter-number').textContent=current.number;
    caption.querySelector('.cinema-chapter-title').textContent=current.title;
    caption.querySelector('.cinema-subtitle').textContent=current.subtitle;
    caption.querySelector('.cinema-sentence').replaceChildren(...current.lines.map((text,index)=>{
      const line=document.createElement('span'),words=document.createElement('span');line.className='cinema-line';
      if(next===2&&index===1){const accent=document.createElement('em');accent.textContent='미소';words.append(accent,document.createTextNode('를 더합니다.'));}
      else words.textContent=text;
      line.append(words);return line;
    }));
  }
  function updateIntro() {
    setChapter(introTime<3.55?0:introTime<7.25?1:2);
    const current=chapters[chapter],out=1-smooth((introTime-current.end+.45)/.45);
    caption.querySelector('.cinema-chapter').style.opacity=String(ease((introTime-current.start)/.65)*out);
    caption.querySelectorAll('.cinema-line>span').forEach((words,index)=>{
      const reveal=ease((introTime-current.start-index*.14)/.8);
      words.style.transform=`translate3d(0,${(1-reveal)*110}%,0)`;
      words.style.opacity=String(reveal*out);
    });
    const subtitle=caption.querySelector('.cinema-subtitle'),reveal=ease((introTime-current.start-.4)/.75);
    subtitle.style.opacity=String(reveal*out);subtitle.style.transform=`translate3d(0,${(1-reveal)*12}px,0)`;
    overlay.querySelector('.cinema-progress>span').style.transform=`scaleX(${clamp(introTime/DURATION)})`;
    overlay.style.setProperty('--intro-shade',String(1-smooth((introTime-10.4)/1.4)*.7));
  }
  function loadStill(path) {
    return new Promise(resolve=>{
      const picture=new Image();picture.decoding='async';picture.fetchPriority='high';
      let done=false;
      const finish=result=>{if(done)return;done=true;clearTimeout(timer);picture.onload=picture.onerror=null;resolve(result);};
      const timer=setTimeout(()=>finish(null),3500);
      picture.onload=()=>picture.decode().then(()=>finish(picture),()=>finish(null));
      picture.onerror=()=>finish(null);picture.src=new URL(path,document.baseURI).href;
    });
  }
  function prepareOpening() {
    // Returning visitors and deep links never fetch the two extra opening shots.
    if(!openingLoad)openingLoad=Promise.all(['assets/intro-first-light.jpg','assets/intro-open-door.jpg'].map(loadStill)).then(pictures=>{
      pictures.forEach((picture,index)=>{if(picture){stills[index+1]=picture;if(renderer)renderer.setShot(index+1,picture);}});
      return pictures.every(Boolean);
    }).catch(()=>false);
    return openingLoad;
  }
  function finish(restoreFocus=false) {
    intro=false;introTime=DURATION;hero.dataset.introTime=String(DURATION);
    const focusInIntro=overlay.contains(document.activeElement);
    overlay.hidden=true;lock(false);scene.append(canvas);resetSize=true;
    hero.dataset.cinema='ready';
    try{sessionStorage.setItem('miso-neighbourhood-seen','1');}catch{}
    updateButtons();render();start();
    if(restoreFocus&&focusInIntro){(savedFocus&&savedFocus.isConnected&&savedFocus!==document.body?savedFocus:hero.querySelector('.world-primary')).focus({preventScroll:true});}
  }
  async function begin(returnTo=document.activeElement) {
    if(!renderer||reduced.matches||intro||preparing)return;
    preparing=true;replay.disabled=true;replay.setAttribute('aria-busy','true');
    const ready=await prepareOpening();
    preparing=false;replay.disabled=false;replay.removeAttribute('aria-busy');
    if(!renderer||reduced.matches)return;
    if(!ready){replay.hidden=true;return;}
    // Capture the return target before disabling the replay button blurs it.
    savedFocus=returnTo;window.scrollTo({top:0,behavior:'instant'});
    stopFrame();paused=false;intro=true;introTime=0;clock=0;chapter=-1;x=y=targetX=targetY=0;
    hero.dataset.cinema='intro';overlay.style.opacity='1';overlay.hidden=false;overlay.prepend(canvas);resetSize=true;
    hero.dataset.introTime='0';lock(true);updateIntro();updateButtons();overlay.focus({preventScroll:true});render();start();
  }
  function fallback() {
    stopFrame();renderer=null;canvas.style.display='none';hero.dataset.renderer='fallback';
    replay.hidden=true;finish(true);
  }
  function tick(now) {
    frame=0;if(paused||document.hidden||(!intro&&!visible))return;
    const delta=last?Math.min((now-last)/1000,.06):0;last=now;clock+=delta;
    x+=(targetX-x)*.055;y+=(targetY-y)*.055;
    if(intro) {
      introTime+=delta;hero.dataset.introTime=introTime.toFixed(2);
      updateIntro();
      if(introTime>HANDOFF){hero.dataset.cinema='ready';overlay.style.opacity=String(clamp((DURATION-introTime)/(DURATION-HANDOFF)));}
      if(introTime>=DURATION){finish(true);}
    }
    render();start();
  }
  function toggle(){paused=!paused;updateButtons();if(paused)stopFrame();else start();}
  skip.addEventListener('click',()=>finish(true));replay.addEventListener('click',()=>begin(replay));
  introPause.addEventListener('click',toggle);motion.addEventListener('click',toggle);
  overlay.addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();finish(true);}
    if(event.key==='Tab') {
      event.preventDefault();
      const next=document.activeElement===overlay?(event.shiftKey?skip:introPause):document.activeElement===introPause?skip:introPause;
      next.focus();
    }
  });
  overlay.addEventListener('wheel',event=>{if(event.deltaY>30)finish(true);},{passive:true});
  overlay.addEventListener('touchstart',event=>{touchStart=event.touches[0].clientY;},{passive:true});
  overlay.addEventListener('touchend',event=>{if(touchStart!==null&&touchStart-event.changedTouches[0].clientY>35)finish(true);touchStart=null;},{passive:true});
  const movePointer=event=>{
    if(!finePointer.matches||paused)return;
    const b=intro?{left:0,top:0,width:innerWidth,height:innerHeight}:hero.getBoundingClientRect();
    targetX=(event.clientX-b.left)/b.width*2-1;targetY=1-(event.clientY-b.top)/b.height*2;
  };
  hero.addEventListener('pointermove',movePointer,{passive:true});
  overlay.addEventListener('pointermove',movePointer,{passive:true});
  hero.addEventListener('pointerleave',()=>{targetX=targetY=0;});
  new ResizeObserver(()=>{resetSize=true;if(paused)render();}).observe(hero);
  addEventListener('resize',()=>{resetSize=true;if(paused)render();});
  addEventListener('scroll',()=>{
    document.body.classList.toggle('is-scrolled',scrollY>60);
    const b=hero.getBoundingClientRect();hero.style.setProperty('--hero-scroll',Math.min(1,Math.max(0,-b.top/b.height)).toFixed(3));
  },{passive:true});
  new IntersectionObserver(entries=>{
    visible=entries[0].isIntersecting;document.body.classList.toggle('hero-in-view',visible);
    if(visible)start();else if(!intro)stopFrame();
  }).observe(hero);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopFrame();else start();});
  reduced.addEventListener('change',()=>{
    paused=reduced.matches;if(intro&&paused)finish(true);updateButtons();
    if(paused)stopFrame();else start();
    replay.hidden=reduced.matches||!renderer;
  });
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();fallback();});
  image.addEventListener('error',()=>{if(!image.src.endsWith('hero-busan.jpg'))image.src='assets/hero-busan.jpg';else fallback();});
  document.body.classList.toggle('is-scrolled',scrollY>60);updateButtons();
  async function init() {
    if(reduced.matches){hero.dataset.cinema='ready';hero.dataset.renderer='reduced';replay.hidden=true;return;}
    let seen=false;try{seen=sessionStorage.getItem('miso-neighbourhood-seen')==='1';}catch{}
    const explicit=new URLSearchParams(location.search).get('intro')==='1';
    const wanted=(!seen||explicit)&&!location.hash;
    const initialShots=wanted?prepareOpening():null;
    try{
      hero.dataset.renderer='loading';await image.decode();
      if(reduced.matches){hero.dataset.cinema='ready';hero.dataset.renderer='reduced';replay.hidden=true;return;}
      renderer=createRenderer();
      if(initialShots&&!await initialShots){replay.hidden=true;hero.dataset.renderer='webgl';finish();return;}
      hero.dataset.renderer='webgl';
    }catch(error){console.warn('Cinematic opening: using the still image.',error.message);fallback();return;}
    // Don't interrupt deep links or returning visitors. The replay control remains available.
    if(wanted&&!location.hash&&scrollY<40&&!document.hidden) {
      begin();
    } else {finish();}
  }
  init();
})();
