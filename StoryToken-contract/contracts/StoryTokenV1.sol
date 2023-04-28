//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract StoryToken is ERC721, Ownable {
    
    uint256 public _tokenIdCounter = 0;
    
    struct Book {
        string title;
        string author;
        string publisher;
        uint256 year;
        address bookOwner;
        bool forSale;
        uint price;
    }
    // Owner of Smart Contract is Author
    // bookOwner of book is owner of token ID
    mapping (uint256 => Book) public _books;
    uint royaltyPercent;

    event BookCreated(uint256 tokenNum);
    // event returnBook(string title, string author, uint price);
    constructor(uint royalty) ERC721("StoryToken", "ST") {
        royaltyPercent = royalty;
    }

    function createBook(
        string memory title,
        string memory author,
        string memory publisher,
        uint256 year,
        uint price
    ) public onlyOwner returns (uint256) {
        _tokenIdCounter += 1;
        uint256 tokenId = _tokenIdCounter;
        address bookOwner = _msgSender();
        _safeMint(bookOwner, tokenId);
        _books[tokenId] = Book(title, author, publisher, year, bookOwner, false, price);
        // return tokenId;
        emit BookCreated(tokenId);
    }

    function transferBook(uint256 tokenId, address to) public {
        require(_exists(tokenId), "Token does not exist");
        require(getApproved(tokenId)== _msgSender(), "Sender not approved to transfer");
        _transfer(_msgSender(), to, tokenId);
        _books[tokenId].bookOwner = to;
    }

    function setForSale(uint256 tokenId, bool forSale, uint price) public {
        require(_exists(tokenId), "Token does not exist");
        require(ownerOf(tokenId) == _msgSender(), "Not approved to set for sale");

        _books[tokenId].forSale = forSale;
        _books[tokenId].price = price;
    }


    function buyBook(uint256 tokenId) public payable {
        require(_exists(tokenId), "Token does not exist");
        require(_books[tokenId].forSale, "Book is not for sale");
        address bookOwner = ownerOf(tokenId);
        require(bookOwner != _msgSender(), "Cannot buy own book");
        require(msg.value >= _books[tokenId].price, "Must pay minimum set price");
        
        _safeTransfer(bookOwner, _msgSender(), tokenId, "");
        _books[tokenId].bookOwner = _msgSender();
        _books[tokenId].forSale = false;
        uint royalty = (msg.value * royaltyPercent)/100;
        payable(bookOwner).transfer(msg.value-royalty);
    }

    function withdrawRoyalty() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
