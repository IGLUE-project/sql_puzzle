import { useContext } from 'react';
import { GlobalContext } from "./GlobalContext";
import './../assets/scss/main.scss';
import DB  from "./DB.jsx";

const MainScreen = (props) => {
  const { escapp, appSettings, Utils } = useContext(GlobalContext);
 
  let backgroundImage = 'url("' + appSettings.backgroundKeypad + '")';

  const checkSolution = (solution) => {
    escapp.checkNextPuzzle(solution, {}, (success, erState) => {
      Utils.log("Check solution Escapp response", success, erState);
      try {
        setTimeout(() => {
          if (success) {
            props.onQueryRun(solution);
          }
        }, 1000);
      } catch(e){
        Utils.log("Error in checkNextPuzzle",e);
      }
    });
  }

  return (
    <div id="screen_main" className={"screen_content"} >
      <DB checkSolution={checkSolution}/>
    </div>);
};

export default MainScreen;



