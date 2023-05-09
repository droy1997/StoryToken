App = {
  web3Provider: null,
  contracts: {},
  address: "0xdc91b2fF50d29Db0ee3C86Fa5B626070a5b1FA54",
  names: new Array(),
  url: 'http://127.0.0.1:7545',
  author:null,
  currentAccount:null,
  // network_id: 5777,

  init: function () {
    console.log("Checkpoint 0");
    return App.initWeb3();
  },

  initWeb3: function () {
    if (typeof web3 !== "undefined") {
      // console.log(Web3.givenProvider);
      App.web3 = new Web3(Web3.givenProvider);
    } else {
      App.web3 = new Web3(App.url);
    }
    ethereum.request({ method: "eth_requestAccounts" });

    return App.initContract();
  },

  initContract: function () {
    App.contracts.st = new App.web3.eth.Contract(App.abi, App.address, {});
    return App.populateAddress();;
  },

  getAuthor: function () {
    App.contracts.st.methods.owner().call((error, result) => {
      if (error) {
        console.error(error);
      } else {
        App.author = result;
        console.log("Owner:");
        console.log(App.author);
        if(App.currentAccount == App.author) {
          $(".create").css("display", "inline");
        }
      }
    });
  },

  createBook: function () {
    console.log("started create book")
    var bookName = $("#book-name").val();
    var bookAuthor = $("#book-author").val();
    var bookPublisher = $("#book-publisher").val(); 
    var bookYear = $("#book-year").val();
    var bookPrice = $("#book-price").val();
    console.log("to ether",App.web3.utils.toWei(bookPrice,"ether") )

    var option = { from: App.currentAccount };
    App.contracts.st.methods.createBook(App.web3.utils.toWei(bookPrice,"ether")).send(option, (error, result) => {
      if (error) {
        console.error(error);
      } else {
        console.log(result);
      }
    });
    
    // Wait for event
    App.contracts.st.events.BookCreated({ fromBlock: 0 }, (error, event) => {
      if (error) {
        console.error(error);
        toastr["error"]("Error!");
      } else {
        console.log(event.returnValues.tokenNum);
        tokenid = event.returnValues.tokenNum;
        const fileInput = document.getElementById('book-image');
        imgPath = "assets/img/book.png"
        const file  = fileInput.files[0]
        if(file != null) {
          const formData = new FormData();
          formData.append('file', file);
          fetch('/upload', {
            method: 'POST',
            body: formData
          }).then(response => {
              if (response.ok) {
                imgPath = "uploads/"+ file.name;
              }
              addToDB(tokenid, bookName, bookAuthor, bookPublisher, bookYear, imgPath);
              toastr.info('Created a Book! Id: ' + tokenid, { "iconClass": 'toast-info notification3' });
            })
            .catch(error => {
              addToDB(tokenid, bookName, bookAuthor, bookPublisher, bookYear, imgPath);
              toastr.info('Created a Book! Id: ' + tokenid, { "iconClass": 'toast-info notification3' });
            });
          } else {
            addToDB(tokenid, bookName, bookAuthor, bookPublisher, bookYear, imgPath);
            toastr.info('Created a Book! Id: ' + tokenid, { "iconClass": 'toast-info notification3' });
          }
      }
    });
  },

  populateAddress: async function () {
    console.log("In Populate address");
    const userAccounts = await App.web3.eth.getAccounts();
    App.currentAccount = userAccounts[0];

    jQuery('#current_account').text(App.currentAccount);
    console.log("Current account");
    console.log(App.currentAccount);
    $(".no-account").css("display", "none");
    App.getAuthor();
    if (document.getElementById('explore')) {
      console.log("in explore page")
      App.populateBooks(true);
    }
    else if (document.getElementById('owner')) {
      console.log("in owner page")
      App.populateBooks(false);
    }
    return 0;
  },

  fetchBook: function (bookId, explore, bookDetails, tokenNum) {
    console.log("started get book", bookId);
    App.contracts.st.methods._books(parseInt(bookId)).call((error, result) => {
      if (error) {
        console.error(error);
      } else {
        console.log(result);
        var bookName = bookDetails["book_name"];
        var authName = bookDetails["book_author"];
        var pubName = bookDetails["book_publisher"];
        var year = bookDetails["book_year"];
        var image = bookDetails["book_image"]
        var owner = result[0];
        var sale = result[1];
        var price = result[2];
        if(explore != true) {
          console.log("owner page");
          if(owner==App.currentAccount) {
            console.log("owned");
            App.bookToPage(bookId,bookName, authName, pubName, year, sale, price, explore, image, tokenNum);
            return
          }
        } else {
          if(owner!=App.currentAccount) {
            App.bookToPage(bookId,bookName, authName, pubName, year, sale, price, explore, image, tokenNum);
          }
        }
      }
    });
  },

  bookToPage: function (bookId, name, author, publisher, year, sale, price, explore, image, tokenNum) {
    const booklist = $('#book-list');
    let elementTemplate = '';
    $.ajax( {
      url: 'book-item.html',
      async: false,
      success: function(data) {
        elementTemplate = data;
        const newElement = $(elementTemplate);
        newElement.find('img').attr("src", image);
        newElement.find('.token-num').text("#"+tokenNum);
        newElement.find('.post-date').text(year);
        newElement.find('.post-title').text(name);
        newElement.find('.book-auth').text(author);
        newElement.find('.book-pub').text(publisher);
        newElement.find('.book-pub').text(publisher);
        if(explore==true) {

          if(sale!= true) {
            newElement.find('.description').text("This book is not for sale");
            newElement.find("#book-set").attr("style", "display:none;");
            newElement.find("#buy-price").attr("style", "display:none;");
          } else {
            newElement.find('.description').text("Owner has set the price to "+ App.web3.utils.fromWei(price, 'ether')+" ETH");
            newElement.find("#book-set").attr("onclick", "App.buyBook("+bookId+")");
            newElement.find("#book-set").text("Buy");
            newElement.find("#buy-price").attr("id", "buy-price-"+bookId);
          }
        } else {
          newElement.find('.transfer').attr("style", "display:block;");
          newElement.find("#book-transfer").attr("onclick", "App.transferBook("+bookId+")");;
          newElement.find("#to-addr").attr("id", "to-addr-"+bookId);
          if(sale!= true) {
            newElement.find('.description').text("Currently not set for sale");
            newElement.find("#book-set").attr("onclick", "App.setForSale("+bookId+")");
            newElement.find("#book-set").text("Set");
            newElement.find("#buy-price").attr("id", "set-price-"+bookId);
            newElement.find("#buy-price").attr("placeholder", "Set Price ETH");
          } else {
            newElement.find('.description').text("This is curently set for sale at "+ App.web3.utils.fromWei(price, 'ether')+" ETH");
            newElement.find("#buy-price").attr("style", "display:none;");
            newElement.find("#book-set").attr("onclick", "App.unsetForSale("+bookId+")");
            newElement.find("#book-set").text("Set Not for Sale");
          }
        }
        booklist.append(newElement);
      }
    });
  },

  populateBooks: function (explore) {
    console.log("started num tokens");
    App.contracts.st.methods._tokenIdCounter().call((error, result) => {
      if (error) {
        console.error(error);
      } else {
        numTokens = result;
        if(numTokens > 0) {
          getAllData().then(function(data) {
            for(let i = 1; i <= numTokens; i++) {
              App.fetchBook(i, explore, data[i], i);
            }
          }).catch(function(error) {
            console.error(error);
          });
        }
      }
    });
  },

  setForSale: function (tokenId) {
    console.log("started set for sale");
    price = $("#set-price-"+tokenId).val();
    console.log(price)
    var option = { from: App.currentAccount };
    App.contracts.st.methods.setForSale(tokenId, true, App.web3.utils.toWei(price, "ether")).send(option, (error, result) => {
      if (error) {
        console.error(error);
      } else {
        console.log(result);
        App.waitforCompletion(result, 'Book is set for Sale');   
      }
    })
  },

  waitforCompletion: async function(txHash, toasterString) {
    let receipt = null;
    while (receipt == null) {
      receipt = await App.web3.eth.getTransactionReceipt(txHash);
      await new Promise(resolve => setTimeout(resolve, 1000)); 
    }
    toastr.info(toasterString, { "iconClass": 'toast-info notification3' });
    App.updateBooklist();
  },

  unsetForSale: function (tokenId) {
    console.log("started unset for sale");
    var option = { from: App.currentAccount };
    App.contracts.st.methods.setForSale(tokenId, false, App.web3.utils.toWei("1", "ether")).send(option, (error, result) => {
      if (error) {
        console.error(error);
      } else {
        console.log(result);
        App.waitforCompletion(result, 'Book is unset for Sale');   
      }
    })
  },

  buyBook: function (tokenId) {
    console.log("started buy book");
    var price = $("#buy-price-"+tokenId).val();
    console.log("price");
    console.log(price);
    var option = { value: App.web3.utils.toWei(price, "ether"), from: App.currentAccount };
    App.contracts.st.methods.buyBook(tokenId).send(option, (error, result) => {
      if (error) {
        console.error(error);
      } else {
        console.log(result); 
        App.waitforCompletion(result, 'Book bought Successfully! ID: '+tokenId);  
      }
    })
  },

  withdrawRoyalty: function () {
    console.log("started withdraw");
    var option = { from: App.currentAccount };
    App.contracts.st.methods.withdrawRoyalty().send(option, (error, result) => {
      if (error) {
        console.error(error);
      } else {
        console.log(result);   
      }
    })
    // Wait for event
    App.contracts.st.events.RoyaltyWithdrawn({ fromBlock: 0 }, (error, event) => {
      if (error) {
        console.error(error);
        toastr["error"]("Error!");
      } else {
        royalty = event.returnValues.royalty;
        toastr.info(App.web3.utils.fromWei(royalty, "ether") +' ETH credited to Author Account', { "iconClass": 'toast-info notification3' });
      }
    });
  },

  transferBook: function (tokenId) {
    console.log("started transfer");
    address = $("#to-addr-"+tokenId).val();
    console.log(address);
    console.log(tokenId);
    var option = { from: App.currentAccount };
    App.contracts.st.methods.transferBook(tokenId, address).send(option, (error, result) => {
      if (error) {
        console.error(error);
      } else {
        console.log(result);
        App.waitforCompletion(result, 'Book is transferred to ' + address);   
      }
    })
  },

  abi: [
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "royalty",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "tokenNum",
          "type": "uint256"
        }
      ],
      "name": "BookCreated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "previousOwner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "royalty",
          "type": "uint256"
        }
      ],
      "name": "RoyaltyWithdrawn",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "Transfer",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "_books",
      "outputs": [
        {
          "internalType": "address",
          "name": "bookOwner",
          "type": "address"
        },
        {
          "internalType": "bool",
          "name": "forSale",
          "type": "bool"
        },
        {
          "internalType": "uint256",
          "name": "price",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [],
      "name": "_tokenIdCounter",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },

    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "transferFrom",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "price",
          "type": "uint256"
        }
      ],
      "name": "createBook",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        }
      ],
      "name": "transferBook",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "forSale",
          "type": "bool"
        },
        {
          "internalType": "uint256",
          "name": "price",
          "type": "uint256"
        }
      ],
      "name": "setForSale",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "buyBook",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function",
      "payable": true
    },
    {
      "inputs": [],
      "name": "withdrawRoyalty",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ],

  updateBooklist: function () {
    $( "#book-list" ).load(window.location.href + " #book-list" );
    if (document.getElementById('explore')) {
      console.log("in explore page")
      App.populateBooks(true);
    }
    else if (document.getElementById('owner')) {
      console.log("in owner page")
      App.populateBooks(false);
    }
  },


  //Function to show the notification of auction phases
  showNotification: function (phase) {
    var notificationText = App.biddingPhases[phase];
    $('#phase-notification-text').text(notificationText.text);
    toastr.info(notificationText.text, "", { "iconClass": 'toast-info notification' + String(notificationText.id) });
  }
};


$(function () {
  $(window).load(function () {
    App.init();
    //Notification UI config
    toastr.options = {
      "showDuration": "1000",
      "positionClass": "toast-top-left",
      "preventDuplicates": true,
      "closeButton": true
    };
  });
});

// code for reloading the page on account change
window.ethereum.on('accountsChanged', function (){
  location.reload();
})