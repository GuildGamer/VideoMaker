import { useState, useEffect } from "react";

import Web3 from "web3";
import { newKitFromWeb3 } from "@celo/contractkit";
import BigNumber from "bignumber.js";

import ierc from "./contracts/ierc.abi.json";
import videoMaker from "./contracts/video.abi.json";

const ERC20_DECIMALS = 18;

const contractAddress = "0x67cAd8190A35De5ccc77985cb2575281192600a0";
const cUSDContractAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";

function App() {
  const [contract, setcontract] = useState(null);
  const [address, setAddress] = useState(null);
  const [kit, setKit] = useState(null);
  const [cUSDBalance, setcUSDBalance] = useState(0);
  const [videos, setVideos] = useState([]);
  const [title, setTitle] = useState("");
  const [video, setVideo] = useState("");
  const [description, setDescription] = useState("");
  const [admin, setAdmin] = useState("");

  const walletInit = async () => {
    if (window.celo) {
      try {
        await window.celo.enable();
        const web3 = new Web3(window.celo);
        let kit = newKitFromWeb3(web3);

        const accounts = await kit.web3.eth.getAccounts();
        const user_address = accounts[0];

        kit.defaultAccount = user_address;

        await setAddress(user_address);
        await setKit(kit);
      } catch (error) {
        console.log(error);
      }
    } else {
      console.log("Error Occurred");
    }
  };

  const getBalance = async () => {
    try {
      const balance = await kit.getTotalBalance(address);
      const USDBalance = balance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2);
      const contract = new kit.web3.eth.Contract(videoMaker, contractAddress);
      setcontract(contract);
      setcUSDBalance(USDBalance);
    } catch (error) {
      console.log(error);
    }
  };

  const getVideos = async () => {
    try {
      const videosLength = await contract.methods.getVideosLength().call();
      const videos = [];
      for (let index = 0; index < videosLength; index++) {
        const video = new Promise(async (resolve, reject) => {
          const _video = await contract.methods.getVideos(index).call();
          const date = new Date(_video[7] * 1000);
          resolve({
            index: index,
            owner: _video[0],
            videoLink: _video[1],
            title: _video[2],
            description: _video[3],
            likes: _video[4],
            dislikes: _video[5],
            verified: _video[6],
            timestamp: date,
          });
        });
        videos.push(video);
      }
      const v = await Promise.all(videos);
      setVideos(v);
      console.log("====================================");
      console.log(v);
      console.log("====================================");
    } catch (e) {
      console.log(e);
    }
  };

  const getContractOwner = async () => {
    try {
      const owner = await contract.methods.getContractOwner().call();
      setAdmin(owner);
    } catch (e) {
      console.log(e);
    }
  };

  const formSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!video || !title || !description) return;
      const tx = await contract.methods
        .addVideo(video, title, description)
        .send({
          from: address,
        });
      console.log(tx);
      getVideos();
    } catch (error) {
      console.log(error);
    }
  };

  const starVideo = async (index) => {
    try {
      const cUSDContract = new kit.web3.eth.Contract(ierc, cUSDContractAddress);
      const tip = new BigNumber(2).shiftedBy(ERC20_DECIMALS).toString();

      await cUSDContract.methods
        .approve(contractAddress, tip)
        .send({ from: address });
      const tx = await contract.methods.likeVideo(index).send({
        from: address,
      });
      console.log(tx);
      getVideos();
    } catch (error) {
      console.log(error);
    }
  };

  const disapproveVideo = async (index) => {
    try {
      const cUSDContract = new kit.web3.eth.Contract(ierc, cUSDContractAddress);
      const tip = new BigNumber(2).shiftedBy(ERC20_DECIMALS).toString();
      await cUSDContract.methods
        .approve(contractAddress, tip)
        .send({ from: address });
      const tx = await contract.methods.dislikeVideo(index).send({
        from: address,
      });
      console.log(tx);
      getVideos();
    } catch (error) {
      console.log(error);
    }
  };

  const verifyVideo = async (index) => {
    try {
      const tx = await contract.methods.verifyVideo(index).send({
        from: address,
      });
      console.log(tx);
      getVideos();
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    walletInit();
  }, []);

  useEffect(() => {
    if (contract) {
      getVideos();
      getContractOwner();
    }
  }, [contract]);

  useEffect(() => {
    if (kit && address) {
      getBalance();
    }
  }, [kit, address]);
  return (
    <>
      <div>
        <header className="site-header sticky-top py-1">
          <nav className="container d-flex flex-column flex-md-row justify-content-between">
            <a className="py-2" href="#" aria-label="Product">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={24}
                height={24}
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                className="d-block mx-auto"
                role="img"
                viewBox="0 0 24 24"
              >
                <title>Product</title>
                <circle cx={12} cy={12} r={10} />
                <path d="M14.31 8l5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16L3.95 6.06M14.31 16H2.83m13.79-4l-5.74 9.94" />
              </svg>
            </a>
            <a className="py-2 d-none d-md-inline-block" href="#">
              Balance: {cUSDBalance} cUSD
            </a>
          </nav>
        </header>
        <main>
          <div className="position-relative overflow-hidden p-3 p-md-5 m-md-3 text-center bg-light">
            <div className="col-md-5 p-lg-5 mx-auto my-5">
              <h1 className="display-4 fw-normal">Video Baker</h1>
              <p className="lead fw-normal">
                We are trying to decentralize video sharing by bringing it to
                the blockchain
              </p>
              <a className="btn btn-outline-secondary" href="#">
                Demo
              </a>
            </div>
            <div className="product-device shadow-sm d-none d-md-block" />
            <div className="product-device product-device-2 shadow-sm d-none d-md-block" />
          </div>
          <div className="">
            <div className="row">
              {videos.map((video) => (
                <div className="col-6">
                  <div className="bg-dark me-md-3 pt-3 px-3 pt-md-5 px-md-5 text-center text-white overflow-hidden">
                    <div className="my-3 py-3">
                      <h2 className="display-5">{video.title}</h2>
                      <p className="lead">{video.description}</p>
                      <div>
                        <span>{video.timestamp.toString()}</span>
                      </div>
                    </div>
                    <div>
                      <video
                        className="bg-light shadow-sm mx-auto"
                        controls
                        style={{
                          width: "80%",
                          height: "300px",
                          borderRadius: "21px 21px 0 0",
                        }}
                        src={video.videoLink}
                      ></video>
                    </div>
                    {address === admin && !video.verified && (
                      <button
                        onClick={() => verifyVideo(video.index)}
                        className="m-1 btn btn-outline-primary"
                      >
                        Verify
                      </button>
                    )}
                    {video.verified ? (
                      <div className="p-3 d-flex justify-content-between">
                        <button
                          type="button"
                          onClick={() => starVideo(video.index)}
                          className="btn btn-secondary"
                        >
                          <i class="bi bi-star"></i>
                          Rate ({video.likes})
                        </button>

                        <button
                          onClick={() => disapproveVideo(video.index)}
                          type="button"
                          className="btn btn-secondary"
                        >
                          <i class="bi bi-x"></i>
                          Disapprove ({video.dislikes})
                        </button>
                      </div>
                    ) : (
                      <div className="mb-3">
                        Cannot provide rating, this video has not been verified
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>

        <div className="p-3 w-50 justify-content-center">
          <h2>Create Your Experience</h2>
          <div className="">
            <form onSubmit={formSubmit}>
              <div className="form-floating mb-3">
                <input
                  type="text"
                  className="form-control rounded-4"
                  id="floatingInput"
                  placeholder="Title of your video"
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
                <label htmlFor="floatingInput">Title</label>
              </div>
              <div className="form-floating mb-3">
                <input
                  type="text"
                  className="form-control rounded-4"
                  id="floatingInput"
                  placeholder="Link to your video"
                  onChange={(e) => setVideo(e.target.value)}
                  required
                />
                <label htmlFor="floatingInput">Link</label>
              </div>
              <div className="form-floating mb-3">
                <textarea
                  className="form-control rounded-4"
                  id="floatingInput"
                  placeholder="Description of your video"
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  required
                />
                <label htmlFor="floatingInput">Description</label>
              </div>

              <button
                className="w-100 mb-2 btn btn-lg rounded-4 btn-primary"
                type="submit"
              >
                Add Video
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
