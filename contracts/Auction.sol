// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.13;

contract Auction {
    // auction
    address public owner;
    uint256 public startTimestamp;
    uint256 public endTimestamp;
    bool public isEnded;

    // money
    uint256 public highestBid;
    address public highestBidder;
    mapping(address => uint256) public bids;

    // events
    event Bid(address indexed _bidder, uint256 _amount);
    event AuctionEnded(address indexed _winner, uint256 _amount);
    event Withdraw(address indexed _bidder, uint256 _amount);

    // modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function.");
        _;
    }

    modifier onlyNotOwner() {
        require(msg.sender != owner, "Owner cannot call this function.");
        _;
    }

    modifier onlyBeforeEnd() {
        require(!isEnded, "Auction already ended.");
        _;
    }

    modifier onlyAfterEnd() {
        require(isEnded, "Auction not yet ended.");
        _;
    }

    modifier sufficientBalance() {
        require(
            bids[msg.sender] + msg.value > highestBid,
            "There is already a higher or equal bid."
        );
        _;
    }

    constructor() {
        owner = msg.sender;
        startTimestamp = block.timestamp;
        isEnded = false;
    }

    function getOwner() public view returns (address) {
        return owner;
    }

    function bid() public payable onlyBeforeEnd sufficientBalance onlyNotOwner {
        // update highest bid
        highestBid = msg.value;
        highestBidder = msg.sender;

        bids[highestBidder] += highestBid;

        // emit event
        emit Bid(msg.sender, msg.value);
    }

    function endAuction() public onlyOwner onlyBeforeEnd {
        // update state
        isEnded = true;
        endTimestamp = block.timestamp;

        // emit event
        emit AuctionEnded(highestBidder, highestBid);
    }

    // auction owner can withdraw max bid
    function withdraw() public onlyAfterEnd {
        uint256 amount = highestBid;
        require(amount > 0, "You have no funds to withdraw.");
        highestBid = 0;
        payable(msg.sender).transfer(amount);
        emit Withdraw(msg.sender, amount);
    }

    function getHighestBidder() public view returns (address) {
        return highestBidder;
    }

    function getHighestBid() public view returns (uint256) {
        return highestBid;
    }
}
