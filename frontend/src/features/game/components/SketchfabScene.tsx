import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

// ─── Public handle ────────────────────────────────────────────────────────────
export interface SketchfabSceneHandle {
  /** Call with normalized dx/dz [-1..1] * speed, or (0,0) to stop. */
  setVelocity: (dx: number, dz: number) => void;
  /** Move the golden marker to a new 3D target coordinate. */
  setTargetPosition: (x: number, z: number) => void;
  /** Return camera to the default overview position. */
  resetCamera: () => void;
}

interface Props {
  /** Called every rAF frame with the camera's current XZ world position. */
  onCameraMove?: (x: number, z: number) => void;
  /** Called once when the Sketchfab viewer is fully ready. */
  onViewerReady?: () => void;
}

const MODEL_UID = 'd233d528aa924cf59734d4cb01c9d2cd';

// ─── HTML loaded inside the WebView ─────────────────────────────────────────
// Key design decisions:
//  1. Velocity-based rAF loop runs entirely inside the WebView — zero per-frame
//     bridge calls. Only two RN→WebView calls exist: _setVelocity and _setTarget.
//  2. Dark fade cover (#060825) sits over the iframe and dissolves 800ms after
//     viewerready fires — eliminates the visible "jump" on first load.
//  3. A pulsing golden orb shows where the target object is, repositioned each
//     rAF frame using a bearing projection (camera-relative angle → screen %).
const HTML = `<!DOCTYPE html><html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
  <script src="https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js"></script>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{width:100%;height:100%;overflow:hidden;background:#060825}
    #api-frame{width:100%;height:100%;border:none;display:block}

    /* Fade cover: hides the "jump" on initial camera set */
    #cover{
      position:fixed;inset:0;background:#060825;z-index:20;
      pointer-events:none;transition:opacity 1.2s ease;
    }

    /* Target orb: pulsing golden glow marker */
    #orb{
      position:fixed;width:36px;height:36px;border-radius:50%;
      background:radial-gradient(circle,#FFD700 0%,rgba(255,140,0,.7) 55%,transparent 100%);
      transform:translate(-50%,-50%);pointer-events:none;z-index:10;display:none;
      box-shadow:0 0 18px 6px rgba(255,200,0,.6);
      animation:pulse 1s ease-in-out infinite;
    }
    @keyframes pulse{
      0%,100%{transform:translate(-50%,-50%) scale(.85);opacity:.8}
      50%{transform:translate(-50%,-50%) scale(1.3);opacity:1}
    }

    /* "Found!" flash */
    #found-flash{
      position:fixed;inset:0;background:rgba(255,215,0,.22);z-index:15;
      pointer-events:none;opacity:0;transition:opacity .3s;
    }
  </style>
</head>
<body>
  <div id="cover"></div>
  <div id="orb"></div>
  <div id="found-flash"></div>
  <iframe id="api-frame" allow="autoplay;fullscreen;xr-spatial-tracking" allowfullscreen></iframe>

  <script>
    var api=null, ready=false;
    var eye=[0,9,15], tgt=[0,1,0];
    var vel={dx:0,dz:0};
    var looping=false;
    var BOUND=9;
    var targetPos={x:5,z:5};
    var cover=document.getElementById('cover');
    var orb=document.getElementById('orb');
    var foundFlash=document.getElementById('found-flash');

    // ── Sketchfab init ────────────────────────────────────────────────────────
    var client=new Sketchfab(document.getElementById('api-frame'));
    client.init('${MODEL_UID}',{
      success:function(a){
        api=a; api.start();
        api.addEventListener('viewerready',function(){
          ready=true;
          api.setUserInteraction(false);
          // Stable high-angle overview — no getCameraLookAt race
          api.setCameraLookAt([0,9,15],[0,1,0],0);
          setTimeout(function(){
            cover.style.opacity='0';
            orb.style.display='block';
            window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(
              JSON.stringify({type:'READY'})
            );
          },800);
        });
      },
      error:function(){
        cover.style.opacity='0';
        window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(
          JSON.stringify({type:'ERROR'})
        );
      },
      autostart:1,ui_stop:0,ui_controls:0,ui_infos:0,ui_inspector:0,
      ui_watermark_link:0,ui_watermark:0,ui_ar:0,ui_help:0,
      ui_settings:0,ui_vr:0,ui_fullscreen:0,ui_annotations:0,ui_loading:0,
    });

    // ── rAF movement loop (runs entirely in WebView) ──────────────────────────
    function moveLoop(){
      if(!api||!ready){looping=false;return;}
      if(vel.dx===0&&vel.dz===0){looping=false;return;}

      eye[0]+=vel.dx; eye[2]+=vel.dz;
      tgt[0]+=vel.dx; tgt[2]+=vel.dz;

      eye[0]=Math.max(-BOUND,Math.min(BOUND,eye[0]));
      eye[2]=Math.max(-BOUND,Math.min(BOUND,eye[2]));
      tgt[0]=Math.max(-BOUND,Math.min(BOUND,tgt[0]));
      tgt[2]=Math.max(-BOUND,Math.min(BOUND,tgt[2]));

      api.setCameraLookAt(eye,tgt,0);
      placeOrb();

      window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(
        JSON.stringify({type:'POS',x:tgt[0],z:tgt[2]})
      );
      requestAnimationFrame(moveLoop);
    }

    // ── Orb positioning using bearing projection ──────────────────────────────
    function placeOrb(){
      var dx=targetPos.x-tgt[0];
      var dz=targetPos.z-tgt[2];
      var dist=Math.sqrt(dx*dx+dz*dz);

      if(dist<2.5){
        // Very close — show center pulse + golden screen tint
        orb.style.left='50%'; orb.style.top='50%';
        orb.style.width='56px'; orb.style.height='56px';
        foundFlash.style.opacity='1';
      } else {
        foundFlash.style.opacity='0';
        // Bearing from camera forward direction to target
        var fwdX=tgt[0]-eye[0]; var fwdZ=tgt[2]-eye[2];
        var camAngle=Math.atan2(fwdZ,fwdX);
        var toAngle=Math.atan2(dz,dx);
        var rel=toAngle-camAngle;
        // Clamp orb to a band 12–38% from center
        var r=Math.min(38,12+dist*2.2);
        var sx=50+Math.cos(rel)*r;
        var sy=50+Math.sin(rel)*r;
        orb.style.left=sx+'%'; orb.style.top=sy+'%';
        orb.style.width='36px'; orb.style.height='36px';
      }
    }

    // ── Exposed globals (called via injectJavaScript from RN) ─────────────────
    window._setVelocity=function(dx,dz){
      vel.dx=+dx||0; vel.dz=+dz||0;
      if(!looping&&(vel.dx!==0||vel.dz!==0)){
        looping=true; requestAnimationFrame(moveLoop);
      }
    };

    window._setTarget=function(x,z){
      targetPos.x=+x||0; targetPos.z=+z||0;
      placeOrb();
    };

    window._resetCamera=function(){
      eye=[0,9,15]; tgt=[0,1,0];
      vel={dx:0,dz:0};
      if(api&&ready) api.setCameraLookAt(eye,tgt,0.5);
    };
  </script>
</body></html>`;

// ─── Component ────────────────────────────────────────────────────────────────
const SketchfabScene = forwardRef<SketchfabSceneHandle, Props>(
  ({ onCameraMove, onViewerReady }, ref) => {
    const webViewRef = useRef<WebView>(null);

    useImperativeHandle(ref, () => ({
      setVelocity(dx: number, dz: number) {
        webViewRef.current?.injectJavaScript(
          `window._setVelocity(${dx},${dz});true;`
        );
      },
      setTargetPosition(x: number, z: number) {
        webViewRef.current?.injectJavaScript(
          `window._setTarget(${x},${z});true;`
        );
      },
      resetCamera() {
        webViewRef.current?.injectJavaScript(
          `window._resetCamera();true;`
        );
      },
    }));

    const handleMessage = (e: { nativeEvent: { data: string } }) => {
      try {
        const msg = JSON.parse(e.nativeEvent.data);
        if (msg.type === 'POS' && onCameraMove) onCameraMove(msg.x, msg.z);
        if (msg.type === 'READY' && onViewerReady) onViewerReady();
      } catch (_) {}
    };

    return (
      <View style={styles.container}>
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: HTML }}
          style={styles.webview}
          onMessage={handleMessage}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          domStorageEnabled
          mixedContentMode="always"
          allowsFullscreenVideo
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
        />
      </View>
    );
  }
);

SketchfabScene.displayName = 'SketchfabScene';
export default SketchfabScene;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060825' },
  webview:   { flex: 1, backgroundColor: 'transparent' },
});
