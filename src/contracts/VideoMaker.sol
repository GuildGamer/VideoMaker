// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

interface IERC20Token {
    function transfer(address, uint256) external returns (bool);

    function approve(address, uint256) external returns (bool);

    function transferFrom(
        address,
        address,
        uint256
    ) external returns (bool);

    function totalSupply() external view returns (uint256);

    function balanceOf(address) external view returns (uint256);

    function allowance(address, address) external view returns (uint256);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
}

contract VideoMaker {
    struct Video {
        address payable owner;
        string videoLink;
        string title;
        string description;
        uint likes;
        uint dislikes;
        bool verified;
        uint timestamp;
    }
    uint internal videoLength;
    uint internal tipPrice;
    address internal admin;

    constructor() {
        videoLength = 0;
        tipPrice = 2;
        admin = msg.sender;
    }

    mapping(uint => Video) internal videos;
    address internal cUsdTokenAddress =
        0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;

    function addVideo(
        string memory _videoLink,
        string memory _title,
        string memory _description
    ) public {
        videos[videoLength] = Video(
            payable(msg.sender),
            _videoLink,
            _title,
            _description,
            0,
            0,
            false,
            block.timestamp
        );
    }

    function verifyVideo(uint index) public {
        require(msg.sender == admin, "Only admin can verify");
        videos[index].verified = true;
    }

    function getVideos(uint index)
        public
        view
        returns (
            address payable,
            string memory,
            string memory,
            string memory,
            uint,
            uint,
            bool,
            uint
        )
    {
        Video storage video = videos[index];
        return (
            video.owner,
            video.videoLink,
            video.title,
            video.description,
            video.likes,
            video.dislikes,
            video.verified,
            video.timestamp
        );
    }

    function likeVideo(uint index) public {
        require(
            videos[index].verified == true,
            "You can only like verified videos"
        );
        require(
            IERC20Token(cUsdTokenAddress).transferFrom(
                msg.sender,
                address(this),
                tipPrice
            ),
            "This transaction could not be performed"
        );

        videos[index].likes++;
    }

    function dislikeVideo(uint index) public {
        require(
            videos[index].verified == true,
            "You can only like verified videos"
        );
        require(
            IERC20Token(cUsdTokenAddress).transferFrom(
                msg.sender,
                address(this),
                tipPrice
            ),
            "This transaction could not be performed"
        );
        videos[index].dislikes++;
    }

    function getVideosLength() public view returns (uint) {
        return videoLength;
    }
}
