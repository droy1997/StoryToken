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
    // Is there is an injected web3 instance?
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
    } else {
      // If no injected web3 instance is detected, fallback to the TestRPC
      App.web3Provider = new Web3.providers.HttpProvider(App.url);
    }
    web3 = new Web3(App.web3Provider);
    ethereum.enable();
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
      return App.bindEvents();
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
        $(".author").css("display", "inline");
      } else {
        $(".other-user").css("display", "inline");
      }

    })
  },

  bindEvents: function () {
    // Implemented 2 events for now
    $(document).on('click', '#create-book', App.createBook);
    $(document).on('click', '#get-book', App.getBook);
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
      return stInstance.createBook(bookName, bookAuthor, bookPublisher, parseInt(bookYear), web3.toWei(bookPrice,"ether"), {from: App.currentAccount }); // added from parameter
    }).then(function (result, err) {
      if (result) {
        console.log(result);
        tokenid = result.logs[0].args.tokenId.toNumber()
        toastr.info('created a book! Id: ' + tokenid, { "iconClass": 'toast-info notification3' });
      } else {
        console.log(err)
        toastr["error"]("Error!");
      }
    }).catch(function (err) {
      console.log(err)
      toastr["error"]("Error!");
    });
  },

  getBook: function () {
    event.preventDefault();
    var tokenid = $("#token-id").val();
    console.log("started get book")
    App.contracts.st.deployed().then(function (instance) {
      stInstance = instance;
      return stInstance.getBookInfo(parseInt(tokenid), {from: App.currentAccount });
    }).then(function (result, err) {
      if (result) {
        console.log(result);
        price = result.logs[0].args.price.toNumber();
        price = web3.fromWei(price, 'ether');
        jQuery('#get-name').text(result.logs[0].args.title);
        jQuery('#get-author').text(result.logs[0].args.author);
        jQuery('#get-price').text(price+ " ETH");
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