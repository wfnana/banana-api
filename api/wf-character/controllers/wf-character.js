"use strict";
const { sanitizeEntity } = require("strapi-utils");

/**
 * Read the documentation (https://strapi.io/documentation/3.0.0-beta.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  lookup: async ctx => {
    let entities = [];
    let filter = {
      $and: []
    };
    if (ctx.query.name) {
      const oRegex = new RegExp(ctx.query.name, "i");
      const query = await strapi.services["word-alias"].normalize(
        ctx.query.name
      );
      const regex = new RegExp(query, "i");

      filter.$and.push({
        $or: [
          {
            JPName: {
              $in: [oRegex, regex]
            }
          },
          {
            CNName: {
              $in: [oRegex, regex]
            }
          },
          {
            Nicknames: {
              $in: [oRegex, regex]
            }
          }
        ]
      });
    }
    if (ctx.query.attribute) {
      const oRegex = new RegExp(ctx.query.attribute, "i");
      const query = await strapi.services["word-alias"].normalize(
        ctx.query.attribute
      );
      const regex = new RegExp(query, "i");
      filter.$and.push({
        $or: [
          {
            JPAttribute: {
              $in: [oRegex, regex]
            }
          },
          {
            CNAttribute: {
              $in: [oRegex, regex]
            }
          },
          {
            ENAttribute: {
              $in: [oRegex, regex]
            }
          }
        ]
      });
    }
    if (ctx.query.ability) {
      const oRegex = new RegExp(ctx.query.ability, "i");
      const query = await strapi.services["word-alias"].normalize(
        ctx.query.ability
      );
      const regex = new RegExp(query, "i");
      filter.$and.push({
        $or: [
          {
            JPSkillDesc: {
              $in: [oRegex, regex]
            }
          },
          {
            ENSkillDesc: {
              $in: [oRegex, regex]
            }
          },
          {
            CNSkillDesc: {
              $in: [oRegex, regex]
            }
          },
          {
            JPAbility1: {
              $in: [oRegex, regex]
            }
          },
          {
            CNAbility1: {
              $in: [oRegex, regex]
            }
          },
          {
            ENAbility1: {
              $in: [oRegex, regex]
            }
          },
          {
            JPAbility2: {
              $in: [oRegex, regex]
            }
          },
          {
            CNAbility2: {
              $in: [oRegex, regex]
            }
          },
          {
            ENAbility2: {
              $in: [oRegex, regex]
            }
          },
          {
            JPAbility3: {
              $in: [oRegex, regex]
            }
          },
          {
            CNAbility3: {
              $in: [oRegex, regex]
            }
          },
          {
            ENAbility3: {
              $in: [oRegex, regex]
            }
          }
        ]
      });
    }
    if (filter.$and.length === 0) filter = {};
    const lookup = await strapi
      .query("wf-character")
      .model.find(filter)
      .exec();
    if (!!lookup) entities = entities.concat(lookup);
    return entities.map(entity =>
      sanitizeEntity(entity, { model: strapi.models["wf-character"] })
    );
  },
  scrapeData: async ctx => {
    const entities = await strapi.services.scraper.character();
    return entities.map(entity =>
      sanitizeEntity(entity, { model: strapi.models["wf-character"] })
    );
  },
  scrapeImage: async ctx => {
    const entities = await strapi.services.scraper.images();
    return entities;
  },
  downloadImage: async ctx => {
    const entities = await strapi.services.scraper.images();
    entities.map(function(entity) {
      const isXmas = String(entity.square).includes("_xm19");
      const isNewYear = String(entity.square).includes("_ny20");

      let middlePath = "";

      if (isXmas) middlePath = "xmas";
      if (isNewYear) middlePath = "newyear";

      download(entity.square, `${middlePath}/${name}`, "square", "png");
      download(entity.full_shot, `${middlePath}/${name}`, "full_shot", "png");
      download(entity.front, `${middlePath}/${name}`, "front", "gif");
      download(entity.special, `${middlePath}/${name}`, "special", "gif");
    });
    return entities;
  },
  initial: async ctx => {
    const entities = await strapi.services.scraper.character();
    const images = await strapi.services.scraper.images();
    for (let i = entities.length - 1; i >= 0; i--) {
      try {
        let character = entities[i];
        const query = {
          JPName: character.JPName,
          CNName: character.CNName,
          JPNickname: character.JPNickname,
          Rarity: character.Rarity,
          CNGet: character.CNGet
        };
        const imageIndex = Array.from(images).findIndex(function(image) {
          return (
            image.name === character.JPName &&
            image.attribute === character.JPAttribute
          );
        });
        if (imageIndex != -1) {
          entities[i].ImgSquareURL = images[imageIndex].square;
          entities[i].ImgFullShotURL = images[imageIndex].full_shot;
          entities[i].ImgFrontURL = images[imageIndex].front;
          entities[i].ImgSpecialURL = images[imageIndex].special;
          character = entities[i];
        } else {
          console.log(character);
        }
        // find if wf character is exist
        const WFCharacter = await strapi
          .query("wf-character")
          .model.findOne(query);
        if (WFCharacter) {
          character.Nicknames = Array.from(character.Nicknames || [])
            .concat(WFCharacter.Nicknames)
            .filter(function(Nickname, index, self) {
              return self.indexOf(Nickname) == index;
            });
          strapi.query("wf-character").update(query, character);
        } else {
          // try to create wf character
          strapi.query("wf-character").create(character);
        }
      } catch (err) {
        // do something if error occur
        console.debug(err);
      }
    }
    return entities.map(entity =>
      sanitizeEntity(entity, { model: strapi.models["wf-character"] })
    );
  }
};
