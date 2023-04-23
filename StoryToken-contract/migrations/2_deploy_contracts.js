var StoryToken = artifacts.require("StoryToken");


module.exports = function(deployer) {
  deployer.deploy(StoryToken, 10);
};
