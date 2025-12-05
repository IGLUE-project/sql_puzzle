import React, { useState, useEffect, useContext } from 'react';
import { GlobalContext } from "./GlobalContext";
import './../assets/scss/message.scss';
import { Card } from 'react-bootstrap';
const MessageScreen = (props) => {
  const { escapp, appSettings, Utils, I18n } = useContext(GlobalContext);
  console.log(appSettings)
  let backgroundImage = 'url("' + appSettings.backgroundImg + '")';
 
  return (
    <div id="screen_message" className="screen_content flex justify-content-center align-items-center" style={{ width: "100vw", height: "100vh" }}>
      <Card className="message_card justify-content-center align-items-center">
        <Card.Body>
      <div id="message_text" >
        <p>{appSettings.message}</p> 
      </div>
      <div className="flex align-items-center justify-content-center">
        <div className={"btn btn-primary btn-lg message_button"} onClick={() => props.submitPuzzleSolution()}>
          {I18n.getTrans("i.continue")}
        </div>
      </div>
    </Card.Body>
    </Card>
    </div>
  );
};

export default MessageScreen;