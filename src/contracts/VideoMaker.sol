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
    event Blacklist(address user);
    event VideoAdded(uint256 index, address owner);
    event VideoVerified(uint256 index);
    event VideoRemoved(uint256 index, string reason);
    event LikedVideo(uint256 index, address user, uint256 likes);
    event DislikeVideo(uint256 index, address user, uint256 likes);
    event AdminAdded(address newAdmin, address admin);
    event AdminRemoved(address admin);

    struct Video {
        address payable owner;
        string videoLink;
        string title;
        string description;
        uint256 likes;
        uint256 dislikes;
        bool verified;
        uint256 timestamp;
    }
    uint256 private videoLength;
    uint256 private tipPrice;

    mapping(address => bool) public admins;
    address private owner;

    constructor() {
        videoLength = 0;
        tipPrice = 2 ether;
        admins[msg.sender] = true;
        owner = msg.sender;
    }

    mapping(uint256 => Video) private videos;
    // keeps tracks of already used video links
    mapping(string => bool) public usedUrl;

    mapping(address => mapping(uint256 => bool)) liked;

    // maps the reason why a video was deleted
    mapping(uint256 => string) deleteReason;
    // maps the index of deleted videos
    mapping(uint256 => bool) deleted;
    // keeps track of blacklisted users
    mapping(address => bool) blacklisted;

    address internal cUsdTokenAddress =
        0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;

    // verifies if caller is the video owner
    modifier verifyOwner(uint256 index) {
        require(
            msg.sender == videos[index].owner,
            "Only the video owner can perform this action"
        );
        _;
    }

    // verifies if caller is not the video owner
    modifier verifyNotOwner(uint256 index) {
        require(
            msg.sender != videos[index].owner,
            "Only viewers can perform this action"
        );
        _;
    }

    // verifies if caller is an admin
    modifier onlyAdmins() {
        require(admins[msg.sender], "Only admins can verify");
        _;
    }

    // verifies if index is valid
    modifier verifyIndex(uint256 index) {
        require(index < videoLength, "Query for non existant video");
        _;
    }

    function addVideo(
        string memory _videoLink,
        string memory _title,
        string memory _description
    ) public {
        // checks inputs to prevent unexpected bugs
        require(bytes(_videoLink).length > 0, "Enter a valid video link");
        require(!usedUrl[_videoLink], "Video was already uploaded");
        require(bytes(_title).length > 0, "Enter a valid title");
        require(bytes(_description).length > 0, "Enter a valid description");

        uint256 index = videoLength;
        videoLength++;
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

        usedUrl[_videoLink] = true;
        emit VideoAdded(index, msg.sender);
    }

    function verifyVideo(uint256 index) public verifyIndex(index) onlyAdmins {
        require(!videos[index].verified, "Already verified");
        videos[index].verified = true;
        emit VideoVerified(index);
    }

    // adds an admin
    function addAdmin(address _admin) external onlyAdmins {
        require(_admin != address(0), "Enter a valid address");
        admins[msg.sender] = true;
        emit AdminAdded(_admin, msg.sender);
    }

    // removes an admin, callable only by the contract owner
    function removeAdmin(address _admin) external {
        require(msg.sender == owner, "Only the owner can do that");
        require(_admin != address(0), "Enter a valid address");
        admins[msg.sender] = false;
        emit AdminRemoved(_admin);
    }

    // admins can remove videos uploaded
    function removeVideo(uint256 index, string memory reason)
        public
        verifyIndex(index)
        onlyAdmins
    {
        require(!deleted[index], "Video has already been removed");
        require(
            bytes(reason).length > 0,
            "Enter a valid reason for removing video"
        );
        deleted[index] = true;
        deleteReason[index] = reason;
        delete videos[index]; // resets values of struct back to default of unassigned values in struct
        emit VideoRemoved(index, reason);
    }

    // callable only by admins and is used to blacklist a user
    function blacklistUser(address user) external onlyAdmins {
        require(user != address(0), "Enter valid address to blacklist");
        require(!blacklisted[user], "User is already blacklisted");
        blacklisted[user] = true;
        emit Blacklist(user);
    }

    function getVideos(uint256 index)
        public
        view
        verifyIndex(index)
        returns (Video memory)
    {
        return videos[index];
    }

    function likeVideo(uint256 index)
        public
        payable
        verifyIndex(index)
        verifyNotOwner(index)
    {
        require(
            videos[index].verified == true,
            "You can only like verified videos"
        );
        require(!liked[msg.sender][index], "Already liked video");
        require(
            IERC20Token(cUsdTokenAddress).transferFrom(
                msg.sender,
                address(this),
                tipPrice
            ),
            "This transaction could not be performed"
        );

        videos[index].likes++;
        emit LikedVideo(index, msg.sender, videos[index].likes);
    }

    function dislikeVideo(uint256 index)
        public
        payable
        verifyIndex(index)
        verifyNotOwner(index)
    {
        require(
            videos[index].verified == true,
            "You can only like verified videos"
        );
        require(liked[msg.sender][index], "Already disliked video");
        require(
            IERC20Token(cUsdTokenAddress).transferFrom(
                msg.sender,
                address(this),
                tipPrice
            ),
            "This transaction could not be performed"
        );
        videos[index].dislikes++;
        emit LikedVideo(index, msg.sender, videos[index].dislikes);
    }

    function getVideosLength() public view returns (uint256) {
        return videoLength;
    }
}
