// Mock for langchain/embeddings/openai
export class OpenAIEmbeddings {
  embedQuery = jest.fn().mockResolvedValue(Array(1536).fill(0.1));
  embedDocuments = jest.fn().mockResolvedValue([Array(1536).fill(0.1)]);
}
