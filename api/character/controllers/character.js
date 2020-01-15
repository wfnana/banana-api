"use strict";
const { sanitizeEntity } = require("strapi-utils");

/**
 * Read the documentation (https://strapi.io/documentation/3.0.0-beta.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  attribute: async ctx => {
    let entities = [];
    if (ctx.query.name) {
      const lookup = await strapi
        .query("character")
        .model.query(qb => {
          qb.where("JPAttribute", ctx.query.name)
            .orWhere("ENAttribute", ctx.query.name)
            .orWhere("CNAttribute", ctx.query.name);
        })
        .fetchAll();
      if (!!lookup) {
        entities = entities.concat(lookup.models);
      }
    }

    return entities.map(entity =>
      sanitizeEntity(entity, { model: strapi.models.character })
    );
  },
  lookup: async ctx => {
    let entities = [];
    if (ctx.query.name) {
      // const JPName = await strapi.services.character.find({
      //   JPName: ctx.query.name
      // });
      // const ENName = await strapi.services.character.find({
      //   ENName: ctx.query.name
      // });
      // const CNName = await strapi.services.character.find({
      //   CNName: ctx.query.name
      // });
      // entities = entities.concat(JPName, ENName, CNName);
      const lookup = await strapi
        .query("character")
        .model.query(qb => {
          qb.where("JPName", ctx.query.name)
            .orWhere("ENName", ctx.query.name)
            .orWhere("CNName", "LIKE", `%${ctx.query.name}%`)
            .orWhere("Nicknames", "LIKE", `%${ctx.query.name}%`);
        })
        .fetchAll();
      if (!!lookup) {
        entities = entities.concat(lookup.models);
      }
    }

    return entities.map(entity =>
      sanitizeEntity(entity, { model: strapi.models.character })
    );
  }
};
