const market = require("./src/service");

const App = () => {
  const service = new market();
  service.initCode();
};

App();
