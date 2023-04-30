App = {
  web3Provider: null,
  contracts: {},
  names: new Array(),
  url: 'http://127.0.0.1:7545',
  author:null,
  // network_id: 5777,

  init: function () {
    console.log("Checkpoint 0");
    return App.initWeb3();
  },

  initWeb3: function () {
    // Modern dapp browsers...
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      window.ethereum.request({ method: 'eth_requestAccounts' })
        .then(function () {
          // User has allowed account access to DApp...
        })
        .catch(function (error) {
          // User has denied account access to DApp...
          console.error("User denied account access to DApp");
        });
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fallback to the TestRPC
    else {
      App.web3Provider = new Web3.providers.HttpProvider(App.url);
    }
    web3 = new Web3(App.web3Provider);
    App.populateAddress();
    return App.initContract();
  },

  initContract: function () {
    $.getJSON('StoryToken.json', function (data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      var storyTokenArtifact = data;
      App.contracts.st = TruffleContract(storyTokenArtifact);
      App.contracts.mycontract = data;
      // Set the provider for our contract
      App.contracts.st.setProvider(App.web3Provider);
      App.currentAccount = web3.eth.coinbase;
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
    });
  },

  getAuthor: function() {
    App.contracts.st.deployed().then(function(instance) {
      return instance.owner();
    }).then(function(result) {
      App.author = result;
      console.log("Owner:");
      console.log(App.author);
      if(App.currentAccount == App.author) {
        $(".create").css("display", "inline");
      }
    })
  },

  createBook: function () {
    event.preventDefault();
    console.log("started create book")
    var bookName = $("#book-name").val();
    var bookAuthor = $("#book-author").val();
    var bookPublisher = $("#book-publisher").val(); 
    var bookYear = $("#book-year").val();
    var bookPrice = $("#book-price").val();
    console.log("to ether",web3.toWei(bookPrice,"ether") )

    App.contracts.st.deployed().then(function (instance) {
      stInstance = instance;
      return stInstance.createBook(web3.toWei(bookPrice,"ether"), {from: App.currentAccount }); // added from parameter
    }).then(function (result, err) {
      if (result) {
        console.log(result);
        tokenid = result.logs[0].args.tokenId.toNumber();
        const fileInput = document.getElementById('book-image');
        imgPath = "assets/img/book.png"
        const file  = fileInput.files[0]
        if(file != null) {
          const formData = new FormData();
          formData.append('file', file);
          fetch('/upload', {
            method: 'POST',
            body: formData
          })
            .then(response => {
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
        
        // addToDB(tokenid, bookName, bookAuthor, bookPublisher, bookYear);
        // toastr.info('Created a Book! Id: ' + tokenid, { "iconClass": 'toast-info notification3' });
      } else {
        console.log(err)
        toastr["error"]("Error!");
      }
    }).catch(function (err) {
      console.log(err)
      toastr["error"]("Error!");
    });
  },

  populateAddress: function () {
    new Web3(new Web3.providers.HttpProvider(App.url)).eth.getAccounts((err, accounts) => {
      jQuery.each(accounts, function (i) {
        if (web3.eth.coinbase != accounts[i]) {
          var optionElement = '<option value="' + accounts[i] + '">' + accounts[i] + '</option';
          jQuery('#enter_address').append(optionElement);
        }
      });
    });
  },

  fetchBook: function (bookId, explore, bookDetails) {
    console.log("started get book", bookId);
    App.contracts.st.deployed().then(function (instance) {
      stInstance = instance;
      return stInstance._books(parseInt(bookId));
    }).then(function (result, err) {
      if (result) {
        console.log(result);
        var bookName = bookDetails["book_name"];
        var authName = bookDetails["book_author"];
        var pubName = bookDetails["book_publisher"];
        var year = bookDetails["book_year"];
        var image = bookDetails["book_image"]
        var owner = result[0];
        var sale = result[1];
        var price = result[2].toNumber();
        if(explore != true) {
          console.log("owner page");
          if(owner==App.currentAccount) {
            console.log("owned");
            App.bookToPage(bookId,bookName, authName, pubName, year, sale, price, explore, image);
            return
          }
        } else {
          if(owner!=App.currentAccount) {
            App.bookToPage(bookId,bookName, authName, pubName, year, sale, price, explore, image);
          }
        }
        
      } else {
        console.log(err)
        toastr["error"]("Error!");
      }
    }).catch(function (err) {
      console.log(err)
      toastr["error"]("Error!");
    });
  },

  bookToPage: function (bookId, name, author, publisher, year, sale, price, explore, image) {
    const booklist = $('#book-list');
    let elementTemplate = '';
    $.ajax( {
      url: 'book-item.html',
      async: false,
      success: function(data) {
        elementTemplate = data;
        const newElement = $(elementTemplate);
        newElement.find('img').attr("src", image);
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
            newElement.find('.description').text("Owner has set the price to "+ web3.fromWei(price, 'ether')+" ETH");
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
            newElement.find('.description').text("This is curently set for sale at "+ web3.fromWei(price, 'ether')+" ETH");
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
    App.contracts.st.deployed().then(function (instance) {
      stInstance = instance;
      return stInstance._tokenIdCounter();
    }).then(function (result, err) {
      if (result) {
        numTokens = result.toNumber();
        if(numTokens > 0) {
          getAllData().then(function(data) {
            for(let i = 1; i <= numTokens; i++) {
              App.fetchBook(i, explore, data[i]);
            }
          }).catch(function(error) {
            console.error(error);
          });
        }
      } else {
        console.log(err);
        return nil;
      }
    }).catch(function (err) {
      console.log(err);
      return nil;
    });
  },

  setForSale: function (tokenId) {
    console.log("started set for sale");
    price = $("#set-price-"+tokenId).val();
    console.log(price)
    App.contracts.st.deployed().then(function (instance) {
      stInstance = instance;
      return stInstance.setForSale(tokenId, true, web3.toWei(price,"ether"), {from: App.currentAccount });
    }).then(function (result, err) {
      if (result) {
        console.log(result);
        App.updateBooklist();
        toastr.info('Book is set for Sale', { "iconClass": 'toast-info notification3' });
      } else {
        console.log(err);
        return nil;
      }
    }).catch(function (err) {
      console.log(err);
      return nil;
    });
  },
  unsetForSale: function (tokenId) {
    console.log("started setfor sale");
    App.contracts.st.deployed().then(function (instance) {
      stInstance = instance;
      return stInstance.setForSale(tokenId, false, web3.toWei(1,"ether"), {from: App.currentAccount });
    }).then(function (result, err) {
      if (result) {
        console.log(result);
        App.updateBooklist();
        toastr.info('Book is unset for Sale', { "iconClass": 'toast-info notification3' });
      } else {
        console.log(err);
        return nil;
      }
    }).catch(function (err) {
      console.log(err);
      return nil;
    });
  },

  buyBook: function (tokenId) {
    console.log("started buy book");
    var price = $("#buy-price-"+tokenId).val();
    console.log("price");
    console.log(price);


    App.contracts.st.deployed().then(function (instance) {
      stInstance = instance;
      return stInstance.buyBook(tokenId, {value: web3.toWei(price, "ether"), from: App.currentAccount });
    }).then(function (result, err) {
      if (result) {
        console.log(result);
        App.updateBooklist();
        toastr.info('Book bought Successfully! ID: '+tokenId, { "iconClass": 'toast-info notification3' });
      } else {
        console.log(err);
        return nil;
      }
    }).catch(function (err) {
      console.log(err);
      return nil;
    });
  },

  withdrawRoyalty: function () {
    console.log("started withdraw");
    App.contracts.st.deployed().then(function (instance) {
      stInstance = instance;
      return stInstance.withdrawRoyalty({from: App.currentAccount });
    }).then(function (result, err) {
      if (result) {
        console.log(result);
        returns = result.logs[0].args.tokenNum.toNumber();
        toastr.info(web3.fromWei(returns, "ether") +' ETH credited to Author Account', { "iconClass": 'toast-info notification3' });
      } else {
        console.log(err);
        return nil;
      }
    }).catch(function (err) {
      console.log(err);
      return nil;
    });
  },

  transferBook: function (tokenId) {
    console.log("started transfer");
    address = $("#to-addr-"+tokenId).val();
    console.log(address);
    console.log(tokenId);
    App.contracts.st.deployed().then(function (instance) {
      stInstance = instance;
      return stInstance.transferBook(tokenId, address, {from: App.currentAccount });
    }).then(function (result, err) {
      if (result) {
        console.log(result);
        App.updateBooklist();
        toastr.info('Book is transferred to '+address, { "iconClass": 'toast-info notification3' });
      } else {
        console.log(err);
        return nil;
      }
    }).catch(function (err) {
      console.log(err);
      return nil;
    });
  },

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