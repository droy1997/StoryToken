# README #

StoryToken Decentralized application


* Authors can mint books and set them for sale
* 1.0.0

### How do I get set up? ###

* Extract the StoryToken.zip.
* Make sure Ganache is working and connected to Metamask wallet.
* Navigate to StoryToken-contract directory through terminal.
* Execute truffle migrate --reset
* If the above line fails with the following error: import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
we need to npm install ERC721 Through this command : npm install @openzeppelin/contracts
* Run truffle migrate --reset if it failed the first time.

* Once the smart contract is deployed, navigate to StoryToken-app directory through terminal (../StoryToken-app)
* Run npm install
* Run npm start
* This should start our application on localhost:3000

