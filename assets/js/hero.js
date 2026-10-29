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
  const DURATION = 24;
  const HANDOFF = 23;
  const stills = [image, image, image, image, image];
  let renderer = null, frame = 0, last = 0, nextPaint = 0, clock = 0, introTime = 0;
  let intro = false, paused = reduced.matches, visible = true, chapter = -1;
  let x = 0, y = 0, targetX = 0, targetY = 0, savedFocus = null;
  let touchStart = null, resetSize = true, openingLoad = null, openingVariant = null, preparing = false;
  const inertStates = new Map();
  const chapters = [
    {number:'01', title:'', lines:['작은 가게 하나에,','한 가족의 삶이 있습니다.'], subtitle:'', start:.7, end:3.95},
    {number:'02', title:'', lines:['쉽지 않은 날에도,','포기하지 않는 당신.'], subtitle:'', start:5.15, end:8.95},
    {number:'03', title:'', lines:['사랑하는 사람들과','오래 웃으며 살 수 있도록.'], subtitle:'', start:10.2, end:13.75},
    {number:'04', title:'', lines:['가게를 이어갈 힘,','미소금융이 보태겠습니다.'], subtitle:'', start:15.05, end:18.5},
    {number:'05', title:'', lines:['당신의 시작에,','미소를 더합니다.'], subtitle:'미소금융부산중구법인', start:19.8, end:23.6}
  ];

  const clamp = value => Math.max(0,Math.min(1,value));
  const smooth = value => {const n=clamp(value);return n*n*(3-2*n);};
  const ease = value => 1-Math.pow(1-clamp(value),3);

  // Three art-directed brand stills, not documentary customer photographs.
  // One coherent morning: unlock, reflect, send a daughter to school, then return to work.
  function createRenderer() {
    const gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,powerPreference:'low-power'});
    if(!gl)throw new Error('WebGL unavailable');
    const vertex=`attribute vec2 aPosition;varying vec2 vUV;void main(){vUV=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}`;
    const fragment=`#ifdef GL_FRAGMENT_PRECISION_HIGH
      precision highp float;
      #else
      precision mediump float;
      #endif
      varying vec2 vUV;
      uniform sampler2D uPicture,uFirst,uQuiet,uFarewell,uWork;
      uniform vec2 uResolution,uImage,uFirstSize,uQuietSize,uFarewellSize,uWorkSize,uPointer;uniform float uIntro,uTime,uCompact;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      vec3 shot(sampler2D source,vec2 dimensions,vec2 centre,float zoom,float blur,float fitMode){
        float aspect=uResolution.x/uResolution.y,imageAspect=dimensions.x/dimensions.y;
        bool fit=fitMode>.5;
        vec2 crop=fit?vec2(max(1.,aspect/imageAspect),max(1.,imageAspect/aspect)):vec2(min(1.,aspect/imageAspect),min(1.,imageAspect/aspect));
        if(fit){if(aspect<imageAspect){crop=vec2(.8,.8*imageAspect/aspect);centre=vec2(.56,.5);}else{centre=vec2(.5);}zoom=1.;}else{vec2 halfCrop=crop*.5/zoom;centre=clamp(centre,halfCrop+vec2(.002),vec2(.998)-halfCrop);}
        vec2 raw=(vUV-.5)*crop/zoom+centre,uv=clamp(raw,vec2(.002),vec2(.998));
        vec3 colour=texture2D(source,uv).rgb;
        if(blur>.05){vec2 spread=crop/zoom*blur/uResolution;colour=colour*.4+(texture2D(source,uv+vec2(spread.x,0.)).rgb+texture2D(source,uv-vec2(spread.x,0.)).rgb+texture2D(source,uv+vec2(0.,spread.y)).rgb+texture2D(source,uv-vec2(0.,spread.y)).rgb)*.15;}
        float inside=fit?step(0.,raw.x)*step(raw.x,1.)*step(0.,raw.y)*step(raw.y,1.):1.;
        return mix(vec3(.022,.041,.06),colour,inside);
      }
      vec3 familyScene(float t){
        float aspect=uResolution.x/uResolution.y,imageAspect=uImage.x/uImage.y;
        float travel=smoothstep(18.65,23.1,t),settled=smoothstep(21.5,24.,t);
        bool portrait=imageAspect<1.2;
        vec2 crop=vec2(min(1.,aspect/imageAspect),min(1.,imageAspect/aspect));
        float zoom=mix(1.12,1.018,travel)+sin(uTime*.065)*.002*settled;
        vec2 centre=mix(vec2(.54,.5),vec2(.5,.5),travel);
        if(portrait){centre=vec2(.5,.5);zoom=1.;}
        vec2 uv=(vUV-.5)*crop/zoom+centre;
        float contained=1.;
        if(portrait&&t<24.){
          // Show both faces in the portrait finale rather than cropping either person.
          vec2 fit=vec2(max(1.,aspect/imageAspect),max(1.,imageAspect/aspect));
          vec2 focus=vec2(.5);
          if(aspect<imageAspect){fit=vec2(.83,.83*imageAspect/aspect);focus=vec2(.56,.5);}
          uv=(vUV-.5)*fit+focus;
          contained=smoothstep(-.005,.005,uv.x)*(1.-smoothstep(.995,1.005,uv.x))*smoothstep(-.005,.005,uv.y)*(1.-smoothstep(.995,1.005,uv.y));
        }else if(!portrait){
          uv+=uPointer*vec2(.0035,.002)*pow(1.-vUV.y,2.)*settled;
          uv.x+=sin(uTime*.045)*.0012*settled;
        }
        vec3 picture=texture2D(uPicture,clamp(uv,vec2(.002),vec2(.998))).rgb;
        float left=1.-smoothstep(.12,.63,vUV.x);
        float shade=mix(left*.57,.025,uCompact)*settled;
        picture=mix(picture,vec3(.042,.078,.108),shade);
        return mix(vec3(.028,.055,.075),picture,contained);
      }
      void main(){
        float t=uIntro,aspect=uResolution.x/uResolution.y;
        vec3 picture;
        if(t>=24.){picture=familyScene(t);}else{
          float cut1=smoothstep(4.05,4.95,t),cut2=smoothstep(9.1,10.,t),cut3=smoothstep(13.9,14.8,t),cut4=smoothstep(18.65,19.6,t);
          vec3 first=vec3(0.),quiet=vec3(0.),farewell=vec3(0.),work=vec3(0.),wide=vec3(0.);
          float m1=smoothstep(0.,4.95,t),m2=smoothstep(4.05,10.,t),m3=smoothstep(9.1,14.8,t),m4=smoothstep(13.9,19.6,t);
          if(cut1<1.){
            // Keep the focal point inside the available crop throughout the move.
            float firstAspect=uFirstSize.x/uFirstSize.y,firstZoom=mix(1.075,1.025,m1);
            vec2 firstCrop=vec2(min(1.,aspect/firstAspect),min(1.,firstAspect/aspect));
            vec2 firstCentre=vec2(.5)+vec2(.12,0.)*(vec2(1.)-firstCrop/firstZoom);
            first=shot(uFirst,uFirstSize,firstCentre,firstZoom,1.5*(1.-smoothstep(.2,1.4,t)),0.);
          }
          if(cut1>0.&&cut2<1.){vec2 centre=mix(vec2(.67,.49),vec2(.70,.5),m2);centre.x=mix(centre.x,.70,uCompact);quiet=shot(uQuiet,uQuietSize,centre,mix(1.12,1.025,m2),1.6*(1.-smoothstep(4.3,5.5,t)),0.);}
          if(cut2>0.&&cut3<1.){float fit=uFarewellSize.x/uFarewellSize.y<1.2?1.:0.;farewell=shot(uFarewell,uFarewellSize,vec2(.54,.49),mix(1.045,1.005,m3),1.8*(1.-smoothstep(9.25,10.6,t)),fit);}
          if(cut3>0.&&cut4<1.){vec2 centre=mix(vec2(.65,.49),vec2(.68,.50),m4);centre.x=mix(centre.x,.70,uCompact);work=shot(uWork,uWorkSize,centre,mix(1.12,1.025,m4),2.2*(1.-smoothstep(14.,15.3,t)),0.);}
          if(cut4>0.)wide=familyScene(t);
          picture=mix(mix(mix(mix(first,quiet,cut1),farewell,cut2),work,cut3),wide,cut4);
          float beam=exp(-pow((vUV.x+vUV.y*.55-1.14)*3.6,2.));
          picture+=vec3(.022,.015,.006)*beam*smoothstep(9.2,11.2,t)*(1.-smoothstep(21.,23.,t));
          picture=mix(vec3(.02,.035,.05),picture,smoothstep(.12,1.45,t));
          float bars=.068*(1.-smoothstep(22.3,24.,t));
          float film=smoothstep(bars,bars+.004,vUV.y)*(1.-smoothstep(1.-bars-.004,1.-bars,vUV.y));
          picture=mix(vec3(.02,.035,.05),picture,film);
        }
        float vignette=1.-smoothstep(.38,1.12,length(vUV-.5))*.10;picture*=vignette;
        picture+=(hash(vUV*uResolution+floor(uTime*24.))-.5)*.007;
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
    const uniforms=Object.fromEntries(['uPicture','uFirst','uQuiet','uFarewell','uWork','uResolution','uImage','uFirstSize','uQuietSize','uFarewellSize','uWorkSize','uPointer','uIntro','uTime','uCompact'].map(n=>[n,gl.getUniformLocation(program,n)]));
    const attribute=gl.getAttribLocation(program,'aPosition');
    function size(){const bounds=intro?{width:innerWidth,height:innerHeight}:scene.getBoundingClientRect();const ratio=Math.min(devicePixelRatio||1,innerWidth<761?1:1.25);canvas.width=Math.round(bounds.width*ratio);canvas.height=Math.round(bounds.height*ratio);gl.viewport(0,0,canvas.width,canvas.height);resetSize=false;}
    return{setShot(index,picture){stills[index]=picture;upload(index,picture);},draw(t,time,px,py){
      if(resetSize)size();gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,quad);gl.enableVertexAttribArray(attribute);gl.vertexAttribPointer(attribute,2,gl.FLOAT,false,0,0);
      textures.forEach((texture,index)=>{gl.activeTexture(gl.TEXTURE0+index);gl.bindTexture(gl.TEXTURE_2D,texture);});
      gl.uniform1i(uniforms.uPicture,0);gl.uniform1i(uniforms.uFirst,1);gl.uniform1i(uniforms.uQuiet,2);gl.uniform1i(uniforms.uFarewell,3);gl.uniform1i(uniforms.uWork,4);
      gl.uniform2f(uniforms.uResolution,canvas.width,canvas.height);gl.uniform1f(uniforms.uCompact,innerWidth<981?1:0);
      ['uImage','uFirstSize','uQuietSize','uFarewellSize','uWorkSize'].forEach((name,index)=>gl.uniform2f(uniforms[name],stills[index].naturalWidth,stills[index].naturalHeight));
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
  function stopFrame(){cancelAnimationFrame(frame);frame=0;last=0;nextPaint=0;}
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
      if(next===chapters.length-1&&index===1){const accent=document.createElement('em');accent.textContent='미소';words.append(accent,document.createTextNode('를 더합니다.'));}
      else words.textContent=text;
      line.append(words);return line;
    }));
  }
  function updateIntro() {
    setChapter(introTime<4.5?0:introTime<9.55?1:introTime<14.35?2:introTime<19.15?3:4);
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
    overlay.style.setProperty('--intro-shade',String(1-smooth((introTime-22.3)/1.7)*.7));
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
    const variant=innerWidth/innerHeight<1.1?'portrait':'wide';
    if(!openingLoad||openingVariant!==variant){
      openingVariant=variant;
      const paths=['assets/cinema/opening-key.webp','assets/cinema/quiet-morning-daylight.webp',variant==='portrait'?'assets/cinema/farewell-mobile.webp':'assets/cinema/farewell.webp','assets/cinema/hands-at-work.webp'];
      openingLoad=Promise.all(paths.map(loadStill)).then(pictures=>{
        if(openingVariant!==variant)return prepareOpening();
        pictures.forEach((picture,index)=>{if(picture){stills[index+1]=picture;if(renderer)renderer.setShot(index+1,picture);}});
        return pictures.every(Boolean);
      }).catch(()=>false);
    }
    return openingLoad;
  }

  function finish(restoreFocus=false) {
    intro=false;introTime=DURATION;hero.dataset.introTime=String(DURATION);
    const focusInIntro=overlay.contains(document.activeElement);
    overlay.hidden=true;lock(false);scene.append(canvas);resetSize=true;
    hero.dataset.cinema='ready';
    try{localStorage.setItem('miso-morning-film-20261028',String(Date.now()));}catch{}
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
    // Anchor deadlines to the display clock: a slightly early callback must not
    // turn a 33 ms interval into a 50 ms gap. Use 60 fps during the opening.
    if(nextPaint&&now+.5<nextPaint){start();return;}
    const interval=1000/(intro?60:30);
    nextPaint=nextPaint&&now-nextPaint<interval?nextPaint+interval:now+interval;
    const delta=last?Math.min((now-last)/1000,.12):0;last=now;clock+=delta;
    const follow=1-Math.exp(-3.4*delta);
    x+=(targetX-x)*follow;y+=(targetY-y)*follow;
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
  addEventListener('resize',()=>{resetSize=true;if(openingLoad)prepareOpening().then(()=>render());if(paused)render();});
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
  image.addEventListener('load',()=>{image.hidden=false;if(renderer){renderer.setShot(0,image);resetSize=true;render();}});
  image.addEventListener('error',()=>{image.hidden=true;fallback();});
  document.body.classList.toggle('is-scrolled',scrollY>60);updateButtons();
  async function init() {
    if(reduced.matches){hero.dataset.cinema='ready';hero.dataset.renderer='reduced';replay.hidden=true;return;}
    let seen=false;try{const saved=Number(localStorage.getItem('miso-morning-film-20261028'));seen=saved>0&&Date.now()-saved<7*86400000;}catch{}
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
