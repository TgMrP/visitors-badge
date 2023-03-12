const express = require("express");

const app = express();
const fs = require("fs");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

require("dotenv").config();

// init sqlite db
const dbFile = "./data.db";
const exists = fs.existsSync(dbFile);
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(dbFile);

db.serialize(() => {
  if (!exists) {
    db.run(
      "CREATE TABLE Badge (id INTEGER PRIMARY KEY AUTOINCREMENT, page String, count Intger)"
    );
    console.log("New table Badge created!");
  } else {
    console.log('Database "Badge" ready to go!');
    db.each("SELECT * from Badge", (err, row) => {
      if (row) {
        console.log(`record: ${row.page} - ${row.count}`);
      }
    });
  }
});

function getSvg(count = 0) {
  return `
  <svg height="20" width="${
    18.92 * count.length
  }" xmlns="http://www.w3.org/2000/svg">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="a">
    <rect fill="#fff" height="20" rx="3" width="94.6"/>
  </clipPath>
  <g clip-path="url(#a)">
    <path fill="#555" d="M0 0h49.6v20H0z"/>
    <path fill="#007ec6" d="M49.6 0h45v20h-45z"/>
    <path fill="url(#b)" d="M0 0h94.6v20H0z"/>
  </g>
  <g fill="#fff" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="110" text-anchor="middle">
    <text fill="#010101" fill-opacity=".3" textLength="396" x="258" y="150" transform="scale(.1)">
      visitors
    </text>
    <text textLength="396" x="258" y="140" transform="scale(.1)">
      visitors
    </text>
    <text fill="#010101" fill-opacity=".3" textLength="${
      50 * count.legnth
    }" x="711" y="150" transform="scale(.1)">
      ${count}
    </text>
    <text textLength="${
      50 * count.legnth
    }" x="711" y="140" transform="scale(.1)">
      ${count}
    </text>
  </g>
</svg>`;
}

function sqlAll(sql_statement) {
  return new Promise((resolve, reject) => {
    db.all(sql_statement, (err, rows) => {
      return err ? reject(err) : resolve(rows);
    });
  });
}

app.get("/", async (request, response) => {
  response.setHeader("Content-Type", "image/svg+xml");
  response.set("Cache-Control", "public, max-age=0");

  let count = 0;
  let res = response;
  const id = request.query && request.query.id ? request.query.id : 0;

  let row = await sqlAll(`SELECT * FROM Badge WHERE page = '${id}';`);
  row = row[0];
  if (row) {
    count = +row.count + 1;
    db.run("UPDATE Badge SET count = $count WHERE id = $id", {
      $id: row.id,
      $count: count,
    });
  } else {
    count = 1;
    const cleanPage = cleanseString(id);
    if (cleanPage === "tgmrp") {
      count = 96350;
    }
    db.run(
      `INSERT INTO Badge (page, count) VALUES (?, ?)`,
      [cleanPage, count],
      (error) => {
        if (!error) {
          console.log(`Added ${id}`);
        }
      }
    );
  }
  res.end(getSvg(count));
});

const cleanseString = function (string) {
  return string.replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

var listener = app.listen(process.env.PORT, () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
});
