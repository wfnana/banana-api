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
          character.Nicknames = Array.from(character.Nicknames)
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
