"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/3.0.0-beta.x/concepts/services.html#core-services)
 * to customize this service
 */

module.exports = {
  normalize: async string => {
    const words = String(string).split("");

    let result = "";

    for (const word of words) {
      const found = await strapi
        .query("word-alias")
        .model.find({
          Alias: {
            $in: [word]
          }
        })
        .exec();
      if (found.length !== 0) result += found[0].base;
      else result += word;
    }

    return result;
  }
};
