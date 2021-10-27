import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import abi from "./utils/wavePortal.json"
import './App.css';

const App = () => {
  /*
  * a state variable we use to store our user's public wallet
  */
  const [currentAccount, setCurrentAccount] = useState("");
  const [allWaves, setAllWaves] = useState([]);
  const [message, setMessage] = useState( '' );
  const contractAddress = "0x4991aA7Ac738e92b2c9aD6017650821722b33B38";
  const contractABI = abi.abi;

 
  /*
* Creat a method thar gets all waves from our contract
*/
  const getAllWaves = async () => {
    const { ethereum } = window;

    try {
      if (ethereum) {
        const provider =  new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        /*
        * Call the getAllWaves method from the smartcontract
        */
        const waves = await wavePortalContract.getAllWaves();  

        /*
        * We only need address, timstamp, and messagein our UI so lets pick * those out
        */
        const wavesCleaned = waves.map(wave => {
          return {
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message
          };
        });
        /*
        * Store our data in react state
        */ 
        setAllWaves(wavesCleaned);
        
      } else {
        console.log("Ethereum object doesn't exit!")
      }
    }  catch (error){
      console.log(error);
    }
  }

  useEffect(() => {
  let wavePortalContract;

  const onNewWave = (from, timestamp, message) => {
    console.log('NewWave', from, timestamp, message);
    setAllWaves(prevState => [
      ...prevState,
      {
        address: from,
        timestamp: new Date(timestamp * 1000),
        message: message,
      },
    ]);
  };

  if (window.ethereum) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
    wavePortalContract.on('NewWave', onNewWave);
  }

  return () => {
    if (wavePortalContract) {
      wavePortalContract.off('NewWave', onNewWave);
    }
  };
}, );

  const checkIfWalletIsConnected = async () => {
    /*
    *  Function to check if we have access to window.ethereum
    */
    try {
    const { ethereum } = window;
    if (!ethereum) {
      console.log ("Make sure you have metamask!");
      return;
    }
    else {
      console.log("We have the ethereum object", ethereum);
     
    }
    /*
    *  Check if we're authorized to access the user's wallet
    */
    const accounts = await ethereum.request({method: 'eth_accounts'});
    if (accounts.length !== 0){
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account)
      //getAllWaves();
    } else {
      console.log("No authorized account found")
    }
    } catch (error) {
      console.log(error);
    }
  }

  /*
  *  Implementation of our connectWallet method here
  */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum){
        alert("Get Metamask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts"});
     
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error){
      console.log(error)
    }
  }
 
 /*Function to call our smart contract which retrieve * the total nb of waves
  */

const wave = async () => {
    try {
      const { ethereum } = window;
     

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();

        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
       
        /*
        * Execute the actual wave from your smart 
        * contract
        */
         const waveTxn = await wavePortalContract.wave(message, { gasLimit: 300000 })
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }

/*
*  This run our function when the page loads
* Listen in for emitter events!
*/
  useEffect(() => {
    checkIfWalletIsConnected();
  });
  useEffect(()=>{
    getAllWaves();
  })

return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
          👋 Hey there!
        </div>

        <div className="bio">
          I'm Manon, 42's school student in Paris, with a great interest in Blockchain.
          Connect your Ethereum wallet with Metamask and wave at me!
        </div>
        <div className="textbox">
        <input
         onChange={e=>setMessage(e.target.value)}
         value={message}
          placeholder="Write something here -your best joke ^^-. It will be on the blockchain"/>
        </div>
        <button className="waveButton" onClick={wave}>
          Wave at Me
        </button>
        {!currentAccount && (
          <button className="connectButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        {allWaves.map((wave, index) => {

          return (
            <div key={index} style={{ backgroundColor: "whitesmoke", marginTop: "16px", padding: "8px" }}>
              <p>Address: {wave.address}</p>
              <p>Time: {wave.timestamp.toString()}</p>
              <p>Message: {wave.message}</p>
            </div>)
        })}
         <div className="end">
          !! Thanks @buildspace for this magic project !!
        </div>
      </div>
    </div>
  );
}

export default App
