const express = require("express");
const bodyParser = require("body-parser");
const partieRoutes = require("./routes/partieRoutes");

const app = express();
app.use(bodyParser.json());


app.use("/api/parties", partieRoutes);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});