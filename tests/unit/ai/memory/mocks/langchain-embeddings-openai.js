// Mock for langchain/embeddings/openai
module.exports = {
  OpenAIEmbeddings: class OpenAIEmbeddings {
    constructor() {}
    embedQuery(text) {
      return Promise.resolve([0.1, 0.2, 0.3]);
    }
    embedDocuments(documents) {
      return Promise.resolve(documents.map(() => [0.1, 0.2, 0.3]));
    }
  }
};
