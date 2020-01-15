"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/3.0.0-beta.x/concepts/services.html#core-services)
 * to customize this service
 */

module.exports = {
  normalize: async string => {
    const words = Array.from(string.split(""));
    return await Promise.all(
      words.reduce(async function(word) {
        const found = await strapi
          .query("word-alias")
          .model.find({
            alias: {
              $in: [word]
            }
          })
          .exec();
        if (!!found) return found.base;
        return word;
      }, "")
    );
  }
};
