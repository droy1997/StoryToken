//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract StoryToken is ERC721, Ownable {
    // Structure representing the book and its properties
    struct Book {
        address bookOwner; // the address of the book owner
        bool forSale; // whether the book is for sale or not
        uint price; // the price of the book
    }

    uint256 public _tokenIdCounter = 0; // counter for token IDs
    mapping (uint256 => Book) public _books; // mapping of token IDs to books
    uint royaltyPercent; // the percentage of each sale that goes to the contract owner as royalty

    // Modifier for Author
    modifier onlyAuthor() {
        require(msg.sender == owner(), "Caller is not the owner of the contract");
        _;
    }

    // Modifier for book owner
    modifier onlyTokenOwner(uint256 tokenId) {
        require(_exists(tokenId), "Token does not exist");
        require(ownerOf(tokenId) == _msgSender(), "Caller is not the owner of the token");
        _;
    }

    event BookCreated(uint256 tokenNum); // Event emitted when a book is created
    event RoyaltyWithdrawn(uint256 royalty); // Event emitted when royalty is withdrawn

    // Constructor that sets the contract name, symbol and the royalty percentage
    constructor(uint royalty) ERC721("StoryToken", "ST") {
        royaltyPercent = royalty;
    }

    // Function to create a new book
    function createBook(uint price) public onlyOwner {
        _tokenIdCounter += 1; // Increment the tokenIdCounter
        uint256 tokenId = _tokenIdCounter;
        address bookOwner = _msgSender();
        _safeMint(bookOwner, tokenId); // Mint a new token
        _books[tokenId] = Book(bookOwner, false, price); // Add the new token to the map
        emit BookCreated(tokenId); // Emit the tokenId number which was created
    }

    // Function to transfer ownership of a book to another address
    function transferBook(uint256 tokenId, address to) public onlyTokenOwner(tokenId) {
        _transfer(_msgSender(), to, tokenId);
        _books[tokenId].bookOwner = to; // Update the bookOwner in the mapping
    }

    // Function to set/unset a book for sale and set its price
    function setForSale(uint256 tokenId, bool forSale, uint price) public onlyTokenOwner(tokenId) {
        _books[tokenId].forSale = forSale;
        _books[tokenId].price = price;
    }

    // Function to buy a book
    function buyBook(uint256 tokenId) public payable {
        require(_exists(tokenId), "Token does not exist"); // Require the book to exist
        require(_books[tokenId].forSale, "Book is not for sale"); // Require the book to be set for sale
        address bookOwner = ownerOf(tokenId);
        require(bookOwner != _msgSender(), "Cannot buy own book"); // Require the buyer not equal to the owner
        require(msg.value >= _books[tokenId].price, "Must pay minimum set price"); // Require to pay minimum set price
        
        _safeTransfer(bookOwner, _msgSender(), tokenId, ""); // Transfer the ownership of book to buyer
        _books[tokenId].bookOwner = _msgSender(); // Update the bookOwner in the mapping
        _books[tokenId].forSale = false; // Set the for sale to be false
        uint royalty = (msg.value * royaltyPercent)/100; // Calculate the royalty
        payable(bookOwner).transfer(msg.value-royalty); // Send the price - royalty to the previous owner
    }

    // Function to withdraw royalty from the smart contract
    function withdrawRoyalty() public onlyAuthor {
        emit RoyaltyWithdrawn(address(this).balance); // Emit the royalty value
        payable(owner()).transfer(address(this).balance); // Transfer the royalty to Author
    }
}
