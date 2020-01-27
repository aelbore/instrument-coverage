(async function() {
  const PORT = 3000;
  const HOST_NAME = `localhost`;

  const fs = require('fs')
  const path = require('path')
  const http = require('http')
  const express = require('express')

  const { createInstrumenter } = require('istanbul-lib-instrument')

  const app = express()

  /// no need to add as script tag the `hello-world.js` since
  /// it is already included in the instrumented code
  /// Declare the `assert` as global same as `expect`
  const html = (coverage) => `
<!DOCTYPE html>
<html>
  <head>
    <title>Mocha Tests</title>
    <meta charset="utf-8">
    <link rel="stylesheet" href="../node_modules/mocha/mocha.css">
  </head>
  <body>
    <div id="mocha"></div>
    <script src="../node_modules/mocha/mocha.js"></script>
    <script src="../node_modules/chai/chai.js"></script>
    <script>mocha.setup('bdd');</script>
    <script>
      var assert = window.chai.assert;
    </script>
    <script>
    ${coverage}
    </script>
    <script src="./src/hello-world.spec.js"></script>
    <script>mocha.run();</script>
  </body>
</html>
`

/// read the code as string 
/// then instrument it using istanbul
async function instrumentCode() {
  const code = await fs.promises.readFile('./src/hello-world.js', 'utf-8')
  const instrumenter = createInstrumenter({ esModules: true, produceSourceMap: true })
  const result = instrumenter.instrumentSync(code, './src/hello-world.js')
  return result
}

app.use(`/src`, express.static('src'));
app.use(`/node_modules`, express.static(path.resolve('node_modules')));

app.all('/*', async function(req, res) {
  const coverage = await instrumentCode()
  res.send(html(coverage))
})

const server = http.createServer(app);
server.listen(PORT, HOST_NAME)
  .on('listening', function() {
    const { port, address } = server.address();
    console.log(`Express server started on port ${port} at ${address}.`); 
  })
})()