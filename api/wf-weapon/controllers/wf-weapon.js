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
      const query = await strapi.services["word-alias"].normalize(
        ctx.query.name
      );
      const regex = new RegExp(query, "i");
      const lookup = await strapi
        .query("wf-weapon")
        .model.find({
          $or: [
            {
              JPName: {
                $in: [ctx.query.name, regex]
              }
            },
            {
              CNName: {
                $in: [ctx.query.name, regex]
              }
            },
            {
              ENName: {
                $in: [ctx.query.name, regex]
              }
            },
            {
              Nicknames: {
                $in: [ctx.query.name, regex]
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
      sanitizeEntity(entity, { model: strapi.models["wf-weapon"] })
    );
  },
  attribute: async ctx => {
    let entities = [];
    if (ctx.query.name) {
      // const query = await strapi.services["word-alias"].normalize(
      //   ctx.query.name
      // );
      // Should Not Normalize
      const query = ctx.query.name;
      const lookup = await strapi
        .query("wf-weapon")
        .model.find({
          $or: [
            {
              JPAttribute: {
                $in: [ctx.query.name, regex]
              }
            },
            {
              CNAttribute: {
                $in: [ctx.query.name, regex]
              }
            },
            {
              ENAttribute: {
                $in: [ctx.query.name, regex]
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
