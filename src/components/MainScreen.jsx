import React, { useState, useEffect, useContext } from 'react';
import { GlobalContext } from "./GlobalContext";
import './../assets/scss/main.scss';

import BoxButton from './BoxButton.jsx';

const MainScreen = (props) => {
  const { escapp, appSettings, Utils, I18n } = useContext(GlobalContext);
  const [currentSolution, setCurrentSolution] = useState([]);
  const [processingSolution, setProcessingSolution] = useState(false);
  const [light, setLight] = useState("off");
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [containerMarginTop, setContainerMarginTop] = useState(0);
  const [containerMarginLeft, setContainerMarginLeft] = useState(0);
  const [boxWidth, setBoxWidth] = useState(0);
  const [boxHeight, setBoxHeight] = useState(0);
  const [lightWidth, setLightWidth] = useState(0);
  const [lightHeight, setLightHeight] = useState(0);
  const [lightLeft, setLightLeft] = useState(0);
  const [lightTop, setLightTop] = useState(0);

  useEffect(() => {
    handleResize();
  }, [props.appWidth, props.appHeight]);

  function handleResize(){
    if((props.appHeight === 0)||(props.appWidth === 0)){
      return;
    }

    let aspectRatio = 4 / 3;
    let _keypadWidth = Math.min(props.appHeight * aspectRatio, props.appWidth);
    let _keypadHeight = _keypadWidth / aspectRatio;

    let _containerWidth = _keypadWidth * 0.22;
    let _containerHeight = _keypadHeight * 0.4;
    let _containerMarginLeft;
    let _containerMarginTop;

    let _boxWidth = _keypadWidth * 0.06;
    let _boxHeight = _keypadHeight * 0.1;

    let _lightWidth;
    let _lightHeight;
    let _lightLeft;
    let _lightTop;

    switch(appSettings.skin){
      case "RETRO":
      case "RETRO_JUNGLE":
      case "RETRO_REALISTIC":
        _containerMarginTop = _keypadHeight * 0.12;
        _containerMarginLeft = 0;
        _lightWidth = _keypadWidth * 0.08;
        _lightHeight = _keypadHeight * 0.11;
        _lightLeft = props.appWidth / 2 - _keypadWidth * 0.041;
        _lightTop = props.appHeight / 2 - _keypadHeight * 0.265;
        break;
      case "FUTURISTIC":
        _containerMarginTop = 0;
        _containerMarginLeft = _keypadWidth * -0.065;
        _lightWidth = _keypadWidth * 0.045;
        _lightHeight = _keypadHeight * 0.48;
        _lightLeft = props.appWidth / 2 + _keypadWidth / 2 * 0.27;
        _lightTop = props.appHeight / 2 - _keypadHeight / 2 * 0.48;
        break;
      default:
        //Standard skin
        _containerMarginTop = 0;
        _containerMarginLeft = _keypadWidth * 0.045;
        _lightWidth = _keypadWidth * 0.05;
        _lightHeight = _keypadHeight * 0.5;
        _lightLeft = props.appWidth / 2 + _keypadWidth / 2 * 0.35;
        _lightTop = props.appHeight / 2 - _keypadHeight / 2 * 0.8;
    }

    setContainerWidth(_containerWidth);
    setContainerHeight(_containerHeight);
    setContainerMarginTop(_containerMarginTop);
    setContainerMarginLeft(_containerMarginLeft);

    setBoxWidth(_boxWidth);
    setBoxHeight(_boxHeight);

    setLightWidth(_lightWidth);
    setLightHeight(_lightHeight);
    setLightLeft(_lightLeft);
    setLightTop(_lightTop);
  }

  const onClickButton = (value) => {
    if (processingSolution) {
      return;
    }
    Utils.log("onClickButton", value);
    setProcessingSolution(true);

    const shortBeep = document.getElementById("audio_beep");
    shortBeep.pause();
    shortBeep.currentTime = 0;
    shortBeep.play();

    setTimeout(() => {
      currentSolution.push(value);
      if (currentSolution.length < appSettings.solutionLength) {
        setCurrentSolution(currentSolution);
        setProcessingSolution(false);
      } else {
        const solution = currentSolution.join(";");
        setCurrentSolution([]);
        Utils.log("Check solution", solution);
        escapp.checkNextPuzzle(solution, {}, (success, erState) => {
          Utils.log("Check solution Escapp response", success, erState);
          try {
            setTimeout(() => {
              changeBoxLight(success, solution);
            }, 700);
          } catch(e){
            Utils.log("Error in checkNextPuzzle",e);
          }
        });
      }
    }, 300);
  }

  const changeBoxLight = (success, solution) => {
    let audio;
    let afterChangeBoxLightDelay = 1000;
    let isRetro = appSettings.skin.includes("RETRO");

    if (success) {
      audio = document.getElementById("audio_success");
      setLight("ok");
      afterChangeBoxLightDelay = ((isRetro===true) ? 4500 : 1500);
    } else {
      audio = document.getElementById("audio_failure");
      setLight("nok");
    }

    setTimeout(() => {
      if((success===false)||(isRetro === false)){
        setLight("off");
        setProcessingSolution(false);
      }
      if (success) {
        props.onKeypadSolved(solution);
      }
    }, afterChangeBoxLightDelay);

    audio.play();
  }

  let backgroundImage = 'url("' + appSettings.backgroundKeypad + '")';
  let boxLightTransitionClass = (light === "ok" && appSettings.skin.includes("RETRO")) ? "slowTransition" : "";

  return (
    <div id="screen_main" className={"screen_content"} style={{ backgroundImage: backgroundImage }}>
      <div id="keypad" style={{ width: containerWidth, height: containerHeight, marginTop: containerMarginTop, marginLeft: containerMarginLeft }}>
        <audio id="audio_beep" src={appSettings.soundBeep} autostart="false" preload="auto" />
        <audio id="audio_failure" src={appSettings.soundNok} autostart="false" preload="auto" />
        <audio id="audio_success" src={appSettings.soundOk} autostart="false" preload="auto" />
        <div id="row1" className="row">
          <BoxButton value={appSettings.keys[0]} position={1} onClick={onClickButton} boxHeight={boxHeight} boxWidth={boxWidth} />
          <BoxButton value={appSettings.keys[1]} position={2} onClick={onClickButton} boxHeight={boxHeight} boxWidth={boxWidth} />
          <BoxButton value={appSettings.keys[2]} position={3} onClick={onClickButton} boxHeight={boxHeight} boxWidth={boxWidth} />
        </div>
        <div id="row2" className="row">
          <BoxButton value={appSettings.keys[3]} position={4} onClick={onClickButton} boxHeight={boxHeight} boxWidth={boxWidth} />
          <BoxButton value={appSettings.keys[4]} position={5} onClick={onClickButton} boxHeight={boxHeight} boxWidth={boxWidth} />
          <BoxButton value={appSettings.keys[5]} position={6} onClick={onClickButton} boxHeight={boxHeight} boxWidth={boxWidth} />
        </div>
        <div id="row3" className="row">
          <BoxButton value={appSettings.keys[6]} position={7} onClick={onClickButton} boxHeight={boxHeight} boxWidth={boxWidth} />
          <BoxButton value={appSettings.keys[7]} position={8} onClick={onClickButton} boxHeight={boxHeight} boxWidth={boxWidth} />
          <BoxButton value={appSettings.keys[8]} position={9} onClick={onClickButton} boxHeight={boxHeight} boxWidth={boxWidth} />
        </div>
        <div id="row4" className="row">
          <BoxButton value={appSettings.keys[9]} position={10} onClick={onClickButton} boxHeight={boxHeight} boxWidth={boxWidth} />
          <BoxButton value={appSettings.keys[10]} position={11} onClick={onClickButton} boxHeight={boxHeight} boxWidth={boxWidth} />
          <BoxButton value={appSettings.keys[11]} position={12} onClick={onClickButton} boxHeight={boxHeight} boxWidth={boxWidth} />
        </div>
        <div className={`boxLight boxLight_off ${boxLightTransitionClass}`} style={{ visibility: light === "off" ? "visible" : "hidden", opacity: light === "off" ? "1" : "0", width: lightWidth, height: lightHeight, backgroundImage: 'url("' + appSettings.imageLightOff + '")', left: lightLeft, top: lightTop }} ></div> 
        <div className={`boxLight boxLight_nok ${boxLightTransitionClass}`} style={{ visibility: light === "nok" ? "visible" : "hidden", opacity: light === "nok" ? "1" : "0", width: lightWidth, height: lightHeight, backgroundImage: 'url("' + appSettings.imageLightNok + '")', left: lightLeft, top: lightTop }} ></div> 
        <div className={`boxLight boxLight_ok ${boxLightTransitionClass}`} style={{ visibility: light === "ok" ? "visible" : "hidden", opacity: light === "ok" ? "1" : "0", width: lightWidth, height: lightHeight, backgroundImage: 'url("' + appSettings.imageLightOk + '")', left: lightLeft, top: lightTop }} ></div> 
      </div>
    </div>);
};

export default MainScreen;



