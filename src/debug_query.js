require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const recordService = require("./services/recordService");

async function debug() {
  try {
    const model = "aaaa";
    const queryParams = { current: 1, pageSize: 10 };
    console.log("Running queryRecords...");
    const result = await recordService.queryRecords(model, queryParams);
    console.log("Result:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Caught Error in debug script:");
    console.error(error);
  } finally {
    process.exit();
  }
}

debug();
