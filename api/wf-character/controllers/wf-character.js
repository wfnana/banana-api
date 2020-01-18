"use strict";
const { sanitizeEntity } = require("strapi-utils");

/**
 * Read the documentation (https://strapi.io/documentation/3.0.0-beta.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  lookup: async ctx => {
    let entities = [];
    if (ctx.query.name) {
      const oldRegex = new RegExp(ctx.query.name, "i");
      const query = await strapi.services["word-alias"].normalize(
        ctx.query.name
      );
      const regex = new RegExp(query, "i");
      const lookup = await strapi
        .query("wf-character")
        .model.find({
          $or: [
            {
              JPName: {
                $in: [oldRegex, regex]
              }
            },
            {
              CNName: {
                $in: [oldRegex, regex]
              }
            },
            {
              Nicknames: {
                $in: [oldRegex, regex]
              }
            }
          ]
        })
        .exec();
      console.log(query, lookup);
      if (!!lookup) {
        entities = entities.concat(lookup);
      }
    }
    return entities.map(entity =>
      sanitizeEntity(entity, { model: strapi.models["wf-character"] })
    );
  },
  attribute: async ctx => {
    let entities = [];
    if (ctx.query.name) {
      const oldRegex = new RegExp(ctx.query.name, "i");
      const query = await strapi.services["word-alias"].normalize(
        ctx.query.name
      );
      const regex = new RegExp(query, "i");
      const lookup = await strapi
        .query("wf-character")
        .model.find({
          $or: [
            {
              JPAttribute: {
                $in: [oldRegex, regex]
              }
            },
            {
              CNAttribute: {
                $in: [oldRegex, regex]
              }
            },
            {
              ENAttribute: {
                $in: [oldRegex, regex]
              }
            }
          ]
        })
        .exec();
      console.log(query, lookup);
      if (!!lookup) {
        entities = entities.concat(lookup);
      }
    }
    return entities.map(entity =>
      sanitizeEntity(entity, { model: strapi.models["wf-character"] })
    );
  },
  scrape: async ctx => {
    const entities = await strapi.services.scraper.fetch();
    return entities.map(entity =>
      sanitizeEntity(entity, { model: strapi.models["wf-character"] })
    );
  },
  initial: async ctx => {
    const entities = await strapi.services.scraper.fetch();
    for (let i = entities.length - 1; i >= 0; i--) {
      try {
        const character = entities[i];
        const query = {
          JPName: character.JPName,
          CNName: character.CNName,
          JPNickname: character.JPNickname,
          Rarity: character.Rarity,
          CNGet: character.CNGet
        };
        // find if wf character is exist
        const WFCharacter = await strapi
          .query("wf-character")
          .model.findOne(query);
        if (WFCharacter) {
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
