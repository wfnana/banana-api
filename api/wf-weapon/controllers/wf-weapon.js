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
            ENName: {
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
            CNSkill: {
              $in: [oRegex, regex]
            }
          },
          {
            CNMaxSkill: {
              $in: [oRegex, regex]
            }
          }
        ]
      });
    }
    if (filter.$and.length === 0) filter = {};
    const lookup = await strapi
      .query("wf-weapon")
      .model.find(filter)
      .exec();
    if (!!lookup) entities = entities.concat(lookup);
    return entities.map(entity =>
      sanitizeEntity(entity, { model: strapi.models["wf-weapon"] })
    );
  },
  initial: async ctx => {
    const entities = await require("../../../public/assets/Weapon.json");

    for (let i = entities.length - 1; i >= 0; i--) {
      try {
        const weapon = entities[i];
        const Name = String(weapon.ENName)
          .toLowerCase()
          .replace(/\'/g, "")
          .replace(/\s/g, "_");
        weapon.ImgUrl = encodeURIComponent(`/assets/wf-weapons/${Name}.jpg`);
        weapon.ENAttribute = String(weapon.ENAttribute).toUpperCase();

        const query = {
          JPName: weapon.JPName,
          CNName: weapon.CNName,
          Rarity: weapon.Rarity,
          CNGet: weapon.CNGet
        };
        // find if wf weapon is exist
        const WFWeapon = await strapi.query("wf-weapon").model.findOne(query);
        if (WFWeapon) {
          weapon.Nicknames = Array.from(weapon.Nicknames || [])
            .concat(WFWeapon.Nicknames)
            .filter(function(Nickname, index, self) {
              return self.indexOf(Nickname) == index;
            });
          strapi.query("wf-weapon").update(query, weapon);
        } else {
          // try to create wf weapon
          strapi.query("wf-weapon").create(weapon);
        }
      } catch (err) {
        // do something if error occur
        console.debug(err);
      }
    }

    return entities.map(entity =>
      sanitizeEntity(entity, { model: strapi.models["wf-weapon"] })
    );
  }
};
