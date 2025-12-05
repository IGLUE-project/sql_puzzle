import React from 'react';
import {useState, useEffect, useRef, useContext } from 'react';
import { GlobalContext } from "./GlobalContext";
import './../assets/scss/app.scss';

import { DEFAULT_APP_SETTINGS, ESCAPP_CLIENT_SETTINGS, MAIN_SCREEN, MESSAGE_SCREEN } from '../constants/constants.jsx';
import MainScreen from './MainScreen.jsx';
import MessageScreen from './MessageScreen.jsx';

export default function App() {
  const { escapp, setEscapp, appSettings, setAppSettings, Storage, setStorage, Utils, I18n } = useContext(GlobalContext);
  const hasExecutedEscappValidation = useRef(false);
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState(MAIN_SCREEN);
  const prevScreen = useRef(screen);
  const solution = useRef(null);
 
  
  useEffect(() => {
    //Init Escapp client
    if(escapp !== null){
      return;
    }
    //Create the Escapp client instance.
    let _escapp = new ESCAPP(ESCAPP_CLIENT_SETTINGS);
    setEscapp(_escapp);
    Utils.log("Escapp client initiated with settings:", _escapp.getSettings());

    //Use the storage feature provided by Escapp client.
    setStorage(_escapp.getStorage());

    //Get app settings provided by the Escapp server.
    let _appSettings = processAppSettings(_escapp.getAppSettings());
    setAppSettings(_appSettings);
    Utils.log("App settings:", _appSettings);
  }, []);

  function processAppSettings(_appSettings){
    if(typeof _appSettings !== "object"){
      _appSettings = {};
    }
    if((typeof _appSettings.skin === "undefined")&&(typeof DEFAULT_APP_SETTINGS.skin === "string")){
      _appSettings.skin = DEFAULT_APP_SETTINGS.skin;
    }

    
    const oldLink = document.getElementById("bootswatch-theme");
    if (oldLink) {
      oldLink.remove();
    }

    const link = document.createElement("link");
    link.id = "bootswatch-theme";
    link.rel = "stylesheet";
    link.href = `https://cdn.jsdelivr.net/npm/bootswatch@5/dist/${_appSettings.theme}/bootstrap.min.css`;
    document.head.appendChild(link);
    
    const allowedActions = ["NONE", "SHOW_MESSAGE"];

    if(!allowedActions.includes(_appSettings.actionAfterSolve)) {
      _appSettings.actionAfterSolve = DEFAULT_APP_SETTINGS.actionAfterSolve;
    }

    //Init internacionalization module
    I18n.init(_appSettings);

    if(typeof _appSettings.message !== "string"){
      _appSettings.message = I18n.getTrans("i.message");
    }

    if (typeof _appSettings.backgroundImg === "string" && _appSettings.backgroundImg.trim() !== "" && _appSettings.backgroundImg !== "NONE") {
      _appSettings.backgroundImageProp = `url("${_appSettings.backgroundImg}")`;
      _appSettings.backgroundRepeat = "no-repeat";
      _appSettings.backgroundSize = "contain";
    }

    //Change HTTP protocol to HTTPs in URLs if necessary
    _appSettings = Utils.checkUrlProtocols(_appSettings);

    //Preload resources (if necessary)
    Utils.preloadImages([_appSettings.backgroundMessage]);
    //Utils.preloadAudios([_appSettings.soundBeep,_appSettings.soundNok,_appSettings.soundOk]); //Preload done through HTML audio tags
    //Utils.preloadVideos(["videos/some_video.mp4"]);

    return _appSettings;
  }

  useEffect(() => {
    if (!hasExecutedEscappValidation.current && escapp !== null && appSettings !== null && Storage !== null) {
      hasExecutedEscappValidation.current = true;

      //Register callbacks in Escapp client and validate user.
      escapp.registerCallback("onNewErStateCallback", function(erState){
        try {
          Utils.log("New escape room state received from ESCAPP", erState);
          restoreAppState(erState);
        } catch (e){
          Utils.log("Error in onNewErStateCallback", e);
        }
      });

      escapp.registerCallback("onErRestartCallback", function(erState){
        try {
          Utils.log("Escape Room has been restarted.", erState);
          if(typeof Storage !== "undefined"){
            Storage.removeSetting("state");
          }
        } catch (e){
          Utils.log("Error in onErRestartCallback", e);
        }
      });

      //Validate user. To be valid, a user must be authenticated and a participant of the escape room.
      escapp.validate((success, erState) => {
        try {
          Utils.log("ESCAPP validation", success, erState);
          if(success){
            restoreAppState(erState);
            setLoading(false);
          }
        } catch (e){
          Utils.log("Error in validate callback", e);
        }
      });
    }
  }, [escapp, appSettings, Storage]);
 

  useEffect(() => {
    if (screen !== prevScreen.current) {
      Utils.log("Screen ha cambiado de", prevScreen.current, "a", screen);
      prevScreen.current = screen;
      saveAppState();
    }
  }, [screen]);


  function restoreAppState(erState){
    Utils.log("Restore application state based on escape room state:", erState);
    if (escapp.getAllPuzzlesSolved() && (escapp.getSolvedPuzzles().length > 0)){
      //Puzzle already solved
      if((appSettings.actionAfterSolve === "SHOW_MESSAGE")&&(screen !== MESSAGE_SCREEN)){
        setScreen(MESSAGE_SCREEN);
      }
    } else {
      //Puzzle not solved. Restore app state based on local storage.
      restoreAppStateFromLocalStorage();
    }
  }

  function restoreAppStateFromLocalStorage(){
    if(typeof Storage !== "undefined"){
      let stateToRestore = Storage.getSetting("state");
      if(stateToRestore){
        Utils.log("Restore app state", stateToRestore);
        setScreen(stateToRestore.screen);
        if(typeof stateToRestore.solution === "string"){
          solution.current = stateToRestore.solution;
        }
      }
    }
  }

  function saveAppState(){
    if(typeof Storage !== "undefined"){
      let currentAppState = {screen: screen};
      if(screen === MESSAGE_SCREEN){
        currentAppState.solution = solution.current;
      }
      Utils.log("Save app state in local storage", currentAppState);
      Storage.saveSetting("state",currentAppState);
    }
  }

  function onQueryRun(_solution){
    Utils.log("onQueryRun with solution:", _solution);
    if(typeof _solution !== "string"){
      return;
    }
    solution.current = _solution;

    switch(appSettings.actionAfterSolve){
      case "SHOW_MESSAGE":
        return setTimeout(()=>{setScreen(MESSAGE_SCREEN)}, 5000); // setScreen(MESSAGE_SCREEN);
      case "NONE":
      default:
        return submitPuzzleSolution();
    }
  }

  function submitPuzzleSolution(){
    Utils.log("Submit puzzle solution", solution.current);

    escapp.submitNextPuzzle(solution.current, {}, (success, erState) => {
      if(!success){
        setScreen(MAIN_SCREEN);
      }
      Utils.log("Solution submitted to Escapp", solution.current, success, erState);
    });
  }

  const renderScreens = (screens) => {
    if (loading === true) {
      return null;
    } else {
      return (
        <>
          {screens.map(({ id, content }) => renderScreen(id, content))}
        </>
      );
    }
  };

  const renderScreen = (screenId, screenContent) => (
    <div key={screenId} className={`screen_wrapper ${screen === screenId ? 'active' : ''}`} >
      {screenContent}
    </div>
  );

  let screens = [
    {
      id: MAIN_SCREEN,
      content: <MainScreen onQueryRun={onQueryRun} />
    },
    {
      id: MESSAGE_SCREEN,
      content: <MessageScreen submitPuzzleSolution={submitPuzzleSolution} />
    }
  ];

  let globalWrapperStyle = {};
  console.log(appSettings !== null && (typeof appSettings.backgroundImg) === "string")
  if(appSettings !== null && ((typeof appSettings.backgroundImg) === "string")){
    globalWrapperStyle = {
      backgroundImage: "url("+appSettings.backgroundImg+")",
      backgroundRepeat: appSettings.backgroundRepeat,
      backgroundSize: appSettings.backgroundSize,
    }
  }
  console.log(globalWrapperStyle)
  return (
    <div id="global_wrapper"  style={globalWrapperStyle} >
      {renderScreens(screens)}
    </div>
  )
}