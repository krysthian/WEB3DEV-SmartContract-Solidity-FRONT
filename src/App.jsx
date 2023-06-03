import React, { useEffect, useState, useId } from "react";
import { ethers } from "ethers";
import './App.css';
import abi from "./utils/WavePortal.json";
import LoadingSpinner from "./LoadingSpinner";

export default function App(props) {

  const [currentAccount, setCurrentAccount] = useState("");
  const [allWaves, setAllWaves] = useState([]);
  //const contractAddress = "0x3A27A422408e6187068E1c008E6CF0ab48e5c824";
  //const contractAddress = "0x1b4872F8f874a051ddc06b503739532Dda1fDB72";
  //const contractAddress = "0xD0BeD10949d91A58316090fac4AA95AeFdb16D6D";
  //const contractAddress = "0xD8CFD210E2fe5CB74C3F6882e203F9201D6eE342";
  const contractAddress = "0x85c25bef83F069C1e53f592F2C19655b280C787f";
  
  
  const contractABI = abi.abi;

  const id = null;//useId();
  const [input, setInput] = useState(props?.value ?? '');
  

  const [isLoading, setIsLoading] = useState(false);
  
  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Garanta que possua a Metamask instalada!");
        return;
      } else {
        console.log("Temos o objeto ethereum", ethereum);
      }

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Encontrada a conta autorizada:", account);
        setCurrentAccount(account);
        getAllWaves();
      } else {
        console.log("Nenhuma conta autorizada foi encontrada")
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
  * Implemente aqui o seu método connectWallet
  */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("MetaMask encontrada!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Conectado", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])

  const wave = async () => {
    try {

      setIsLoading(true);
      
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
        
        let count = await wavePortalContract.getTotalWaves();
        console.log("Recuperado o número de tchauzinhos...", count.toNumber());

        /*
        * Executar o tchauzinho a partir do contrato inteligente
        */
        
        const waveTxn = await wavePortalContract.wave(input, { gasLimit: 300000 })
        //const waveTxn = await wavePortalContract.wave(input)
        //const waveTxn = await wavePortalContract.wave();
        console.log("Minerando...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Minerado -- ", waveTxn.hash);

        count = await wavePortalContract.getTotalWaves();
        console.log("Total de tchauzinhos recuperado...", count.toNumber());

        setIsLoading(false);
        
        getAllWaves();

        //input = null;
        
      } else {
        console.log("Objeto Ethereum não encontrado!");
      }
    } catch (error) {
      console.log(error)
      setIsLoading(false);
    }
  }

   /*
   * Método para consultar todos os tchauzinhos do contrato
   */
  const getAllWaves = async () => {
    const { ethereum } = window;
    
    try {
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
        
        /*
         * Chama o método getAllWaves do seu contrato inteligente
         */
        const waves = await wavePortalContract.getAllWaves();
  

        /*
         * Apenas precisamos do endereço, data/horário, e mensagem na nossa tela, então vamos selecioná-los
         */
        //let wavesCleaned = [];
        
        const wavesCleaned = waves.map(wave => {
          return {
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message,
          };
        });

        /*
        waves.forEach(wave => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message
          });
        });
        */

        /*
         * Armazenando os dados
         */
        setAllWaves(wavesCleaned);
      } else {
        console.log("Objeto Ethereum não existe!")
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
 * Escuta por eventos emitidos!
 */
useEffect(() => {
  let wavePortalContract;

  const onNewWave = (from, timestamp, message) => {
    console.log("NewWave", from, timestamp, message);
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
    wavePortalContract.on("NewWave", onNewWave);
  }

  return () => {
    if (wavePortalContract) {
      wavePortalContract.off("NewWave", onNewWave);
    }
  };
}, []);
  
  return (
    <div className="mainContainer">

      <div className="dataContainer">
        {isLoading ? <LoadingSpinner /> : null}
        
        <div className="header">
        👋 Olá Pessoal!
        </div>

        <div className="bio">
        Eu sou o danicuki e já trabalhei com música, sabia? Legal, né? Conecte sua carteira  Ethereum wallet e me manda um tchauzinho!
        </div>

        <form>
          <label>
            Mensagem:
            < br /> 
            <textarea id={id} value={input} onInput={e => setInput(e.target.value)} cols="70" rows="5"/>
            
          </label>

          < br /> 
            
          <button type="submit" className="waveButton" onClick={wave} disabled={isLoading}>
            Mandar Tchauzinho 🌟
          </button>
          
        </form>
        
        {/*
        * Se não existir currentAccount, apresente este botão
        */}
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Conectar carteira
          </button>
        )}

        {allWaves.map((wave, index) => {
          return (
            <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
              <div>Endereço: {wave.address}</div>
              <div>Data/Horário: {wave.timestamp.toString()}</div>
              <div>Mensagem: {wave.message}</div>
            </div>)
        })}
      </div>
      
    </div>
  );
}