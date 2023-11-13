import "./App.css";
import { useEffect, useState } from "react";
import { parseEther, formatEther } from "@ethersproject/units";
import Auction from "./contracts/Auction.json";
const ethers = require("ethers");

const AuctionContractAddress = "0x943F09dcCd6D06ce40A5680B01634A2A8C30c5d1";
const emptyAddress = "0x0000000000000000000000000000000000000000";

function App() {
  // Use hooks to manage component state
  const [account, setAccount] = useState("");
  const [amount, setAmount] = useState(0);
  const [myBid, setMyBid] = useState(0);
  const [isOwner, setIsOwner] = useState(false);
  const [highestBid, setHighestBid] = useState(0);
  const [highestBidder, setHighestBidder] = useState("");
  const [isEnded, setIsEnded] = useState(false);

  // Sets up a new Ethereum provider and returns an interface for interacting with the smart contract
  async function initializeProvider() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    provider.on("block", () => {
      requestAccount();
      refreshBalance();
    });

    const signer = provider.getSigner();
    return new ethers.Contract(AuctionContractAddress, Auction.abi, signer);
  }

  // Displays a prompt for the user to select which accounts to connect
  async function requestAccount() {
    const account = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    setAccount(account[0]);
  }

  // ok
  async function fetchHighestBid() {
    if (typeof window.ethereum !== "undefined") {
      const contract = await initializeProvider();
      try {
        const highestBid = await contract.getHighestBid();
        const highestBidder = await contract.getHighestBidder();

        // Convert bidAmount from Wei to Ether and round value to 4 decimal places
        setHighestBid(
          parseFloat(formatEther(highestBid.toString())).toPrecision(4)
        );
        setHighestBidder(highestBidder.toLowerCase());
      } catch (e) {
        console.log("error fetching highest bid: ", e);
      }
    }
  }

  // ok
  async function fetchMyBid() {
    if (typeof window.ethereum !== "undefined") {
      const contract = await initializeProvider();
      try {
        const myBid = await contract.bids(account);
        setMyBid(parseFloat(formatEther(myBid.toString())).toPrecision(4));
      } catch (e) {
        console.log("error fetching my bid: ", e);
      }
    }
  }

  // ok
  async function fetchOwner() {
    if (typeof window.ethereum !== "undefined") {
      const contract = await initializeProvider();
      try {
        const owner = await contract.getOwner();
        setIsOwner(owner.toLowerCase() === account);
      } catch (e) {
        console.log("error fetching owner: ", e);
      }
    }
  }

  // ok
  async function fetchIsEnded() {
    if (typeof window.ethereum !== "undefined") {
      const contract = await initializeProvider();
      try {
        const isEnded = await contract.isEnded();
        setIsEnded(isEnded);
      } catch (e) {
        console.log("error fetching isEnded: ", e);
      }
    }
  }

  // ok
  async function submitBid(event) {
    event.preventDefault();
    if (typeof window.ethereum !== "undefined") {
      const contract = await initializeProvider();
      try {
        // User inputs amount in terms of Ether, convert to Wei before sending to the contract.
        const wei = parseEther(amount);
        await contract.bid({ value: wei, gasLimit: 300000 });

        // Wait for the smart contract to emit the LogBid event then update component state
        contract.on("Bid", (_, __) => {
          fetchMyBid();
          fetchHighestBid();
        });
      } catch (e) {
        console.log("error making bid: ", e);
      }
    }
  }

  // ok
  async function withdraw() {
    if (typeof window.ethereum !== "undefined") {
      const contract = await initializeProvider();
      // Wait for the smart contract to emit the LogWithdrawal event and update component state
      contract.on("Withdraw", (_, __) => {
        fetchMyBid();
        fetchHighestBid();
      });
      try {
        await contract.withdraw();
      } catch (e) {
        console.log("error withdrawing fund: ", e);
      }
    }
  }

  // ok
  async function endAuction() {
    if (typeof window.ethereum !== "undefined") {
      const contract = await initializeProvider();
      try {
        await contract.endAuction();
        await fetchIsEnded();
      } catch (e) {
        console.log("error ending auction: ", e);
      }
    }
  }

  useEffect(() => {
    requestAccount();
  });

  useEffect(() => {
    if (account) {
      fetchIsEnded();
      fetchOwner();
      fetchMyBid();
      fetchHighestBid();
    }
  });

  function refreshBalance() {
    fetchMyBid();
    fetchHighestBid();
    fetchIsEnded();
  }

  return (
    <div
      style={{
        textAlign: "center",
        width: "50%",
        margin: "0 auto",
        marginTop: "100px",
      }}
    >
      {isOwner ? (
        <div
          style={{
            gap: "1rem",
            flexDirection: "row",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <button type="button" onClick={endAuction}>
            End Auction
          </button>
          <button type="button" onClick={withdraw}>
            Withdraw
          </button>
        </div>
      ) : (
        ""
      )}
      <div
        style={{
          textAlign: "center",
          marginTop: "20px",
          paddingBottom: "10px",
          border: "1px solid black",
        }}
      >
        <p>Connected Account: {account}</p>
        {!isOwner && <p>My Bid: {myBid}</p>}
        <p>Auction is {isEnded ? "ended" : "not ended"}</p>
        <p>Auction Highest Bid Amount: {highestBid}</p>
        <p>
          Auction Highest Bidder:{" "}
          {highestBidder === emptyAddress
            ? "null"
            : highestBidder === account
            ? "Me"
            : highestBidder}
        </p>
        <p>Auction adress {AuctionContractAddress}</p>
        {!isOwner ? (
          <form onSubmit={submitBid}>
            <input
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              name="Bid Amount"
              type="number"
              placeholder="Enter Bid Amount"
            />
            <button type="submit">Submit</button>
          </form>
        ) : (
          ""
        )}
      </div>
    </div>
  );
}

export default App;
