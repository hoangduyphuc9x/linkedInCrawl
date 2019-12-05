var express = require("express");
var router = express.Router();
// const app = require("express");
// const router = app.Router();
const _ = require("lodash");
const request = require("request");
const fetch = require("node-fetch");
const xpath = require("xpath");
const dom = require("xmldom").DOMParser;
const url = require("url");
const chalk = require("chalk");
const log = console.log;
const BoldLog = (logTitle, logDescrip) => {
  log(chalk.green.bold(logTitle) + " " + logDescrip);
};
const minGoogleCrawlTime = 25;
const maxGoogleCrawlTime = 45;
const minLinkedInCrawlTime = 6;
const maxLinkedInCrawlTime = 11;

/* GET home page. */
// router.get("/", function(req, res, next) {
//   res.render("index", { title: "Express" });
//   res.io.on("connection", socket => {
//     socket.emit("socketToMe", "wkefwke");
//   });
//   // res.io.sockets.emit("socketToMe", "usetrhtrrs");
// });

var profile_items = require("./mongooseSchemaSetup/mongooseSchema").model(
  "profile"
);
// var readdddd = require("./jsConfig").readFile;

var sleep = second => {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, second * 1000);
  });
};

var genRandomTime = (minTime, maxTime) => {
  var time = minTime + (maxTime - minTime) * Math.random();
  log(time);
  return time;
};

var asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
};

var parseURL = urlPath => {
  var pathName = url.parse(urlPath).pathname;
  var pathArray = pathName.substring(1, pathName.length).split("/");
  switch (pathArray.length) {
    case 1:
      return pathArray[0];
    case 2:
      return pathArray[1];
    case 3:
      return pathArray[1];
    default:
      return "";
  }
};

router.get("/", (req, res, next) => {
  var page = req.query.page;
  // var profilePerPage = _.toNumber(req.query.profilePerPage);
  // if (profilePerPage == undefined || profilePerPage == null) {
  //   profilePerPage = 5;
  // }
  if (page == undefined || page == null) {
    page = 1;
  }
  var profilePerPage = 5;
  profile_items
    .find({ body: { $ne: null } }, ["linkToAvatar", "publicIdentifier"])
    .skip((page - 1) * profilePerPage)
    .limit(profilePerPage)
    // .exec()
    .then(e => {
      e.forEach(ele => {
        log(ele);
        log(ele.linkToAvatar);
      });
      res.render("linkedInIndex.ejs", { body: e, page: page });
    })
    .catch(e => {
      log(e);
      res.render("error.ejs");
    });
});
router.get("/func", (req, res) => {
  res.io.on("connection", socket => {
    log("connected Funv");
    socket.emit("vul", { man: "man" });
  });
  res.send("vul");
});
router.get("/googleSearch", (req, res, next) => {
  res.io.on("connection", socket => {
    socket.emit("vul", { man: "man" });
  });
  // res.io.on("connection", socket => {
  var querySearchParam = req.query.querySearchParam;
  var startIndex = Number(req.query.startIndex);
  var endIndex = Number(req.query.endIndex);
  log(chalk.red.bold("QUERY"));
  log(req.query);
  log(req.url);

  if (querySearchParam != undefined) {
    var options = (querySearch, startIndex) => {
      return {
        headers: {
          accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3",
          "accept-language":
            "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7,fr-FR;q=0.6,fr;q=0.5,km;q=0.4",
          "sec-fetch-mode": "navigate",
          "sec-fetch-site": "same-origin",
          "sec-fetch-user": "?1",
          "upgrade-insecure-requests": "1",
          "x-client-data":
            "CKu1yQEIiLbJAQijtskBCKmdygEI4qjKAQjOsMoBCPe0ygEYq6TKARjYscoB"
        },
        method: "GET",
        url: `https://www.google.com/search?q=${querySearch}&start=${startIndex}`,
        body: null
      };
    };
    var requestWaterfall = async (querySearch, startIndex) => {
      BoldLog("Query Search", querySearch);
      BoldLog("Start Index", startIndex);
      BoldLog("End Index", endIndex);
      request(options(querySearch, startIndex), (err, result, body) => {
        if (!err) {
          var bodyXml = new dom().parseFromString(body);
          var searchResultNodes = xpath.select(
            "//div[@id='main']/div/div/div/a/@href",
            bodyXml
          );
          // socket.emit("func", { mon: "PIPIPIPIP" });
          searchResultNodes.forEach(resultNode => {
            var linkToProfile = resultNode.value.substring(
              resultNode.value.search("https:"),
              resultNode.value.search("&sa=")
            );
            BoldLog("Link To Profile:", linkToProfile);
            var publicIdentifier = parseURL(linkToProfile);
            if (publicIdentifier != "") {
              BoldLog("Public Identifier:", publicIdentifier);
              //da ton tai publicIdentifier hay chua?
              profile_items
                .findOne({
                  publicIdentifier: publicIdentifier
                })
                .then(res => {
                  if (res === null) {
                    profile_items
                      .insertMany({
                        publicIdentifier: publicIdentifier,
                        body: null,
                        querySearch: querySearch
                        // timeStamp:
                      })
                      .then(log)
                      .catch(log);
                  }
                })
                .catch(log);
            }
          });
        }
      });

      if (startIndex < endIndex) {
        startIndex += 10;
        await sleep(genRandomTime(minGoogleCrawlTime, maxGoogleCrawlTime));
        requestWaterfall(querySearch, startIndex);
      } else {
        log("DONE!");
      }
    };
    requestWaterfall(querySearchParam, startIndex);
  }
});

router.get("/mySQL", (req, res, next) => {
  //jocelynmalan eo fetch duoc
  // aileen-leela-mcclintock-872924139
  //nghien cuu di
  var cookie = req.query.cookie;

  log(req.query);
  const PushJsonToDB = async profileArray => {
    await asyncForEach(profileArray, async profile => {
      BoldLog("Identifier:", profile.publicIdentifier);
      await fetchData(profile.publicIdentifier);
      await sleep(genRandomTime(minLinkedInCrawlTime, maxLinkedInCrawlTime));
    });
    console.log("Done");
  };

  var fetchData = async publicIdentifier => {
    var response = await fetch(
      `https://www.linkedin.com/in/${publicIdentifier}`,
      {
        credentials: "include",
        headers: {
          cookie: cookie,
          accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3",
          "accept-language":
            "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7,fr-FR;q=0.6,fr;q=0.5,km;q=0.4",
          "cache-control": "max-age=0",
          "sec-fetch-mode": "navigate",
          "sec-fetch-site": "none",
          "sec-fetch-user": "?1",
          "upgrade-insecure-requests": "1"
        },
        referrerPolicy: "no-referrer-when-downgrade",
        body: null,
        method: "GET",
        mode: "cors"
      }
    );
    // log(response);
    // log(response == null);

    var xmlFromDom = new dom().parseFromString(await response.text());
    var codeNodes = xpath.select(
      '//code[starts-with(@id,"bpr-guid")]',
      xmlFromDom
    );
    if (Array.from(codeNodes).length > 0) {
      var resultArray = [];
      codeNodes.forEach(element => {
        var codeContentJSON = JSON.parse(element.textContent);
        var includedFromJson = codeContentJSON.included;
        if (includedFromJson != null && includedFromJson != undefined) {
          if (Array.from(includedFromJson).length > 0) {
            resultArray.push(JSON.stringify(codeContentJSON));
          }
        }
      });
      profile_items
        .findOneAndUpdate(
          { publicIdentifier: publicIdentifier },
          { body: resultArray }
        )
        .then(log)
        .catch(log);
    }
  };
  profile_items
    .find({ body: null })
    .then(res => {
      var IdentifierArray = [];
      res.forEach(e => {
        IdentifierArray.push(e);
      });
      PushJsonToDB(IdentifierArray);
    })
    .catch(log);
});

router.get("/in", (req, res, next) => {
  log(req.query.identifier);
  profile_items
    .findOne({ publicIdentifier: req.query.identifier })
    .then(e => {
      log(e.publicIdentifier);
      log(e.linkToAvatar);
      // fs.writeFile("nh.json", e.toString(), err => {
      //   if (err) log(err);
      // });
      // res.render("linkedInDetail.ejs", { body: e });
    })
    .catch(e => res.render("error.ejs"));

  // res.render("linkedInDetail.ejs", { body: {body:["fwwf","wffew"]} });
});

router.get("/test", (req, res, next) => {
  profile_items
    .findOne({ publicIdentifier: "minhchaudinh" })
    .then(e => {
      log(e.publicIdentifier);
      log(e.linkToAvatar);
      // fs.writeFile("nh.json", e.toString(), err => {
      //   if (err) log(err);
      // });
      res.render("bom.jade", { body: e });
    })
    .catch(e => res.render("error.ejs"));
});

router.get("/index", (req, res, next) => {
  res.io.on("connection", socket => {
    socket.emit("func", { man: "fnn" });
    log("connected");
  });
  // res.io.emit("func", { sam: "sam" });
  res.render("linkedInTest.ejs");
});

module.exports = router;
