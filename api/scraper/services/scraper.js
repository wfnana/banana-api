"use strict";
const puppeteer = require("puppeteer");
const JSDOM = require("jsdom").JSDOM;
const axios = require("axios");
const fs = require("fs");
const path = require("path");

/**
 * Read the documentation (https://strapi.io/documentation/3.0.0-beta.x/concepts/services.html#core-services)
 * to customize this service
 */

function serializeTableLine(dom) {
  const columns = Array.from(dom.querySelectorAll("td"));
  const images = Array.from(dom.querySelectorAll("img"));
  return {
    columns,
    images
  };
}

function indicator(doms, word) {
  return doms.findIndex(function(dom) {
    return dom.innerHTML === word;
  });
}

function shouldStart(s) {
  const { columns } = s;
  return !!columns.find(function(dom) {
    return dom.innerHTML === "名稱";
  });
}

function isCharacter(s) {
  const { images } = s;
  return !!images[0];
}

function line1parser(s, c) {
  const { columns, images } = s;
  // Indicator
  const GetIndicator = indicator(columns, "取得方式");

  // Body
  c.Star = images[0] && images[0].src;
  c.fullbody = [images[1] && images[1].src, images[2] && images[2].src];
  c.CNGet = columns[GetIndicator + 1].innerHTML;
}

function line2parser(s, c) {
  const { columns, images } = s;
  // Indicator
  const HPIndicator = indicator(columns, "HP");
  const Names = String(columns[HPIndicator - 1].innerHTML).split("<br>");

  // Body
  c.ProPic = images[0] && images[0].src;
  c.JPName = String(Names[0]).replace(/\r?\n|\r/g, "");
  c.CNName = String(Names[1]).replace(/\r?\n|\r/g, "");
  c.HP = columns[HPIndicator + 1].innerHTML;
  c.CNDesc = columns[HPIndicator + 2].innerHTML;
}

function line3parser(s, c) {
  const { columns, images } = s;
  // Indicator
  const ATKIndicator = indicator(columns, "ATK");

  // Body
  c.ATK = columns[ATKIndicator + 1].innerHTML;
}

function line4parser(s, c) {
  const { columns, images } = s;
  // Indicator
  const NickIndicator = indicator(columns, "別稱");
  const RaceIndicator = indicator(columns, "種族");
  const Race = String(columns[RaceIndicator + 1].innerHTML).split("/");

  // Body
  c.JPNickname = columns[NickIndicator + 1].innerHTML;
  c.Race1 = Race.length > 0 ? Race[0] : undefined;
  c.Race2 = Race.length > 1 ? Race[1] : undefined;
}

function line5parser(s, c) {
  const { columns, images } = s;
  // Indicator
  const GenderIndicator = indicator(columns, "性別");

  // Body
  c.Gender = columns[GenderIndicator + 1].innerHTML;
  c.Weapon = images[0] && images[0].src;
}

function line6parser(s, c) {
  const { columns, images } = s;
  // Indicator
  const LeaderBuffIndicator = indicator(columns, "隊長特性");
  const leaderBuffName = columns[LeaderBuffIndicator + 1].innerHTML;
  const leaderBuffContent = columns[LeaderBuffIndicator + 2].innerHTML;

  // Body
  c.CNLeaderBuff = `【${leaderBuffName}】${leaderBuffContent.replace(
    "<br>",
    ""
  )}`;
}

function line7parser(s, c) {
  const { columns, images } = s;
  // Indicator
  const SkillIndicator = indicator(columns, "技能");
  const skillName = columns[SkillIndicator + 1].innerHTML;
  const skillContent = columns[SkillIndicator + 2].innerHTML;
  const skillCost = Array.from(skillName.match(/\d+/g) || []);

  // Body
  c.CNSkills = `【${skillName.split("<br>")[0]}】${skillContent.replace(
    "<br>",
    ""
  )}`;
  c.CNSkillName = skillName.split("<br>")[0];
  c.CNSkillDesc = skillContent.replace("<br>", "");
  c.SkillCost = skillCost.length > 0 ? skillCost[0] : 0;
}

function line8parser(s, c) {
  const { columns, images } = s;
  // Indicator
  const A1Indicator = indicator(columns, "能力 1");

  // Body
  c.CNAbility1 = columns[A1Indicator + 1].innerHTML;
}

function line9parser(s, c) {
  const { columns, images } = s;
  // Indicator
  const A2Indicator = indicator(columns, "能力 2");

  // Body
  c.CNAbility2 = columns[A2Indicator + 1].innerHTML;
}

function line10parser(s, c) {
  const { columns, images } = s;
  // Indicator
  const A3Indicator = indicator(columns, "能力 3");

  // Body
  c.CNAbility3 = columns[A3Indicator + 1].innerHTML;
}

const JPAttributeList = ["火", "水", "雷", "風", "闇", "光"];
const CNAttributeList = ["火", "水", "雷", "風", "暗", "光"];
const ENAttributeList = ["FIRE", "WATER", "THUNDER", "WIND", "DARK", "LIGHT"];

async function download(url, middlePath, name, ext) {
  const folder = path.join(
    __dirname,
    "..",
    "..",
    "..",
    "public",
    "download",
    "wf-characters",
    middlePath
  );
  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
  const fullpath = path.join(folder, `${name}.${ext}`);
  const writer = fs.createWriteStream(fullpath);
  const res = await axios({
    url: url,
    method: "GET",
    responseType: "stream"
  });

  res.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

module.exports = {
  images: async function() {
    // Start Broswer
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--single-process"]
    });
    // Create New Page
    const page = await browser.newPage();
    // Go to Search Path
    await page.goto("https://worldflipper.jp/character/?p=1");

    // Retreive Page Content
    const html = await page.content();
    const { window } = new JSDOM(html);
    const document = window.document;

    const list = Array.from(document.querySelectorAll("ul.char-list > li"));

    let data = [];
    list.map(function(character) {
      const squarePNG = character
        .querySelector("figure.icon img")
        .getAttribute("src");
      const fullShotPNG = squarePNG.replace("square_0.png", "full_shot_0.png");
      const info = character.querySelector("dl.info");
      const frontGIF = info.querySelector("img").getAttribute("src");
      const specialGIF = frontGIF.replace("front.gif", "special.gif");
      const name = info.querySelector("dd").innerHTML;

      const isXmas = String(squarePNG).includes("_xm19");
      const isNewYear = String(squarePNG).includes("_ny20");

      let middlePath = "";

      if (isXmas) middlePath = "xmas";
      if (isNewYear) middlePath = "newyear";

      download(squarePNG, `${middlePath}/${name}`, "square", "png");
      download(fullShotPNG, `${middlePath}/${name}`, "full_shot", "png");
      download(frontGIF, `${middlePath}/${name}`, "front", "gif");
      download(specialGIF, `${middlePath}/${name}`, "special", "gif");
      data.push({
        name: name,
        square: squarePNG,
        full_shot: fullShotPNG,
        front: frontGIF,
        special: specialGIF
      });
    });

    return data;
  },
  character: async function() {
    // Start Browser
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--single-process"]
    });
    // Create New Page
    const page = await browser.newPage();
    // Go to Search Path
    await page.goto(
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vS5OvhecdUnTXEeO2fpdERfiZh3PzadSoGcpQ1IEhAPCSfcv2iLk7p0V7MFiZ7AZNnPVRSzUsRI5Wye/pubhtml#"
    );

    // Retreive Page Content
    const html = await page.content();
    const { window } = new JSDOM(html);
    const document = window.document;

    // Mapper
    const RarityMapper = {};
    const WeaponMapper = {};

    const tables = Array.from(
      document.querySelectorAll("#sheets-viewport > div")
    );

    let data = [];

    tables.map(function(table, tableIndex) {
      // Index start with 0
      if (tableIndex > 5) return;

      const lines = Array.from(
        table.querySelectorAll(".grid-container tbody tr")
      );

      data = lines.reduce(function(arr, dom, index) {
        const s = serializeTableLine(dom);
        if (shouldStart(s) && isCharacter(s)) {
          const character = {
            JPAttribute: JPAttributeList[tableIndex],
            CNAttribute: CNAttributeList[tableIndex],
            ENAttribute: ENAttributeList[tableIndex]
          };
          line1parser(serializeTableLine(lines[index]), character);
          line2parser(serializeTableLine(lines[index + 1]), character);
          line3parser(serializeTableLine(lines[index + 2]), character);
          line4parser(serializeTableLine(lines[index + 3]), character);
          line5parser(serializeTableLine(lines[index + 4]), character);
          line6parser(serializeTableLine(lines[index + 5]), character);
          line7parser(serializeTableLine(lines[index + 6]), character);
          line8parser(serializeTableLine(lines[index + 7]), character);
          line9parser(serializeTableLine(lines[index + 8]), character);
          line10parser(serializeTableLine(lines[index + 9]), character);

          // Images

          let middlepath = "/";
          if (character.CNGet.includes("新年")) middlepath = "/new-year-eve/";
          if (character.CNGet.includes("聖誕")) middlepath = "/christmas/";
          character.GifURL = encodeURIComponent(
            `/assets/wf-characters${middlepath}${character.JPName}.gif`
          );
          character.SpriteURL = encodeURIComponent(
            `/assets/wf-characters${middlepath}${character.JPName}.png`
          );

          if (character.JPName === "ヴァーグナー") {
            RarityMapper[character.Star] = 5;
            WeaponMapper[character.Weapon] = "射撃";
          }

          if (character.JPName === "アルク") {
            RarityMapper[character.Star] = 4;
            WeaponMapper[character.Weapon] = "剣士";
          }

          if (character.JPName === "リリル") {
            RarityMapper[character.Star] = 3;
            WeaponMapper[character.Weapon] = "特殊";
          }

          if (character.JPName === "ゴーレム") {
            RarityMapper[character.Star] = 2;
            WeaponMapper[character.Weapon] = "格闘";
          }

          if (character.JPName === "ファイアスピリ") {
            RarityMapper[character.Star] = 1;
            WeaponMapper[character.Weapon] = "補助";
          }

          arr.push(character);
        }
        return arr;
      }, data);
    });

    return data.map(function(character) {
      // remove any html tag if found
      character.CNName = character.CNName.replace(/<.*?>/g, "");
      character.CNGet = character.CNGet.replace(/<.*?>/g, "");
      character.CNLeaderBuff = character.CNLeaderBuff.replace(
        /<.*?>/g,
        ""
      ).replace(/&amp;/g, "&");
      character.CNSkillDesc = character.CNSkillDesc.replace(
        /<.*?>/g,
        ""
      ).replace(/&amp;/g, "&");
      character.CNAbility1 = character.CNAbility1.replace(/<.*?>/g, "").replace(
        /&amp;/g,
        "&"
      );
      character.CNAbility2 = character.CNAbility2.replace(/<.*?>/g, "").replace(
        /&amp;/g,
        "&"
      );
      character.CNAbility3 = character.CNAbility3.replace(/<.*?>/g, "").replace(
        /&amp;/g,
        "&"
      );

      character.Rarity = RarityMapper[character.Star];
      character.JPWeapon = WeaponMapper[character.Weapon];
      character.CNWeapon = WeaponMapper[character.Weapon];
      return character;
    });
  }
};
